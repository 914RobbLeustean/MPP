// src/app/components/shared/network-status/network-status.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { NetworkService, ConnectionStatus } from '../../../services/network.service';

@Component({
  selector: 'app-network-status',
  templateUrl: './network-status.component.html',
  styleUrls: ['./network-status.component.scss']
})
export class NetworkStatusComponent implements OnInit, OnDestroy {
  connectionStatus: ConnectionStatus = ConnectionStatus.Online;
  private statusSubscription: Subscription | null = null;

  // For template comparison
  ConnectionStatus = ConnectionStatus;

  constructor(private networkService: NetworkService) { }

  ngOnInit(): void {
    this.statusSubscription = this.networkService.status$.subscribe(
      status => this.connectionStatus = status
    );
  }

  ngOnDestroy(): void {
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
  }

  checkConnection(): void {
    this.networkService.checkConnection();
  }
}
