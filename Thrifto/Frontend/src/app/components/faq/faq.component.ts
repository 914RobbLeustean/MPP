// src/app/components/faq/faq.component.ts
import { Component } from '@angular/core';

interface FaqItem {
  question: string;
  answer: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss']
})
export class FaqComponent {
  faqItems: FaqItem[] = [
    {
      question: 'How do I create a Thrifto account?',
      answer: 'Creating an account is easy! Click the "Sign Up" button in the top right corner of the site, enter your email address, create a password, and fill in your profile information. Once verified, you can start browsing and listing items immediately.',
      isOpen: false
    },
    {
      question: 'How do I list an item for sale?',
      answer: 'After signing in, click on "Sell" in the navigation menu. Fill out the listing form with your item\'s title, price, quality, description, and upload clear photos of your item. Click "Create Listing" and your item will be live on the marketplace!',
      isOpen: false
    },
    {
      question: 'What are the quality categories?',
      answer: 'We use four quality categories: "New" (unworn with tags), "Like New" (worn once or twice, perfect condition), "Barely Worn" (minimal signs of wear), and "Used" (visible signs of wear but still in good condition).',
      isOpen: false
    },
    {
      question: 'How do I contact a seller?',
      answer: 'When viewing a listing, click the "Contact Seller" button to start a conversation. Our messaging system allows you to communicate directly with the seller to ask questions or arrange purchase details.',
      isOpen: false
    },
    {
      question: 'How does payment work?',
      answer: 'Thrifto uses a secure payment system. When you find an item you want to purchase, add it to your cart and proceed to checkout. We accept major credit cards and PayPal. Your payment is held in escrow until you receive and approve the item.',
      isOpen: false
    },
    {
      question: 'What if I receive an item that doesn\'t match the description?',
      answer: 'If there\'s an issue with your purchase, you can file a claim within 48 hours of receiving the item. Take photos of the problem and submit them through our resolution center. Our team will review the case and facilitate a fair resolution.',
      isOpen: false
    },
    {
      question: 'How do shipping costs work?',
      answer: 'Shipping costs are calculated based on the seller\'s location, the buyer\'s location, and the estimated weight of the item. Sellers are responsible for accurately representing the item\'s weight, and buyers pay the shipping costs at checkout.',
      isOpen: false
    },
    {
      question: 'Can I sell non-clothing items on Thrifto?',
      answer: 'Currently, Thrifto specializes in pre-loved clothing items. We do not support listings for electronics, furniture, or other non-clothing items at this time.',
      isOpen: false
    }
  ];

  toggleFaq(index: number): void {
    this.faqItems[index].isOpen = !this.faqItems[index].isOpen;
  }
}
