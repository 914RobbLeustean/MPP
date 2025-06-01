// src/app/models/listing.model.ts
export interface Listing {
  id: number;
  title: string;
  measurement: string;
  quality: string;
  price: number;
  description: string;
  createdAt: Date;
  userId: string;
  userName: string;
  mainPhotoUrl?: string;
  photoUrls: string[];

  // Properties needed for offline support
  isOfflinePending?: boolean;
  isDeleted?: boolean;
}
