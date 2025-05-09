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

  navigateToFaq(): void {
    this.router.navigate(['/faq']);
  }

  navigateToContact(): void {
    this.router.navigate(['/contact']);
  }

  // Team members data
  teamMembers = [
    {
      name: 'Emma Wilson',
      position: 'Founder & CEO',
      bio: 'Emma founded Thrifto with a passion for sustainable fashion and a vision to create a marketplace where pre-loved clothing could find new homes.',
      image: '/assets/images/team/emma.jpg'
    },
    {
      name: 'Marcus Chen',
      position: 'CTO',
      bio: 'With over 15 years of experience in web development and e-commerce, Marcus leads our technological innovations and platform development.',
      image: '/assets/images/team/marcus.jpg'
    },
    {
      name: 'Sofia Rodriguez',
      position: 'Head of Marketing',
      bio: 'Sofia brings her expertise in digital marketing and fashion industry knowledge to help grow the Thrifto community.',
      image: '/assets/images/team/sofia.jpg'
    },
    {
      name: 'James Taylor',
      position: 'Customer Experience Manager',
      bio: 'James ensures that every Thrifto user has a seamless and delightful experience from sign-up to sale or purchase.',
      image: '/assets/images/team/james.jpg'
    }
  ];
}
