// src/app/components/policy/blog/blog.component.ts
import { Component } from '@angular/core';

interface BlogPost {
    id: number;
    title: string;
    excerpt: string;
    content: string;
    image: string;
    category: string;
    tags: string[];
    date: Date;
    readTime: number;
    featured?: boolean;
    views?: number;
}

@Component({
    selector: 'app-blog',
    templateUrl: './blog.component.html',
    styleUrls: ['./blog.component.scss']
})
export class BlogComponent {
    searchTerm = '';
    selectedCategory = 'all';
    viewMode: 'grid' | 'list' = 'grid';

    popularTags = ['Sustainable Fashion', 'Thrifting Tips', 'Eco-Friendly', 'Style Guide'];

    categories = [
        { id: 'all', name: 'All Posts' },
        { id: 'sustainable', name: 'Sustainable Fashion' },
        { id: 'thrifting', name: 'Thrifting Tips' },
        { id: 'style', name: 'Style Guide' },
        { id: 'care', name: 'Care Tips' }
    ];

    allTags = [
        'Sustainable Fashion', 'Thrifting', 'Vintage', 'Eco-Friendly', 'Style',
        'Fashion Tips', 'Wardrobe', 'Upcycling', 'Minimalism', 'Trends'
    ];

    blogPosts: BlogPost[] = [
        {
            id: 1,
            title: '10 Tips for Building a Sustainable Wardrobe',
            excerpt: 'Learn how to create a wardrobe that\'s both stylish and environmentally conscious. Discover practical tips for making sustainable fashion choices that will last for years.',
            content: '',
            image: 'assets/images/blog/sustainable-fashion.jpg',
            category: 'sustainable',
            tags: ['Sustainable Fashion', 'Wardrobe', 'Eco-Friendly'],
            date: new Date('2024-04-15'),
            readTime: 8,
            featured: true,
            views: 1250
        },
        {
            id: 2,
            title: 'The Ultimate Guide to Thrifting Like a Pro',
            excerpt: 'Master the art of thrift shopping with our comprehensive guide. From finding hidden gems to negotiating prices, we\'ve got you covered with expert tips.',
            content: '',
            image: 'assets/images/blog/thrifting-guide.jpg',
            category: 'thrifting',
            tags: ['Thrifting', 'Shopping Tips', 'Budget Fashion'],
            date: new Date('2024-04-12'),
            readTime: 12,
            featured: true,
            views: 980
        },
        {
            id: 3,
            title: 'How to Make Your Clothes Last Longer',
            excerpt: 'Extend the life of your favorite garments with these essential care tips. Learn proper washing, storing, and maintenance techniques that will keep your clothes looking new.',
            content: '',
            image: 'assets/images/blog/clothing-care.jpg',
            category: 'care',
            tags: ['Care Tips', 'Maintenance', 'Fashion Tips'],
            date: new Date('2024-04-10'),
            readTime: 6,
            views: 750
        },
        {
            id: 4,
            title: 'Vintage Fashion: Styling Tips for Modern Looks',
            excerpt: 'Discover how to incorporate vintage pieces into your modern wardrobe. Learn styling techniques that blend classic and contemporary fashion seamlessly.',
            content: '',
            image: 'assets/images/blog/vintage-style.jpg',
            category: 'style',
            tags: ['Vintage', 'Style', 'Fashion Tips'],
            date: new Date('2024-04-08'),
            readTime: 10,
            views: 890
        },
        {
            id: 5,
            title: 'The Environmental Impact of Fast Fashion',
            excerpt: 'Understanding the true cost of fast fashion on our planet. Learn about sustainable alternatives and how your shopping choices can make a difference.',
            content: '',
            image: 'assets/images/blog/fast-fashion.jpg',
            category: 'sustainable',
            tags: ['Sustainable Fashion', 'Environment', 'Awareness'],
            date: new Date('2024-04-05'),
            readTime: 15,
            featured: true,
            views: 1450
        },
        {
            id: 6,
            title: 'Capsule Wardrobe Essentials for Every Season',
            excerpt: 'Build a versatile capsule wardrobe with these essential pieces. Learn how to create endless outfit combinations with fewer, high-quality items.',
            content: '',
            image: 'assets/images/blog/capsule-wardrobe.jpg',
            category: 'style',
            tags: ['Capsule Wardrobe', 'Minimalism', 'Style'],
            date: new Date('2024-04-03'),
            readTime: 9,
            views: 670
        }
    ];

    filteredPosts: BlogPost[] = [...this.blogPosts];
    popularPosts: BlogPost[] = this.blogPosts
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 4);

    constructor() {
        this.filterPosts();
    }

    selectCategory(categoryId: string): void {
        this.selectedCategory = categoryId;
        this.filterPosts();
    }

    filterPosts(): void {
        let filtered = [...this.blogPosts];

        // Filter by category
        if (this.selectedCategory !== 'all') {
            filtered = filtered.filter(post => post.category === this.selectedCategory);
        }

        // Filter by search term
        if (this.searchTerm.trim()) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(post =>
                post.title.toLowerCase().includes(term) ||
                post.excerpt.toLowerCase().includes(term) ||
                post.tags.some(tag => tag.toLowerCase().includes(term))
            );
        }

        // Sort by date (newest first) and featured status
        filtered.sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return b.date.getTime() - a.date.getTime();
        });

        this.filteredPosts = filtered;
    }
}