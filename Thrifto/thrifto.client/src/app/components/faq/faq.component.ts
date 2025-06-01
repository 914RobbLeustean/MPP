// src/app/components/faq/faq.component.ts
import { Component } from '@angular/core';

interface FaqItem {
    question: string;
    answer: string;
    isOpen: boolean;
    category: string;
    isPopular?: boolean;
    helpfulCount?: number;
}

@Component({
    selector: 'app-faq',
    templateUrl: './faq.component.html',
    styleUrls: ['./faq.component.scss']
})
export class FaqComponent {
    searchTerm = '';
    selectedCategory = 'all';

    categories = [
        { id: 'all', name: 'All Questions', icon: 'fas fa-list', count: 12 },
        { id: 'getting-started', name: 'Getting Started', icon: 'fas fa-play-circle', count: 4 },
        { id: 'buying', name: 'Buying', icon: 'fas fa-shopping-cart', count: 3 },
        { id: 'selling', name: 'Selling', icon: 'fas fa-tag', count: 3 },
        { id: 'payments', name: 'Payments', icon: 'fas fa-credit-card', count: 2 }
    ];

    faqItems: FaqItem[] = [
        {
            question: 'How do I create a Thrifto account?',
            answer: 'Creating an account is easy! Click the "Sign Up" button in the top right corner of the site, enter your email address, create a password, and fill in your profile information. Once verified, you can start browsing and listing items immediately.',
            isOpen: false,
            category: 'getting-started',
            isPopular: true,
            helpfulCount: 25
        },
        {
            question: 'How do I list an item for sale?',
            answer: 'After signing in, click on "Sell" in the navigation menu. Fill out the listing form with your item\'s title, price, quality, description, and upload clear photos of your item. Click "Create Listing" and your item will be live on the marketplace!',
            isOpen: false,
            category: 'selling',
            isPopular: true,
            helpfulCount: 18
        },
        {
            question: 'What are the quality categories?',
            answer: 'We use four quality categories: "New" (unworn with tags), "Like New" (worn once or twice, perfect condition), "Barely Worn" (minimal signs of wear), and "Used" (visible signs of wear but still in good condition).',
            isOpen: false,
            category: 'selling',
            helpfulCount: 12
        },
        {
            question: 'How do I contact a seller?',
            answer: 'When viewing a listing, click the "Contact Seller" button to start a conversation. Our messaging system allows you to communicate directly with the seller to ask questions or arrange purchase details.',
            isOpen: false,
            category: 'buying',
            isPopular: true,
            helpfulCount: 22
        },
        {
            question: 'How does payment work?',
            answer: 'Thrifto uses a secure payment system. When you find an item you want to purchase, add it to your cart and proceed to checkout. We accept major credit cards and PayPal. Your payment is held in escrow until you receive and approve the item.',
            isOpen: false,
            category: 'payments',
            helpfulCount: 15
        },
        {
            question: 'What if I receive an item that doesn\'t match the description?',
            answer: 'If there\'s an issue with your purchase, you can file a claim within 48 hours of receiving the item. Take photos of the problem and submit them through our resolution center. Our team will review the case and facilitate a fair resolution.',
            isOpen: false,
            category: 'buying',
            helpfulCount: 8
        },
        {
            question: 'How do shipping costs work?',
            answer: 'Shipping costs are calculated based on the seller\'s location, the buyer\'s location, and the estimated weight of the item. Sellers are responsible for accurately representing the item\'s weight, and buyers pay the shipping costs at checkout.',
            isOpen: false,
            category: 'buying',
            helpfulCount: 10
        },
        {
            question: 'Can I edit my listing after it\'s published?',
            answer: 'Yes! You can edit your listings at any time by going to your dashboard and clicking on the listing you want to modify. You can update the title, description, price, and photos.',
            isOpen: false,
            category: 'selling',
            helpfulCount: 14
        },
        {
            question: 'How do I enable two-factor authentication?',
            answer: 'Go to your account settings and find the "Security" section. Click on "Enable 2FA" and follow the instructions to set up two-factor authentication using an authenticator app.',
            isOpen: false,
            category: 'getting-started',
            helpfulCount: 6
        },
        {
            question: 'What payment methods do you accept?',
            answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers. All payments are processed securely through our encrypted payment system.',
            isOpen: false,
            category: 'payments',
            helpfulCount: 13
        },
        {
            question: 'How do I reset my password?',
            answer: 'Click on "Forgot Password" on the login page, enter your email address, and we\'ll send you a reset link. Follow the instructions in the email to create a new password.',
            isOpen: false,
            category: 'getting-started',
            helpfulCount: 9
        },
        {
            question: 'Is my personal information secure?',
            answer: 'Absolutely! We use industry-standard encryption to protect your personal information and payment details. We never share your information with third parties without your consent.',
            isOpen: false,
            category: 'getting-started',
            helpfulCount: 11
        }
    ];

    filteredFaqs: FaqItem[] = [...this.faqItems];

    toggleFaq(index: number): void {
        this.filteredFaqs[index].isOpen = !this.filteredFaqs[index].isOpen;
    }

    selectCategory(categoryId: string): void {
        this.selectedCategory = categoryId;
        this.filterFAQs();
    }

    filterFAQs(): void {
        let filtered = [...this.faqItems];

        // Filter by category
        if (this.selectedCategory !== 'all') {
            filtered = filtered.filter(faq => faq.category === this.selectedCategory);
        }

        // Filter by search term
        if (this.searchTerm.trim()) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(faq =>
                faq.question.toLowerCase().includes(term) ||
                faq.answer.toLowerCase().includes(term)
            );
        }

        this.filteredFaqs = filtered;
    }

    getSelectedCategoryName(): string {
        const category = this.categories.find(cat => cat.id === this.selectedCategory);
        return category ? category.name : 'All Questions';
    }

    markHelpful(index: number): void {
        if (!this.filteredFaqs[index].helpfulCount) {
            this.filteredFaqs[index].helpfulCount = 0;
        }
        this.filteredFaqs[index].helpfulCount!++;
    }

    shareQuestion(item: FaqItem): void {
        if (navigator.share) {
            navigator.share({
                title: item.question,
                text: item.answer,
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(`${item.question}\n\n${item.answer}`);
        }
    }

    clearSearch(): void {
        this.searchTerm = '';
        this.selectedCategory = 'all';
        this.filterFAQs();
    }
}