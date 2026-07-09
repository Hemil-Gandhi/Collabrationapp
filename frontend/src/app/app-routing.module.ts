import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { profileCompleteGuard } from './guards/profile-complete.guard';
import { profilePendingGuard } from './guards/profile-pending.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'otp',
    loadComponent: () => import('./auth/otp/otp.component').then(m => m.OtpComponent),
  },
  {
    path: 'password-creation',
    loadComponent: () => import('./auth/password-creation/password-creation.component').then(m => m.PasswordCreationComponent),
  },
  {
    path: 'profile-creation',
    loadComponent: () => import('./auth/profile-creation/profile-creation.component').then(m => m.ProfileCreationComponent),
    canActivate: [authGuard, profilePendingGuard],
  },
  {
    path: 'profile-page',
    loadComponent: () => import('./profile-page/profile-page.component').then(m => m.ProfilePageComponent),
    canActivate: [authGuard, profileCompleteGuard],
  },
  {
    path: 'campaigns',
    loadComponent: () => import('./campaign/campaign.component').then(m => m.CampaignComponent),
    canActivate: [authGuard, profileCompleteGuard],
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
    canActivate: [authGuard, profileCompleteGuard],
  },
  {
    path: 'create-post',
    loadComponent: () => import('./create-post/create-post.component').then(m => m.CreatePostComponent),
    canActivate: [authGuard, profileCompleteGuard],
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
