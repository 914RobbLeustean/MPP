// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { NetworkService, ConnectionStatus } from './services/network.service';
import { OfflineQueueService } from './services/offline-queue.service';
import { SignalrService } from './services/signalr.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Thrifto';

  constructor(
    private signalrService: SignalrService,
    private networkService: NetworkService,
    private offlineQueueService: OfflineQueueService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    // Initialize network monitoring
    this.networkService.status$.subscribe(status => {
      console.log('Network status:', status);

      // Manage SignalR connection based on network status
      if (status === ConnectionStatus.Online && this.authService.isLoggedIn()) {
        this.initializeSignalRConnection();
      } else {
        // Disconnect SignalR if network is down or server is down
        this.signalrService.stopConnection();
      }
    });

    // Setup window focus event to check connection when tab becomes active
    window.addEventListener('focus', () => {
      this.networkService.checkConnection();
    });

    // Listen for auth state changes to manage SignalR connection
    this.authService.currentUser$.subscribe(user => {
      if (user && this.networkService.isOnline) {
        this.initializeSignalRConnection();
      } else if (!user) {
        this.signalrService.stopConnection();
      }
    });

    // Initial connection if conditions are right
    if (this.networkService.isOnline && this.authService.isLoggedIn()) {
      this.initializeSignalRConnection();
    }
  }

  private initializeSignalRConnection(): void {
    this.signalrService.startConnection()
      .then(() => console.log('SignalR connected successfully'))
      .catch(err => console.error('Error connecting to SignalR:', err));
  }
}
