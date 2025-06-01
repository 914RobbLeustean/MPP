// src/app/app.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { NetworkService, ConnectionStatus } from './services/network.service';
//import { OfflineQueueService } from './services/offline-queue.service'; //REMOVED DUE TO UNNECESSARY NOTIFICATIONS
import { SignalrService } from './services/signalr.service';
import { AuthService } from './services/auth.service';
import { ViewportScroller } from '@angular/common';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
    title = 'Thrifto';
    private routerSubscription!: Subscription; // Fixed with definite assignment assertion

    constructor(
        private router: Router,
        private viewportScroller: ViewportScroller,
        private signalrService: SignalrService,
        private networkService: NetworkService,
        //private offlineQueueService: OfflineQueueService, //REMOVED DUE TO UNNECESSARY NOTIFICATIONS
        private authService: AuthService
    ) { }

    ngOnInit() {
        // AGGRESSIVE SCROLL TO TOP - Fixed typing
        this.routerSubscription = this.router.events.pipe(
            filter((event): event is NavigationEnd => event instanceof NavigationEnd)
        ).subscribe((event: NavigationEnd) => {
            // Method 1: ViewportScroller
            this.viewportScroller.scrollToPosition([0, 0]);

            // Method 2: Direct window scroll
            window.scrollTo(0, 0);

            // Method 3: Scroll with delay to ensure DOM is ready
            setTimeout(() => {
                window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
            }, 0);

            // Method 4: Additional delay for stubborn cases
            setTimeout(() => {
                window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            }, 10);
        });

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

    ngOnDestroy() {
        if (this.routerSubscription) {
            this.routerSubscription.unsubscribe();
        }
    }

    private initializeSignalRConnection(): void {
        this.signalrService.startConnection()
            .then(() => console.log('SignalR connected successfully'))
            .catch(err => console.error('Error connecting to SignalR:', err));
    }
}