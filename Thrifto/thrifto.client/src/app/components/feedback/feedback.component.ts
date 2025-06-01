// src/app/components/feedback/feedback.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FeedbackService } from '../../services/feedback.service';
import { UserService } from '../../services/user.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { Feedback } from '../../models/feedback.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss']
})
export class FeedbackComponent implements OnInit {
  userId!: string;
  user: User | null = null;
  feedbackForm: FormGroup;
  userFeedback: Feedback[] = [];

  isLoadingUser = true;
  isLoadingFeedback = true;
  isSubmitting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private feedbackService: FeedbackService,
    private userService: UserService,
    private notificationService: NotificationService,
    private authService: AuthService
  ) {
    this.feedbackForm = this.fb.group({
      rating: [null, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['']
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.userId = params['userId'];
      if (this.userId) {
        this.loadUser();
        this.loadFeedback();
      } else {
        this.router.navigate(['/']);
      }
    });
  }

  loadUser(): void {
    this.isLoadingUser = true;

    this.userService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.user = user;
        this.isLoadingUser = false;

        // Check if the current user is the same as the profile user
        if (this.authService.getCurrentUserId() === this.userId) {
          this.notificationService.show('You cannot leave feedback for yourself', 'info');
        }
      },
      error: (error) => {
        console.error('Error loading user', error);
        this.isLoadingUser = false;
        this.notificationService.show('Error loading user details', 'error');
        this.router.navigate(['/']);
      }
    });
  }

  loadFeedback(): void {
    this.isLoadingFeedback = true;

    this.feedbackService.getUserFeedback(this.userId).subscribe({
      next: (feedback) => {
        this.userFeedback = feedback;
        this.isLoadingFeedback = false;
      },
      error: (error) => {
        console.error('Error loading feedback', error);
        this.isLoadingFeedback = false;
      }
    });
  }

  setRating(rating: number): void {
    this.feedbackForm.patchValue({ rating });
  }

  submitFeedback(): void {
    if (this.feedbackForm.invalid) return;

    // Check if the user is logged in
    if (!this.authService.isLoggedIn()) {
      this.notificationService.show('Please log in to leave feedback', 'info');
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    // Check if the current user is the same as the profile user
    if (this.authService.getCurrentUserId() === this.userId) {
      this.notificationService.show('You cannot leave feedback for yourself', 'info');
      return;
    }

    this.isSubmitting = true;

    const feedbackData = {
      userId: this.userId,
      rating: this.feedbackForm.value.rating,
      comment: this.feedbackForm.value.comment
    };

    this.feedbackService.createFeedback(feedbackData).subscribe({
      next: () => {
        this.notificationService.show('Feedback submitted successfully', 'success');
        this.resetForm();
        this.loadFeedback();
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error submitting feedback', error);
        this.notificationService.show('Error submitting feedback', 'error');
        this.isSubmitting = false;
      }
    });
  }

  resetForm(): void {
    this.feedbackForm.reset();
  }

  calculateAverageRating(): number {
    if (!this.userFeedback || this.userFeedback.length === 0) {
      return 0;
    }

    const sum = this.userFeedback.reduce((acc, feedback) => acc + feedback.rating, 0);
    return parseFloat((sum / this.userFeedback.length).toFixed(1));
  }

  getCurrentUserId(): string | null {
    return this.authService.getCurrentUserId();
  }
}
