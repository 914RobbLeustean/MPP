// search-bar.component.ts
import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent implements OnChanges {
  @Output() searchQuery = new EventEmitter<string>();
  @Input() initialValue: string = '';
  @Input() liveUpdate: boolean = false;
  searchTerm: string = '';

  constructor(private router: Router) { }

  ngOnInit() {
    this.searchTerm = this.initialValue || '';
  }

  ngOnChanges(changes: SimpleChanges) {
    // Update the searchTerm whenever initialValue changes
    if (changes['initialValue']) {
      this.searchTerm = changes['initialValue'].currentValue || '';
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.searchTerm && this.searchTerm.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchTerm.trim() } });
    }
  }

  onInput(): void {
    if (this.liveUpdate) {
      this.searchQuery.emit(this.searchTerm);
    }
  }

  // Add a public method to reset the search term
  resetSearch(): void {
    this.searchTerm = '';
  }
}
