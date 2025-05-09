// src/app/services/feedback.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Feedback } from '../models/feedback.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private apiUrl = `${environment.apiUrl}/feedback`;

  constructor(private http: HttpClient) { }

  getUserFeedback(userId: string): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(`${this.apiUrl}/user/${userId}`);
  }

  getUserRating(userId: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/user/${userId}/rating`);
  }

  createFeedback(feedbackData: { userId: string, rating: number, comment?: string }): Observable<Feedback> {
    return this.http.post<Feedback>(this.apiUrl, feedbackData);
  }
}
