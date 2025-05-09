// src/app/services/signalr.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Listing } from '../models/listing.model';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection: signalR.HubConnection | null = null;
  private newListingSubject = new BehaviorSubject<Listing | null>(null);
  private listingUpdateSubject = new BehaviorSubject<Listing | null>(null);
  private listingDeleteSubject = new BehaviorSubject<number | null>(null);
  private chartUpdateSubject = new BehaviorSubject<any | null>(null);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  get newListing$(): Observable<Listing | null> {
    return this.newListingSubject.asObservable();
  }

  get listingUpdate$(): Observable<Listing | null> {
    return this.listingUpdateSubject.asObservable();
  }

  get listingDelete$(): Observable<number | null> {
    return this.listingDeleteSubject.asObservable();
  }

  get chartUpdate$(): Observable<any | null> {
    return this.chartUpdateSubject.asObservable();
  }

  startConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${environment.apiUrl}/hubs/listing`, {
          accessTokenFactory: () => this.authService.getToken() || ''
        })
        .withAutomaticReconnect()
        .build();

      this.hubConnection
        .start()
        .then(() => {
          console.log('SignalR Connection started');
          this.registerSignalRHandlers();
          resolve();
        })
        .catch(err => {
          console.error('Error while starting SignalR connection: ', err);
          reject(err);
        });
    });
  }

  stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop()
        .then(() => console.log('SignalR Connection stopped'))
        .catch(err => console.error('Error while stopping SignalR connection: ', err));
    }
  }

  private registerSignalRHandlers(): void {
    if (!this.hubConnection) return;

    this.hubConnection.on('ReceiveNewListing', (listing: Listing) => {
      console.log('New listing received:', listing);
      this.newListingSubject.next(listing);
    });

    this.hubConnection.on('ReceiveListingUpdate', (listing: Listing) => {
      console.log('Listing update received:', listing);
      this.listingUpdateSubject.next(listing);
    });

    this.hubConnection.on('ReceiveListingDelete', (listingId: number) => {
      console.log('Listing delete received:', listingId);
      this.listingDeleteSubject.next(listingId);
    });

    this.hubConnection.on('ReceiveChartUpdate', (chartData: any) => {
      console.log('Chart update received:', chartData);
      this.chartUpdateSubject.next(chartData);
    });
  }
}
