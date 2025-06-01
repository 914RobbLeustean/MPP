// src/app/components/contact/contact.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-contact',
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
    contactForm!: FormGroup;
    isSubmitting = false;
    isSubmitted = false;

    contactMethods = [
        {
            title: 'Email Support',
            description: 'Send us an email and we\'ll respond within 24 hours.',
            iconClass: 'fas fa-envelope',
            link: 'mailto:support@thrifto.com',
            linkText: 'support@thrifto.com',
            availability: 'Available 24/7'
        },
        {
            title: 'Live Chat',
            description: 'Chat with our support team in real-time.',
            iconClass: 'fas fa-comments',
            link: '#',
            linkText: 'Start Chat',
            availability: 'Mon-Fri, 9am-6pm'
        },
        {
            title: 'Help Center',
            description: 'Browse our comprehensive FAQ and guides.',
            iconClass: 'fas fa-question-circle',
            link: '/faq',
            linkText: 'Visit Help Center',
            availability: 'Available 24/7'
        }
    ];

    constructor(private fb: FormBuilder) { }

    ngOnInit(): void {
        this.initForm();
    }

    initForm(): void {
        this.contactForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            subject: ['', [Validators.required]],
            message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
        });
    }

    onSubmit(): void {
        if (this.contactForm.invalid) {
            this.markFormGroupTouched();
            return;
        }

        this.isSubmitting = true;

        // Simulate API call
        setTimeout(() => {
            this.isSubmitting = false;
            this.isSubmitted = true;
        }, 1500);
    }

    resetForm(): void {
        this.isSubmitted = false;
        this.contactForm.reset();
    }

    private markFormGroupTouched(): void {
        Object.keys(this.contactForm.controls).forEach(key => {
            this.contactForm.get(key)?.markAsTouched();
        });
    }

    // Helper getters for form validation
    get nameControl() { return this.contactForm.get('name'); }
    get emailControl() { return this.contactForm.get('email'); }
    get subjectControl() { return this.contactForm.get('subject'); }
    get messageControl() { return this.contactForm.get('message'); }
}