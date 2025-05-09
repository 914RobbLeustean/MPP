// src/app/services/indexed-db.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Listing } from '../models/listing.model';
import { ChatMessage, Conversation } from '../models/chat-message.model';

@Injectable({
  providedIn: 'root'
})
export class IndexedDBService {
  private dbName = 'thrifto-offline-db';
  private db: IDBDatabase | null = null;
  private dbVersion = 1;

  constructor() {
    this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    if (this.db) {
      return Promise.resolve(this.db);
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('listings')) {
          const listingStore = db.createObjectStore('listings', { keyPath: 'id' });
          listingStore.createIndex('userId', 'userId', { unique: false });
          listingStore.createIndex('quality', 'quality', { unique: false });
        }

        if (!db.objectStoreNames.contains('pendingOperations')) {
          const pendingStore = db.createObjectStore('pendingOperations', { keyPath: 'id', autoIncrement: true });
          pendingStore.createIndex('entityType', 'entityType', { unique: false });
          pendingStore.createIndex('operationType', 'operationType', { unique: false });
        }

        if (!db.objectStoreNames.contains('messages')) {
          const messagesStore = db.createObjectStore('messages', { keyPath: 'id' });
          messagesStore.createIndex('senderId', 'senderId', { unique: false });
        }

        if (!db.objectStoreNames.contains('conversations')) {
          const conversationsStore = db.createObjectStore('conversations', { keyPath: 'userId' });
        }

        if (!db.objectStoreNames.contains('user')) {
          db.createObjectStore('user', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject('Error opening IndexedDB: ' + (event.target as IDBOpenDBRequest).error);
      };
    });
  }

  // Get data from a store by key
  get<T>(storeName: string, key: any): Observable<T> {
    return from(this.initDB()
      .then(db => {
        return new Promise<T>((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const request = store.get(key);

          request.onsuccess = () => {
            resolve(request.result);
          };

          request.onerror = () => {
            reject(request.error);
          };
        });
      }))
      .pipe(
        catchError(error => throwError(() => `Error getting data from IndexedDB: ${error}`))
      );
  }

  // Get all data from a store
  getAll<T>(storeName: string): Observable<T[]> {
    return from(this.initDB()
      .then(db => {
        return new Promise<T[]>((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const request = store.getAll();

          request.onsuccess = () => {
            resolve(request.result);
          };

          request.onerror = () => {
            reject(request.error);
          };
        });
      }))
      .pipe(
        catchError(error => throwError(() => `Error getting all data from IndexedDB: ${error}`))
      );
  }

  // Get data by index
  getByIndex<T>(storeName: string, indexName: string, value: any): Observable<T[]> {
    return from(this.initDB()
      .then(db => {
        return new Promise<T[]>((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const index = store.index(indexName);
          const request = index.getAll(value);

          request.onsuccess = () => {
            resolve(request.result);
          };

          request.onerror = () => {
            reject(request.error);
          };
        });
      }))
      .pipe(
        catchError(error => throwError(() => `Error getting data by index from IndexedDB: ${error}`))
      );
  }

  // Add or update data in a store
  put<T>(storeName: string, item: T): Observable<T> {
    return from(this.initDB()
      .then(db => {
        return new Promise<T>((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.put(item);

          request.onsuccess = () => {
            resolve(item);
          };

          request.onerror = () => {
            reject(request.error);
          };
        });
      }))
      .pipe(
        catchError(error => throwError(() => `Error putting data in IndexedDB: ${error}`))
      );
  }

  // Delete data from a store
  delete(storeName: string, key: any): Observable<boolean> {
    return from(this.initDB()
      .then(db => {
        return new Promise<boolean>((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.delete(key);

          request.onsuccess = () => {
            resolve(true);
          };

          request.onerror = () => {
            reject(request.error);
          };
        });
      }))
      .pipe(
        catchError(error => throwError(() => `Error deleting data from IndexedDB: ${error}`))
      );
  }

  // Clear a store
  clear(storeName: string): Observable<boolean> {
    return from(this.initDB()
      .then(db => {
        return new Promise<boolean>((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.clear();

          request.onsuccess = () => {
            resolve(true);
          };

          request.onerror = () => {
            reject(request.error);
          };
        });
      }))
      .pipe(
        catchError(error => throwError(() => `Error clearing store in IndexedDB: ${error}`))
      );
  }
}
