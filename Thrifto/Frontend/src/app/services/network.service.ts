// src/app/services/network.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, fromEvent, merge, of } from 'rxjs';
import { map, catchError, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export enum ConnectionStatus {
  Online = 'ONLINE',
  Offline = 'OFFLINE',
  ServerDown = 'SERVER_DOWN'
}

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private connectionStatus = new BehaviorSubject<ConnectionStatus>(ConnectionStatus.Online);
  private serverCheckInterval = 30000; // 30 seconds
  private serverCheckTimer: any;

  constructor(private http: HttpClient) {
    this.initializeNetworkListeners();
    this.checkServerStatus();
  }

  get status$(): Observable<ConnectionStatus> {
    return this.connectionStatus.asObservable().pipe(
      distinctUntilChanged()
    );
  }

  get isOnline(): boolean {
    return this.connectionStatus.value === ConnectionStatus.Online;
  }

  get isOffline(): boolean {
    return this.connectionStatus.value === ConnectionStatus.Offline;
  }

  get isServerDown(): boolean {
    return this.connectionStatus.value === ConnectionStatus.ServerDown;
  }

  private initializeNetworkListeners(): void {
    // Browser online/offline events
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));

    merge(online$, offline$)
      .pipe(debounceTime(300))
      .subscribe(isOnline => {
        if (!isOnline) {
          this.connectionStatus.next(ConnectionStatus.Offline);
          clearTimeout(this.serverCheckTimer);
        } else {
          // When back online, check server status
          this.checkServerStatus();
        }
      });
  }

  private checkServerStatus(): void {
    if (navigator.onLine) {
      // Use a health endpoint that should always respond quickly
      this.http.get(`${environment.apiUrl}/health`, { responseType: 'text' })
        .pipe(
          catchError(() => of('error'))
        )
        .subscribe(response => {
          if (response === 'error') {
            this.connectionStatus.next(ConnectionStatus.ServerDown);
          } else {
            this.connectionStatus.next(ConnectionStatus.Online);
          }

          // Schedule next check
          this.serverCheckTimer = setTimeout(() => this.checkServerStatus(), this.serverCheckInterval);
        });
    }
  }

  // Force a check of the server status
  public checkConnection(): void {
    this.checkServerStatus();
  }
}
