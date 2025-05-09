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
  errorMessage = '';

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onSubmit(): void {
    if (this.contactForm.invalid) {
      return;
    }

    this.isSubmitting = true;

    // In a real implementation, this would send the form data to a backend API
    // For now, we'll simulate a successful submission after a delay
    setTimeout(() => {
      this.isSubmitting = false;
      this.isSubmitted = true;

      // Reset the form
      this.contactForm.reset();
    }, 1500);
  }

  // Helper getters for form validation
  get nameControl() { return this.contactForm.get('name'); }
  get emailControl() { return this.contactForm.get('email'); }
  get subjectControl() { return this.contactForm.get('subject'); }
  get messageControl() { return this.contactForm.get('message'); }
}
