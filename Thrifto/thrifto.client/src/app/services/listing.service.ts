// src/app/services/listing.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { Listing } from '../models/listing.model';
import { NetworkService, ConnectionStatus } from './network.service';
import { IndexedDBService } from './indexed-db.service';
import { OfflineQueueService, OperationType } from './offline-queue.service';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { PriceRange } from '../components/shared/price-range-filter/price-range-filter.component';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ListingService {
    private apiUrl = `${environment.apiUrl}/listings`;

    constructor(
        private http: HttpClient,
        private networkService: NetworkService,
        private indexedDBService: IndexedDBService,
        private offlineQueueService: OfflineQueueService,
        private notificationService: NotificationService,
        private authService: AuthService
    ) { }

    // ✅ FIXED: Update the method signature to return the paginated result
    getListings(params: any = {}): Observable<{ items: Listing[], totalCount: number }> {
        let httpParams = new HttpParams();

        // ✅ FIXED: Build parameters properly
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                httpParams = httpParams.set(key, params[key].toString());
            }
        });

        console.log('🔍 Sending HTTP params:', httpParams.toString()); // Debug log

        // Check if online
        if (this.networkService.isOnline) {
            return this.http.get<{ items: Listing[], totalCount: number }>(this.apiUrl, { params: httpParams }).pipe(
                tap(response => {
                    console.log('📥 API Response:', response); // Debug log
                    // Cache the listings
                    if (response.items) {
                        response.items.forEach(listing => {
                            this.indexedDBService.put('listings', listing).subscribe();
                        });
                    }
                }),
                catchError(error => {
                    console.error('❌ API Error:', error); // Debug log
                    this.notificationService.show('Error loading listings from server. Using offline data.', 'error');
                    return this.getOfflineListings(params);
                })
            );
        } else {
            // If offline, use cached data
            return this.getOfflineListings(params);
        }
    }

    private getOfflineListings(params: any): Observable<{ items: Listing[], totalCount: number }> {
        return this.indexedDBService.getAll<Listing>('listings').pipe(
            map(listings => {
                // Apply basic filters if params are present
                let filteredListings = listings;

                // Quality filter
                if (params.quality) {
                    filteredListings = filteredListings.filter(l => l.quality === params.quality);
                }

                // Search filter
                if (params.search) {
                    const searchLower = params.search.toLowerCase();
                    filteredListings = filteredListings.filter(l =>
                        l.title.toLowerCase().includes(searchLower) ||
                        (l.description && l.description.toLowerCase().includes(searchLower))
                    );
                }

                // ✅ FIXED: Price range filters
                if (params.minPrice && params.minPrice > 0) {
                    filteredListings = filteredListings.filter(l => l.price >= parseFloat(params.minPrice));
                }

                if (params.maxPrice && params.maxPrice < 10000) {
                    filteredListings = filteredListings.filter(l => l.price <= parseFloat(params.maxPrice));
                }

                // ✅ FIXED: Sorting
                if (params.sortBy) {
                    switch (params.sortBy) {
                        case 'price_asc':
                            filteredListings = filteredListings.sort((a, b) => a.price - b.price);
                            break;
                        case 'price_desc':
                            filteredListings = filteredListings.sort((a, b) => b.price - a.price);
                            break;
                        case 'oldest':
                            filteredListings = filteredListings.sort((a, b) =>
                                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                            break;
                        default: // newest
                            filteredListings = filteredListings.sort((a, b) =>
                                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                            break;
                    }
                } else {
                    // Default sort by newest
                    filteredListings = filteredListings.sort((a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    );
                }

                // Get total count before pagination
                const totalCount = filteredListings.length;

                // Handle pagination if provided
                if (params.page && params.pageSize) {
                    const startIndex = (params.page - 1) * params.pageSize;
                    filteredListings = filteredListings.slice(startIndex, startIndex + params.pageSize);
                }

                return {
                    items: filteredListings,
                    totalCount: totalCount
                };
            }),
            catchError(error => {
                this.notificationService.show('Error loading offline listings', 'error');
                return of({ items: [], totalCount: 0 });
            })
        );
    }

    getNewListings(count: number = 8): Observable<Listing[]> {
        if (this.networkService.isOnline) {
            return this.http.get<Listing[]>(`${this.apiUrl}/new`, {
                params: new HttpParams().set('count', count.toString())
            }).pipe(
                tap(listings => {
                    // Cache the listings
                    listings.forEach(listing => {
                        this.indexedDBService.put('listings', listing).subscribe();
                    });
                }),
                catchError(error => {
                    this.notificationService.show('Error loading new listings from server. Using offline data.', 'error');
                    return this.getOfflineNewListings(count);
                })
            );
        } else {
            return this.getOfflineNewListings(count);
        }
    }

    private getOfflineNewListings(count: number): Observable<Listing[]> {
        return this.indexedDBService.getAll<Listing>('listings').pipe(
            map(listings => {
                // Sort by creation date (newest first) and take the specified count
                return listings
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, count);
            })
        );
    }

    getListingById(id: number): Observable<Listing> {
        if (this.networkService.isOnline) {
            return this.http.get<Listing>(`${this.apiUrl}/${id}`).pipe(
                tap(listing => {
                    this.indexedDBService.put('listings', listing).subscribe();
                }),
                catchError(error => {
                    return this.getOfflineListing(id);
                })
            );
        } else {
            return this.getOfflineListing(id);
        }
    }

    private getOfflineListing(id: number): Observable<Listing> {
        return this.indexedDBService.get<Listing>('listings', id).pipe(
            switchMap(listing => {
                if (listing) {
                    return of(listing);
                } else {
                    this.notificationService.show('Listing not found in offline storage', 'error');
                    return throwError(() => new Error('Listing not found in offline storage'));
                }
            })
        );
    }

    getUserListings(userId: string): Observable<Listing[]> {
        if (this.networkService.isOnline) {
            return this.http.get<Listing[]>(`${this.apiUrl}/user/${userId}`).pipe(
                tap(listings => {
                    // Cache the listings
                    listings.forEach(listing => {
                        this.indexedDBService.put('listings', listing).subscribe();
                    });
                }),
                switchMap(onlineListings => {
                    // Get offline listings as well and combine
                    return this.getOfflineUserListings(userId).pipe(
                        map(offlineListings => {
                            // Filter out any offline listings that were already synced and exist in onlineListings
                            const filteredOfflineListings = offlineListings.filter(offline =>
                                // Only include if no online listing with matching ID exists
                                // (offline listings have negative IDs so there shouldn't be conflicts)
                                !onlineListings.some(online => online.id === offline.id)
                            );
                            // Combine online and offline listings
                            return [...onlineListings, ...filteredOfflineListings];
                        })
                    );
                }),
                catchError(error => {
                    this.notificationService.show('Error loading user listings from server. Using offline data.', 'error');
                    return this.getOfflineUserListings(userId);
                })
            );
        } else {
            return this.getOfflineUserListings(userId);
        }
    }

    private getOfflineUserListings(userId: string): Observable<Listing[]> {
        return this.indexedDBService.getAll<Listing>('listings').pipe(
            map(listings => {
                // Filter to only include listings from this user (including temporary IDs) 
                // and not soft-deleted ones
                return listings.filter(listing =>
                    listing.userId === userId &&
                    !listing.isDeleted
                );
            })
        );
    }

    createListing(formData: FormData): Observable<Listing> {
        if (this.networkService.isOnline) {
            return this.http.post<Listing>(this.apiUrl, formData).pipe(
                tap(listing => {
                    // Cache the new listing
                    this.indexedDBService.put('listings', listing).subscribe();
                }),
                catchError(error => {
                    this.notificationService.show('Error creating listing on server. Queuing for offline sync.', 'error');
                    return this.createOfflineListing(formData);
                })
            );
        } else {
            return this.createOfflineListing(formData);
        }
    }

    private createOfflineListing(formData: FormData): Observable<Listing> {
        // Extract data from FormData
        const tempId = -Math.floor(Math.random() * 1000000); // Negative ID to indicate it's temporary

        // Convert FormData to a regular object
        const listingData: any = {};
        formData.forEach((value, key) => {
            // Skip file objects for now in the temporary listing object
            if (!(value instanceof File)) {
                listingData[key] = value;
            }
        });

        // Get current user info
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
            return throwError(() => new Error('User must be logged in to create listings'));
        }

        // Create a temporary listing object
        const tempListing: Listing = {
            id: tempId,
            title: listingData.title || 'Untitled',
            measurement: listingData.measurement || '',
            quality: listingData.quality || '',
            price: parseFloat(listingData.price) || 0,
            description: listingData.description || '',
            createdAt: new Date(),
            userId: currentUser.id,
            userName: currentUser.username || `${currentUser.firstName} ${currentUser.lastName}`,
            photoUrls: [],
            isOfflinePending: true
        };

        // Store in IndexedDB
        return this.indexedDBService.put<Listing>('listings', tempListing).pipe(
            switchMap(savedListing => {
                // Queue operation for later sync
                return this.offlineQueueService.queueOperation({
                    entityType: 'listing',
                    operationType: OperationType.CREATE,
                    payload: this.formDataToObject(formData),
                    timestamp: Date.now(),
                    tempId: tempId
                }).pipe(
                    map(() => {
                        this.notificationService.show('Listing saved offline and will sync when online', 'info');
                        return savedListing;
                    })
                );
            })
        );
    }

    updateListing(id: number, formData: FormData): Observable<Listing> {
        if (this.networkService.isOnline) {
            return this.http.put<Listing>(`${this.apiUrl}/${id}`, formData).pipe(
                tap(listing => {
                    // Update the cache
                    this.indexedDBService.put('listings', listing).subscribe();
                }),
                catchError(error => {
                    this.notificationService.show('Error updating listing on server. Queuing for offline sync.', 'error');
                    return this.updateOfflineListing(id, formData);
                })
            );
        } else {
            return this.updateOfflineListing(id, formData);
        }
    }

    private updateOfflineListing(id: number, formData: FormData): Observable<Listing> {
        // First get the existing listing
        return this.indexedDBService.get<Listing>('listings', id).pipe(
            switchMap(existingListing => {
                if (!existingListing) {
                    return throwError(() => new Error('Listing not found in offline storage'));
                }

                // Convert FormData to a regular object
                const updateData: any = {};
                formData.forEach((value, key) => {
                    // Skip file objects for now in the temporary update object
                    if (!(value instanceof File)) {
                        updateData[key] = value;
                    }
                });

                // Update the listing with new values
                const updatedListing: Listing = {
                    ...existingListing,
                    title: updateData.title || existingListing.title,
                    measurement: updateData.measurement || existingListing.measurement,
                    quality: updateData.quality || existingListing.quality,
                    price: parseFloat(updateData.price) || existingListing.price,
                    description: updateData.description || existingListing.description,
                    isOfflinePending: true
                };

                // Store the updated listing
                return this.indexedDBService.put<Listing>('listings', updatedListing).pipe(
                    switchMap(savedListing => {
                        // Queue the operation for later sync
                        return this.offlineQueueService.queueOperation({
                            entityType: 'listing',
                            entityId: id,
                            operationType: OperationType.UPDATE,
                            payload: this.formDataToObject(formData),
                            timestamp: Date.now()
                        }).pipe(
                            map(() => {
                                this.notificationService.show('Listing updated offline and will sync when online', 'info');
                                return savedListing;
                            })
                        );
                    })
                );
            })
        );
    }

    deleteListing(id: number): Observable<any> {
        if (this.networkService.isOnline) {
            return this.http.delete(`${this.apiUrl}/${id}`).pipe(
                tap(() => {
                    // Remove from cache
                    this.indexedDBService.delete('listings', id).subscribe();
                }),
                catchError(error => {
                    this.notificationService.show('Error deleting listing from server. Queuing for offline sync.', 'error');
                    return this.deleteOfflineListing(id);
                })
            );
        } else {
            return this.deleteOfflineListing(id);
        }
    }

    private deleteOfflineListing(id: number): Observable<boolean> {
        return this.indexedDBService.get<Listing>('listings', id).pipe(
            switchMap(listing => {
                if (!listing) {
                    return throwError(() => new Error('Listing not found in offline storage'));
                }

                // If this is a temporary ID (negative), it was created offline
                if (id < 0) {
                    // Find and remove any pending create operations for this listing
                    return this.offlineQueueService.getPendingOperations().pipe(
                        switchMap(operations => {
                            const createOp = operations.find(op =>
                                op.operationType === OperationType.CREATE &&
                                op.entityType === 'listing' &&
                                op.tempId === id
                            );

                            if (createOp && createOp.id) {
                                // Remove the create operation from the queue
                                return this.offlineQueueService.removePendingOperation(createOp.id).pipe(
                                    switchMap(() => this.indexedDBService.delete('listings', id)),
                                    map(() => true)
                                );
                            } else {
                                // Just remove from IndexedDB
                                return this.indexedDBService.delete('listings', id).pipe(
                                    map(() => true)
                                );
                            }
                        })
                    );
                } else {
                    // This is a server-side listing - mark as deleted locally
                    listing.isDeleted = true;
                    listing.isOfflinePending = true;

                    return this.indexedDBService.put('listings', listing).pipe(
                        switchMap(() => {
                            // Queue the delete operation
                            return this.offlineQueueService.queueOperation({
                                entityType: 'listing',
                                entityId: id,
                                operationType: OperationType.DELETE,
                                payload: null,
                                timestamp: Date.now()
                            });
                        }),
                        map(() => {
                            this.notificationService.show('Listing marked for deletion and will be removed when online', 'info');
                            return true;
                        })
                    );
                }
            })
        );
    }

    searchListings(query: string, priceRange?: PriceRange): Observable<Listing[]> {
        if (this.networkService.isOnline) {
            let params = new HttpParams().set('q', query);

            // ✅ FIXED: Add price range parameters if provided
            if (priceRange) {
                if (priceRange.min > 0) {
                    params = params.set('minPrice', priceRange.min.toString());
                }
                if (priceRange.max > 0 && priceRange.max < 10000) {
                    params = params.set('maxPrice', priceRange.max.toString());
                }
            }

            console.log('🔍 Search params:', params.toString()); // Debug log

            return this.http.get<Listing[]>(`${this.apiUrl}/search`, { params }).pipe(
                tap(listings => {
                    console.log('📥 Search results:', listings); // Debug log
                    // Cache the search results
                    listings.forEach(listing => {
                        this.indexedDBService.put('listings', listing).subscribe();
                    });
                }),
                catchError(error => {
                    console.error('❌ Search error:', error); // Debug log
                    this.notificationService.show('Error searching listings. Using offline search.', 'error');
                    return this.searchOfflineListings(query, priceRange);
                })
            );
        } else {
            return this.searchOfflineListings(query, priceRange);
        }
    }

    private searchOfflineListings(query: string, priceRange?: PriceRange): Observable<Listing[]> {
        return this.indexedDBService.getAll<Listing>('listings').pipe(
            map(listings => {
                const searchLower = query.toLowerCase();
                let filteredListings = listings.filter(listing =>
                    listing.title.toLowerCase().includes(searchLower) ||
                    (listing.description && listing.description.toLowerCase().includes(searchLower)) ||
                    listing.measurement.toLowerCase().includes(searchLower) ||
                    listing.quality.toLowerCase().includes(searchLower)
                );

                // ✅ FIXED: Apply price range filter
                if (priceRange) {
                    filteredListings = filteredListings.filter(listing =>
                        listing.price >= priceRange.min && listing.price <= priceRange.max
                    );
                }

                return filteredListings;
            })
        );
    }

    // Helper method to convert FormData to object for offline queue
    private formDataToObject(formData: FormData): any {
        const obj: any = {};
        formData.forEach((value, key) => {
            if (value instanceof File) {
                // For files, you might want to store metadata only
                // In a full implementation, you'd handle file storage separately
                if (!obj.files) obj.files = [];
                obj.files.push({
                    name: value.name,
                    type: value.type,
                    size: value.size
                });
            } else {
                obj[key] = value;
            }
        });
        return obj;
    }

    // Error handling method
    private handleError(error: HttpErrorResponse) {
        console.error('API Error Response:', error);

        let errorMessage = 'Unknown error occurred';

        // Try to extract more detailed error information
        if (error.error instanceof ErrorEvent) {
            // Client-side error
            errorMessage = `Error: ${error.error.message}`;
        } else {
            // Server-side error
            errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;

            // Try to extract more detailed error from response body
            if (error.error) {
                if (typeof error.error === 'string') {
                    errorMessage += `\nDetails: ${error.error}`;
                } else if (error.error.errors) {
                    // This extracts validation errors from ASP.NET Core response
                    errorMessage += '\nValidation Errors:';
                    for (const key in error.error.errors) {
                        if (error.error.errors.hasOwnProperty(key)) {
                            errorMessage += `\n- ${key}: ${error.error.errors[key].join(', ')}`;
                        }
                    }
                }
            }
        }

        console.error(errorMessage);
        return throwError(() => new Error(errorMessage));
    }
}