// src/app/models/feedback.model.ts
export interface Feedback {
  id: number;
  rating: number;
  comment: string;
  createdAt: Date;
  reviewerId: string;
  reviewerUsername: string;
  userId: string;
}
