import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface User {
  email: string;
  role: 'influencer' | 'brand';
  password?: string;
  name?: string;
  phone?: string;
  username?: string;
  bio?: string;
  niches?: string[];
  countries?: string[];
  instagramUsername?: string;
  instagramFollowers?: number | null;
  instagramAccountId?: string;
  youtubeUsername?: string;
  youtubeFollowers?: number | null;
  twitterUsername?: string;
  twitterFollowers?: number | null;
  pastWorkLinks?: string[];
  avatar?: string;
  isVerified?: boolean;
  companyName?: string;
  industry?: string;
  companySize?: string;
  location?: string;
  website?: string;
  firstName?: string;
  lastName?: string;
  brandDescription?: string;
  minBudget?: number;
  maxBudget?: number;
  isProfileComplete: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  public registrationEmail: string = '';
  public registrationRole: 'influencer' | 'brand' = 'influencer';
  private registrationVerified: boolean = false;

  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.loadUserFromStorage();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  private loadUserFromStorage() {
    const userStr = localStorage.getItem('onboarding_current_user');
    if (userStr) {
      this.currentUserSubject.next(JSON.parse(userStr));
    }
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      this.token = storedToken;
    }
  }

  private token: string | null = null;

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((res) => {
        if (res && res.user) {
          localStorage.setItem(
            'onboarding_current_user',
            JSON.stringify(res.user),
          );
          this.currentUserSubject.next(res.user);
        }
        if (res && res.token) {
          this.token = res.token;
          localStorage.setItem('auth_token', res.token);
        }
      }),
      catchError((err) => {
        return throwError(
          () => new Error(err.error?.error || 'Invalid email or password.'),
        );
      }),
    );
  }

  registerStart(email: string, role: 'influencer' | 'brand'): Observable<any> {
    this.registrationEmail = email;
    this.registrationRole = role;
    this.registrationVerified = false;

    return this.http
      .post<any>(`${this.apiUrl}/auth/register`, { email, role })
      .pipe(
        catchError((err) => {
          return throwError(
            () =>
              new Error(err.error?.error || 'Failed to start registration.'),
          );
        }),
      );
  }

  verifyOtp(email: string, otp: string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/auth/verify-otp`, { email, otp })
      .pipe(
        tap(() => {
          this.registrationVerified = true;
        }),
        catchError((err) => {
          return throwError(
            () =>
              new Error(
                err.error?.error || 'Invalid or expired verification code.',
              ),
          );
        }),
      );
  }

  createPassword(email: string, password: string): Observable<any> {
    if (
      email.toLowerCase() !== this.registrationEmail.toLowerCase() ||
      !this.registrationVerified
    ) {
      return throwError(
        () =>
          new Error('Registration session expired. Please verify OTP first.'),
      );
    }

    return this.http
      .post<any>(`${this.apiUrl}/auth/create-password`, { email, password })
      .pipe(
        tap((res) => {
          if (res && res.user) {
            localStorage.setItem(
              'onboarding_current_user',
              JSON.stringify(res.user),
            );
            this.currentUserSubject.next(res.user);
          }
          if (res && res.token) {
            this.token = res.token;
            localStorage.setItem('auth_token', res.token);
          }
        }),
        catchError((err) => {
          return throwError(
            () => new Error(err.error?.error || 'Failed to create password.'),
          );
        }),
      );
  }

  updateProfile(profileData: any): Observable<any> {
    const currentUser = this.currentUserValue;
    if (!currentUser) {
      return throwError(
        () => new Error('User session not found. Please log in.'),
      );
    }

    let payload: any;
    if (profileData instanceof FormData) {
      payload = profileData;
      payload.append('email', currentUser.email);
    } else {
      payload = {
        ...profileData,
        email: currentUser.email,
      };
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
    });
    return this.http
      .put<any>(`${this.apiUrl}/auth/profile`, payload, { headers })
      .pipe(
        tap((res) => {
          if (res && res.user) {
            localStorage.setItem(
              'onboarding_current_user',
              JSON.stringify(res.user),
            );
            this.currentUserSubject.next(res.user);
          }
        }),
        catchError((err) => {
          return throwError(
            () => new Error(err.error?.error || 'Failed to update profile.'),
          );
        }),
      );
  }

  fetchUserProfile(email: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
    });
    return this.http
      .get<any>(`${this.apiUrl}/auth/profile`, { params: { email }, headers })
      .pipe(
        tap((res) => {
          if (
            res &&
            res.user &&
            this.currentUserValue &&
            res.user.email.toLowerCase() ===
              this.currentUserValue.email.toLowerCase()
          ) {
            localStorage.setItem(
              'onboarding_current_user',
              JSON.stringify(res.user),
            );
            this.currentUserSubject.next(res.user);
          }
        }),
        catchError((err) => {
          return throwError(
            () =>
              new Error(err.error?.error || 'Failed to fetch user profile.'),
          );
        }),
      );
  }


  // ─── Instagram OAuth Methods ────────────────────────

  connectInstagramWithToken(accessToken: string): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json',
    });
    return this.http
      .post<any>(`${this.apiUrl}/instagram/connect`, { accessToken }, { headers })
      .pipe(
        tap((res) => {
          if (res && res.user) {
            localStorage.setItem(
              'onboarding_current_user',
              JSON.stringify(res.user),
            );
            this.currentUserSubject.next(res.user);
          }
        }),
        catchError((err) => {
          return throwError(
            () =>
              new Error(
                err.error?.error || 'Failed to connect Instagram account.',
              ),
          );
        }),
      );
  }

  disconnectInstagram(): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
    });
    return this.http
      .post<any>(`${this.apiUrl}/instagram/disconnect`, {}, { headers })
      .pipe(
        tap((res) => {
          if (res && res.user) {
            localStorage.setItem(
              'onboarding_current_user',
              JSON.stringify(res.user),
            );
            this.currentUserSubject.next(res.user);
          }
        }),
        catchError((err) => {
          return throwError(
            () =>
              new Error(
                err.error?.error || 'Failed to disconnect Instagram.',
              ),
          );
        }),
      );
  }

  // ─── Post & AI Methods ────────────────────────────

  createPost(formData: FormData): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
    });
    return this.http
      .post<any>(`${this.apiUrl}/posts`, formData, { headers })
      .pipe(
        catchError((err) => {
          return throwError(
            () => new Error(err.error?.error || 'Failed to create post.'),
          );
        }),
      );
  }

  getPosts(): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
    });
    return this.http
      .get<any>(`${this.apiUrl}/posts`, { headers })
      .pipe(
        catchError((err) => {
          return throwError(
            () => new Error(err.error?.error || 'Failed to fetch posts.'),
          );
        }),
      );
  }

  generateCaption(prompt: string, currentCaption?: string): Observable<{ caption: string }> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json',
    });
    return this.http
      .post<{ caption: string }>(
        `${this.apiUrl}/posts/generate-caption`,
        { prompt, currentCaption },
        { headers }
      )
      .pipe(
        catchError((err) => {
          return throwError(
            () => new Error(err.error?.error || 'Failed to generate AI caption.'),
          );
        }),
      );
  }

  getSyncedInstagramPosts(): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
    });
    return this.http
      .get<any>(`${this.apiUrl}/instagram/media`, { headers })
      .pipe(
        catchError((err) => {
          return throwError(
            () => new Error(err.error?.error || 'Failed to sync Instagram posts.'),
          );
        }),
      );
  }

  logout() {
    localStorage.removeItem('onboarding_current_user');
    localStorage.removeItem('auth_token');
    this.token = null;
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    if (this.token) return this.token;
    const stored = localStorage.getItem('auth_token');
    if (stored) {
      this.token = stored;
      return stored;
    }
    return null;
  }

  getRole(): 'influencer' | 'brand' | null {
    return this.currentUserValue?.role || this.registrationRole || null;
  }

  isProfileComplete(): boolean {
    return this.currentUserValue?.isProfileComplete || false;
  }
}
