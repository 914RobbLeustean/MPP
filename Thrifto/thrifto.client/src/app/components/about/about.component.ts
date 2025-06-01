// src/app/components/about/about.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss']
})
export class AboutComponent {
    constructor(private router: Router) { }

    navigateToShop(): void {
        this.router.navigate(['/listings']);
    }

    navigateToContact(): void {
        this.router.navigate(['/contact']);
    }

    features = [
        {
            icon: '🛍️',
            title: 'Easy Selling',
            description: 'List your pre-loved items in minutes with our intuitive interface and smart categorization.'
        },
        {
            icon: '🔍',
            title: 'Smart Discovery',
            description: 'Find exactly what you\'re looking for with advanced search and personalized recommendations.'
        },
        {
            icon: '💬',
            title: 'Direct Chat',
            description: 'Connect directly with buyers and sellers for smooth transactions and quick negotiations.'
        },
        {
            icon: '🔒',
            title: 'Secure Transactions',
            description: 'Shop with confidence using our secure payment system and buyer protection policies.'
        },
        {
            icon: '🌱',
            title: 'Eco-Friendly',
            description: 'Make a positive environmental impact by giving clothes a second life and reducing waste.'
        },
        {
            icon: '📱',
            title: 'Mobile Ready',
            description: 'Access Thrifto anywhere with our responsive design that works perfectly on all devices.'
        }
    ];

    values = [
        {
            iconClass: 'fas fa-leaf',
            title: 'Sustainability',
            description: 'Every purchase helps reduce fashion waste and promotes a circular economy.'
        },
        {
            iconClass: 'fas fa-users',
            title: 'Community',
            description: 'Building connections between fashion lovers who share our values.'
        },
        {
            iconClass: 'fas fa-heart',
            title: 'Quality',
            description: 'Curating the best pre-loved pieces for our community members.'
        },
        {
            iconClass: 'fas fa-shield-alt',
            title: 'Trust',
            description: 'Transparent processes and secure transactions you can rely on.'
        }
    ];
}