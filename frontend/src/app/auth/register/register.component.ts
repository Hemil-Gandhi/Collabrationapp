import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    IonicModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  selectedRole: 'influencer' | 'brand' = 'influencer';
  isLoading = false;
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onRoleChange(event: any) {
    this.selectedRole = event.detail.value;
  }

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.isLoading = true;
    this.errorMsg = '';

    const email = this.registerForm.value.email;

    this.authService.registerStart(email, this.selectedRole).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/otp']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err.message || 'Failed to start registration.';
      }
    });
  }
}
