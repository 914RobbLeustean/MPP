// src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Components
import { HomeComponent } from './components/home/home.component';
import { NetworkStatusComponent } from './components/shared/network-status/network-status.component';
import { NewListingsComponent } from './components/new-listings/new-listings.component';
import { SellComponent } from './components/sell/sell.component';
import { EditListingComponent } from './components/edit-listing/edit-listing.component';
import { ListingDetailComponent } from './components/listing-detail/listing-detail.component';
import { CartComponent } from './components/cart/cart.component';
import { SearchComponent }from './components/search/search.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ChatComponent } from './components/chat/chat.component';
import { AboutComponent } from './components/about/about.component';
import { FaqComponent } from './components/faq/faq.component';
import { ContactComponent } from './components/contact/contact.component';
import { FeedbackComponent } from './components/feedback/feedback.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';

import { InfiniteScrollDirective } from './directives/infinite-scroll.directive';
import { PaginationService } from './services/pagination.service';
import { SignalrService } from './services/signalr.service';


// Shared Components
import { HeaderComponent } from './components/shared/header/header.component';
import { FooterComponent } from './components/shared/footer/footer.component';
import { SearchBarComponent } from './components/shared/search-bar/search-bar.component';
import { ListingItemComponent } from './components/shared/listing-item/listing-item.component';
import { NotificationComponent } from './components/shared/notification/notification.component';

// Interceptors
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';
import { BlogComponent } from './components/policy/blog/blog.component';
import { ShippingPolicyComponent } from './components/policy/shipping-policy/shipping-policy.component';
import { ReturnPolicyComponent } from './components/policy/return-policy/return-policy.component';
import { PrivacyPolicyComponent } from './components/policy/privacy-policy/privacy-policy.component';
import { TermsOfServiceComponent } from './components/policy/terms-of-service/terms-of-service.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NewListingsComponent,
    NetworkStatusComponent,
    SellComponent,
    EditListingComponent,
    SearchComponent,
    ListingDetailComponent,
    CartComponent,
    ChatComponent,
    DashboardComponent,
    InfiniteScrollDirective,
    FeedbackComponent,
    LoginComponent,
    AboutComponent,
    FaqComponent,
    ContactComponent,
    RegisterComponent,
    HeaderComponent,
    FooterComponent,
    SearchBarComponent,
    ListingItemComponent,
    NotificationComponent,
    BlogComponent,
    ShippingPolicyComponent,
    ReturnPolicyComponent,
    PrivacyPolicyComponent,
    TermsOfServiceComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule,
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule,
    ReactiveFormsModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    PaginationService,
    SignalrService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
