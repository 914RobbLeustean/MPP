// src/app/components/security-help/security-help.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from '../../services/notification.service';

interface HelpSection {
    id: string;
    title: string;
    icon: string;
}

interface FAQ {
    id: string;
    question: string;
    answer: string;
    expanded: boolean;
    keywords: string[];
}

@Component({
    selector: 'app-security-help',
    templateUrl: './security-help.component.html',
    styleUrls: ['./security-help.component.scss']
})
export class SecurityHelpComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();

    searchQuery = '';
    activeSection = '';

    helpSections: HelpSection[] = [
        { id: 'two-factor-auth', title: 'Two-Factor Authentication', icon: 'fa-mobile-alt' },
        { id: 'password-security', title: 'Password Security', icon: 'fa-key' },
        { id: 'account-recovery', title: 'Account Recovery', icon: 'fa-life-ring' },
        { id: 'privacy-settings', title: 'Privacy Settings', icon: 'fa-user-secret' },
        { id: 'suspicious-activity', title: 'Suspicious Activity', icon: 'fa-exclamation-triangle' }
    ];

    faqs: FAQ[] = [
        {
            id: '1',
            question: 'How do I enable two-factor authentication?',
            answer: 'Go to your Account Settings, find the Two-Factor Authentication section, and click "Enable 2FA". You\'ll need to scan a QR code with an authenticator app and enter a verification code.',
            expanded: false,
            keywords: ['2fa', 'two-factor', 'authentication', 'enable', 'setup']
        },
        {
            id: '2',
            question: 'What should I do if I lost my authenticator device?',
            answer: 'Use your recovery codes to log in, then set up 2FA again with a new device. If you don\'t have recovery codes, contact our security team for manual verification.',
            expanded: false,
            keywords: ['lost', 'device', 'authenticator', 'recovery', 'codes']
        },
        {
            id: '3',
            question: 'How often should I change my password?',
            answer: 'Change your password immediately if you suspect it\'s been compromised. Otherwise, a strong, unique password doesn\'t need regular changes unless required by your organization.',
            expanded: false,
            keywords: ['password', 'change', 'frequency', 'update']
        },
        {
            id: '4',
            question: 'Is my personal information safe on Thrifto?',
            answer: 'Yes, we use industry-standard encryption and security measures to protect your data. We only collect necessary information and never sell your personal data to third parties.',
            expanded: false,
            keywords: ['privacy', 'data', 'safe', 'protection', 'information']
        },
        {
            id: '5',
            question: 'How can I make my profile more private?',
            answer: 'Go to Privacy Settings and adjust your profile visibility. You can choose between Public, Buyers Only, or Private visibility levels.',
            expanded: false,
            keywords: ['privacy', 'profile', 'visibility', 'private', 'settings']
        },
        {
            id: '6',
            question: 'What should I do if I receive a suspicious email?',
            answer: 'Don\'t click any links or download attachments. Forward the email to security@thrifto.com and delete it. We never ask for passwords or sensitive information via email.',
            expanded: false,
            keywords: ['suspicious', 'email', 'phishing', 'scam', 'report']
        },
        {
            id: '7',
            question: 'How do I report a security concern?',
            answer: 'Contact our security team immediately at security@thrifto.com or use the "Contact Security Team" button. Provide as much detail as possible about the concern.',
            expanded: false,
            keywords: ['report', 'security', 'concern', 'contact', 'support']
        },
        {
            id: '8',
            question: 'Can I download my personal data?',
            answer: 'Yes, you can request a copy of your personal data from the Security Center. We\'ll email you a download link within 24 hours.',
            expanded: false,
            keywords: ['download', 'data', 'export', 'personal', 'information']
        }
    ];

    filteredFaqs: FAQ[] = [];

    constructor(
        private router: Router,
        private notificationService: NotificationService
    ) { }

    ngOnInit(): void {
        this.filteredFaqs = [...this.faqs];
        this.setupScrollListener();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private setupScrollListener(): void {
        // Implement intersection observer for active section highlighting
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.activeSection = entry.target.id;
                    }
                });
            },
            { threshold: 0.5, rootMargin: '-100px 0px' }
        );

        // Observe all help sections
        setTimeout(() => {
            this.helpSections.forEach(section => {
                const element = document.getElementById(section.id);
                if (element) {
                    observer.observe(element);
                }
            });
        }, 100);
    }

    onSearch(): void {
        if (!this.searchQuery.trim()) {
            this.filteredFaqs = [...this.faqs];
            return;
        }

        const query = this.searchQuery.toLowerCase();
        this.filteredFaqs = this.faqs.filter(faq =>
            faq.question.toLowerCase().includes(query) ||
            faq.answer.toLowerCase().includes(query) ||
            faq.keywords.some(keyword => keyword.includes(query))
        );
    }

    scrollToSection(sectionId: string): void {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
            });
            this.activeSection = sectionId;
        }
    }

    toggleFaq(faqId: string): void {
        const faq = this.filteredFaqs.find(f => f.id === faqId);
        if (faq) {
            faq.expanded = !faq.expanded;
        }
    }

    // Navigation Methods
    navigateToAccountSettings(): void {
        this.router.navigate(['/account-settings']);
    }

    navigateToSecurityCenter(): void {
        this.router.navigate(['/security-center']);
    }

    // Action Methods
    contactSecurity(): void {
        // In a real app, this would open a contact form or chat
        this.notificationService.show('Security team contact feature coming soon', 'info');
    }
}