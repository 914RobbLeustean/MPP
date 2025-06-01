// src/app/components/shared/footer/footer.component.ts
import { Component } from '@angular/core';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
    currentYear = new Date().getFullYear();
    newsletterEmail = '';

    onNewsletterSubmit(): void {
        if (this.newsletterEmail) {
            // Handle newsletter subscription
            console.log('Newsletter subscription:', this.newsletterEmail);
            // You would typically send this to your backend service

            // Reset form
            this.newsletterEmail = '';

            // Show success message (you can integrate with your notification service)
            alert('Thank you for subscribing to our newsletter!');
        }
    }

    scrollToTop(): void {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}