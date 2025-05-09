// src/app/services/chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { ChatMessage, Conversation } from '../models/chat-message.model';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = `${environment.apiUrl}/chat`;
  private hubConnection: WebSocket | null = null;
  private messageReceived = new Subject<ChatMessage>();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.connectToHub();
      } else if (this.hubConnection) {
        this.hubConnection.close();
        this.hubConnection = null;
      }
    });
  }

  public onMessageReceived(): Observable<ChatMessage> {
    return this.messageReceived.asObservable();
  }

  private connectToHub(): void {
    const token = this.authService.getToken();
    if (!token) return;

    this.hubConnection = new WebSocket(`${environment.wsUrl}?access_token=${token}`);

    this.hubConnection.onopen = () => {
      console.log('WebSocket connection established');
    };

    this.hubConnection.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'ReceiveMessage') {
        this.messageReceived.next(data.message);
      }
    };

    this.hubConnection.onclose = () => {
      console.log('WebSocket connection closed');
      // Try to reconnect after a delay
      setTimeout(() => this.connectToHub(), 5000);
    };

    this.hubConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.apiUrl}/conversations`);
  }

  getMessages(userId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/messages/${userId}`);
  }

  sendMessage(receiverId: string, content: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.apiUrl}/messages`, {
      receiverId,
      content
    });
  }

  markAsRead(userId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/read/${userId}`, {});
  }

  sendMessageViaSocket(receiverId: string, content: string): void {
    if (this.hubConnection && this.hubConnection.readyState === WebSocket.OPEN) {
      this.hubConnection.send(JSON.stringify({
        type: 'SendMessage',
        receiverId,
        content
      }));
    } else {
      console.error('WebSocket is not connected');
    }
  }
}
