// src/app/directives/infinite-scroll.directive.ts
import { Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription, fromEvent } from 'rxjs';
import { debounceTime, filter, map, throttleTime } from 'rxjs/operators';

@Directive({
  selector: '[appInfiniteScroll]'
})
export class InfiniteScrollDirective implements OnInit, OnDestroy {
  @Input() scrollThreshold = 200; // Pixels from bottom to trigger load
  @Input() immediateCheck = true; // Check on initialization
  @Input() disabled = false;      // To temporarily disable the scroll
  @Output() scrolled = new EventEmitter<void>();

  private scrollSubscription: Subscription | null = null;

  constructor(private elementRef: ElementRef) { }

  ngOnInit(): void {
    if (this.disabled) {
      return;
    }

    this.scrollSubscription = fromEvent(window, 'scroll')
      .pipe(
        throttleTime(200), // Limit check frequency
        map(() => this.getCurrentScrollPosition()),
        filter(() => this.shouldTriggerLoad())
      )
      .subscribe(() => {
        this.scrolled.emit();
      });

    // Initial check
    if (this.immediateCheck) {
      setTimeout(() => {
        if (this.shouldTriggerLoad()) {
          this.scrolled.emit();
        }
      }, 0);
    }
  }

  ngOnDestroy(): void {
    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
    }
  }

  private getCurrentScrollPosition(): number {
    return (window.innerHeight + window.scrollY);
  }

  private shouldTriggerLoad(): boolean {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollPosition = this.getCurrentScrollPosition();
    return scrollPosition >= scrollHeight - this.scrollThreshold;
  }
}
