import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, IonicModule],
  templateUrl: './otp.component.html',
  styleUrls: ['./otp.component.scss']
})
export class OtpComponent implements OnInit {
  otpForm: FormGroup;
  email: string = '';
  isLoading = false;
  isResending = false;
  errorMsg = '';
  successMsg = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
    });
  }

  ngOnInit() {
    this.email = this.authService.registrationEmail;
    if (!this.email) {
      this.router.navigate(['/register']);
    }
  }

  onSubmit() {
    if (this.otpForm.invalid) return;

    this.isLoading = true;
    this.errorMsg = '';
    this.successMsg = '';

    const otp = this.otpForm.value.otp;

    this.authService.verifyOtp(this.email, otp).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/password-creation']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err.message || 'Invalid or expired OTP. Please try again.';
      }
    });
  }

  resendOtp() {
    if (this.isResending) return;

    this.isResending = true;
    this.errorMsg = '';
    this.successMsg = '';

    const role = this.authService.registrationRole;

    this.authService.registerStart(this.email, role).subscribe({
      next: () => {
        this.isResending = false;
        this.successMsg = 'A new verification code has been sent to your email address.';
      },
      error: (err) => {
        this.isResending = false;
        this.errorMsg = err.message || 'Failed to resend OTP.';
      }
    });
  }
}
