// src/app/services/offline-queue.service.ts
import { Injectable } from '@angular/core';
import { Observable, of, from, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { IndexedDBService } from './indexed-db.service';
import { NetworkService, ConnectionStatus } from './network.service';
import { NotificationService } from './notification.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export enum OperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

export interface PendingOperation {
  id?: number;
  entityType: string;
  entityId?: number | string;
  operationType: OperationType;
  payload: any;
  timestamp: number;
  tempId?: number;
  isOfflinePending?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineQueueService {
  private syncInProgress = false;
  private apiUrl = environment.apiUrl;

  constructor(
    private indexedDBService: IndexedDBService,
    private networkService: NetworkService,
    private notificationService: NotificationService,
    private http: HttpClient
  ) {
    // Listen for online status to trigger sync
    this.networkService.status$.subscribe(status => {
      if (status === ConnectionStatus.Online && !this.syncInProgress) {
        this.syncPendingOperations();
      }
    });
  }

  // Queue a pending operation
  queueOperation(operation: PendingOperation): Observable<PendingOperation> {
    operation.timestamp = Date.now();
    return this.indexedDBService.put<PendingOperation>('pendingOperations', operation);
  }

  // Get all pending operations
  getPendingOperations(): Observable<PendingOperation[]> {
    return this.indexedDBService.getAll<PendingOperation>('pendingOperations');
  }

  // Remove a pending operation
  removePendingOperation(id: number): Observable<boolean> {
    return this.indexedDBService.delete('pendingOperations', id);
  }

  // Sync all pending operations
  syncPendingOperations(): void {
    if (this.syncInProgress || !this.networkService.isOnline) {
      return;
    }

    this.syncInProgress = true;

    this.getPendingOperations().subscribe({
      next: operations => {
        if (operations.length === 0) {
          this.syncInProgress = false;
          return;
        }

        this.notificationService.show('Syncing offline changes...', 'info');

        // Sort operations by timestamp (oldest first)
        operations.sort((a, b) => a.timestamp - b.timestamp);

        // Process each operation sequentially
        this.processNextOperation(operations, 0);
      },
      error: error => {
        console.error('Error getting pending operations:', error);
        this.syncInProgress = false;
      }
    });
  }

  private processNextOperation(operations: PendingOperation[], index: number): void {
    if (index >= operations.length) {
      this.syncInProgress = false;
      this.notificationService.show('All changes synced successfully!', 'success');
      return;
    }

    const operation = operations[index];

    // Execute the operation based on the service and operation type
    this.executeOperation(operation).subscribe({
      next: () => {
        // Operation succeeded, remove from queue
        this.removePendingOperation(operation.id!).subscribe(() => {
          // Process next operation
          this.processNextOperation(operations, index + 1);
        });
      },
      error: error => {
        console.error('Error syncing operation:', error);

        // If server is down, stop syncing
        if (!this.networkService.isOnline) {
          this.syncInProgress = false;
          this.notificationService.show('Network connection lost. Sync paused.', 'error');
          return;
        }

        // If it's a server error, we'll try again next time
        // For now, let's continue with the next operation
        this.processNextOperation(operations, index + 1);
      }
    });
  }

  private executeOperation(operation: PendingOperation): Observable<any> {
    switch (operation.entityType) {
      case 'listing':
        return this.processListingOperation(operation);
      case 'message':
        return this.processMessageOperation(operation);
      default:
        return throwError(() => new Error(`Unknown entity type: ${operation.entityType}`));
    }
  }

  private processListingOperation(operation: PendingOperation): Observable<any> {
    const apiUrl = `${this.apiUrl}/listings`;

    switch (operation.operationType) {
      case OperationType.CREATE:
        // For create operations, we need to convert the payload to FormData
        const createFormData = this.convertToFormData(operation.payload);
        return this.http.post(apiUrl, createFormData);

      case OperationType.UPDATE:
        // For update operations, we need to convert the payload to FormData
        const updateFormData = this.convertToFormData(operation.payload);
        return this.http.put(`${apiUrl}/${operation.entityId}`, updateFormData);

      case OperationType.DELETE:
        return this.http.delete(`${apiUrl}/${operation.entityId}`);

      default:
        return throwError(() => new Error(`Unknown operation type: ${operation.operationType}`));
    }
  }

  private processMessageOperation(operation: PendingOperation): Observable<any> {
    const apiUrl = `${this.apiUrl}/chat`;

    switch (operation.operationType) {
      case OperationType.CREATE:
        return this.http.post(`${apiUrl}/messages`, operation.payload);

      default:
        return throwError(() => new Error(`Unknown operation type: ${operation.operationType}`));
    }
  }

  private convertToFormData(payload: any): FormData {
    const formData = new FormData();

    // Add all primitive fields to formData
    for (const key in payload) {
      if (payload.hasOwnProperty(key) && payload[key] !== null && payload[key] !== undefined) {
        // Skip file uploads and complex objects - these need special handling
        if (typeof payload[key] !== 'object' || payload[key] instanceof File) {
          formData.append(key, payload[key]);
        }
      }
    }

    // Handle photos array if present
    if (payload.photos && Array.isArray(payload.photos)) {
      payload.photos.forEach((photo: File, index: number) => {
        if (photo instanceof File) {
          formData.append(`Photos`, photo);
        }
      });
    }

    return formData;
  }
}
