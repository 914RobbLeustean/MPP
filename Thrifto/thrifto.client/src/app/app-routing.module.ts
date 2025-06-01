// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
import { NewListingsComponent } from './components/new-listings/new-listings.component';
import { SellComponent } from './components/sell/sell.component';
import { EditListingComponent } from './components/edit-listing/edit-listing.component';
import { ListingDetailComponent } from './components/listing-detail/listing-detail.component';
import { CartComponent } from './components/cart/cart.component';
import { ChatComponent } from './components/chat/chat.component';
import { AboutComponent } from './components/about/about.component';
import { FaqComponent } from './components/faq/faq.component';
import { ContactComponent } from './components/contact/contact.component';
import { FeedbackComponent } from './components/feedback/feedback.component';
import { SearchComponent } from './components/search/search.component';
import { LoginComponent } from './components/auth/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { SecurityCenterComponent } from './components/security-center/security-center-component';
import { SecurityHelpComponent } from './components/security-help/security-help.component';
import { BlogComponent } from './components/policy/blog/blog.component';
import { ShippingPolicyComponent } from './components/policy/shipping-policy/shipping-policy.component';
import { ReturnPolicyComponent } from './components/policy/return-policy/return-policy.component';
import { PrivacyPolicyComponent } from './components/policy/privacy-policy/privacy-policy.component';
import { TermsOfServiceComponent } from './components/policy/terms-of-service/terms-of-service.component';

import { AccountSettingsComponent } from './components/account-settings/account-settings.component';
import { AuthGuard } from './guards/auth.guards';

const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'new-listings', component: NewListingsComponent },
    { path: 'listing/:id', component: ListingDetailComponent },
    { path: 'sell', component: SellComponent, canActivate: [AuthGuard] },
    { path: 'edit-listing/:id', component: EditListingComponent, canActivate: [AuthGuard] },
    { path: 'cart', component: CartComponent },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'chat', component: ChatComponent, canActivate: [AuthGuard] },
    { path: 'chat/:userId', component: ChatComponent, canActivate: [AuthGuard] },
    { path: 'feedback/:userId', component: FeedbackComponent },
    { path: 'search', component: SearchComponent },
    { path: 'faq', component: FaqComponent },
    { path: 'contact', component: ContactComponent },
    { path: 'about', component: AboutComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'blog', component: BlogComponent },
    {
        path: 'account-settings',
        component: AccountSettingsComponent,
        canActivate: [AuthGuard]
    },
    { path: 'shipping-policy', component: ShippingPolicyComponent },
    { path: 'security-center', component: SecurityCenterComponent, canActivate: [AuthGuard] },
    { path: 'security-help', component: SecurityHelpComponent },
    { path: 'return-policy', component: ReturnPolicyComponent },
    { path: 'privacy-policy', component: PrivacyPolicyComponent },
    { path: 'terms-of-service', component: TermsOfServiceComponent },
    // Catch-all route for 404
    { path: '**', redirectTo: '' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {
        scrollPositionRestoration: 'disabled', // Disable built-in scroll restoration
        enableTracing: false
    })],
    exports: [RouterModule]
})
export class AppRoutingModule { }