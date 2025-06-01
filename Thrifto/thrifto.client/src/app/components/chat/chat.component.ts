// src/app/components/chat/chat.component.ts
import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { UserService } from '../../services/user.service';
import { ChatMessage, Conversation } from '../../models/chat-message.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  conversations: Conversation[] = [];
  activeConversation: Conversation | null = null;
  activeUser: User | null = null;
  messages: ChatMessage[] = [];
  newMessage: string = '';

  isLoadingConversations = true;
  isLoadingMessages = false;

  constructor(
    private chatService: ChatService,
    private userService: UserService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.loadConversations();

    // Subscribe to real-time messages
    this.chatService.onMessageReceived().subscribe(message => {
      if (this.activeConversation && message.senderId === this.activeConversation.userId) {
        this.messages.push(message);
        this.scrollToBottom();
      }

      // Refresh conversations to update unread counts and last messages
      this.loadConversations();
    });

    // Check if there's a user ID in the route params
    this.route.params.subscribe(params => {
      const userId = params['userId'];
      if (userId) {
        this.loadUserAndSelectConversation(userId);
      }
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  loadConversations(): void {
    this.isLoadingConversations = true;

    this.chatService.getConversations().subscribe({
      next: (conversations) => {
        this.conversations = conversations;
        this.isLoadingConversations = false;

        // If there's an active conversation, update it with the new data
        if (this.activeConversation) {
          const updatedConversation = this.conversations.find(c => c.userId === this.activeConversation?.userId);
          if (updatedConversation) {
            this.activeConversation = updatedConversation;
          }
        }
      },
      error: (error) => {
        console.error('Error loading conversations', error);
        this.isLoadingConversations = false;
      }
    });
  }

  loadUserAndSelectConversation(userId: string): void {
    this.userService.getUserById(userId).subscribe({
      next: (user) => {
        this.activeUser = user;

        // Check if there's an existing conversation with this user
        const existingConversation = this.conversations.find(c => c.userId === userId);

        if (existingConversation) {
          this.selectConversation(existingConversation);
        } else {
          // Create a new conversation object
          const newConversation: Conversation = {
            userId: user.id,
            username: user.username,
            lastMessage: '',
            lastMessageTimestamp: new Date(),
            unreadCount: 0
          };

          this.selectConversation(newConversation);
        }
      },
      error: (error) => {
        console.error('Error loading user', error);
      }
    });
  }

  selectConversation(conversation: Conversation): void {
    this.activeConversation = conversation;
    this.loadMessages();

    // Mark messages as read if there are unread messages
    if (conversation.unreadCount > 0) {
      this.chatService.markAsRead(conversation.userId).subscribe({
        next: () => {
          conversation.unreadCount = 0;
        },
        error: (error) => {
          console.error('Error marking messages as read', error);
        }
      });
    }
  }

  loadMessages(): void {
    if (!this.activeConversation) return;

    this.isLoadingMessages = true;

    this.chatService.getMessages(this.activeConversation.userId).subscribe({
      next: (messages) => {
        this.messages = messages;
        this.isLoadingMessages = false;
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error loading messages', error);
        this.isLoadingMessages = false;
      }
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.activeConversation) return;

    // Send via WebSocket for real-time updates
    this.chatService.sendMessageViaSocket(this.activeConversation.userId, this.newMessage);

    // Also send via HTTP for persistence
    this.chatService.sendMessage(this.activeConversation.userId, this.newMessage).subscribe({
      next: (message) => {
        this.messages.push(message);

        // Update the active conversation's last message
        if (this.activeConversation) {
          this.activeConversation.lastMessage = message.content;
          this.activeConversation.lastMessageTimestamp = message.timestamp;
        }

        this.newMessage = '';
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error sending message', error);
      }
    });
  }

  scrollToBottom(): void {
    try {
      if (this.messageContainer) {
        this.messageContainer.nativeElement.scrollTop =
          this.messageContainer.nativeElement.scrollHeight;
      }
    } catch (err) { }
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
