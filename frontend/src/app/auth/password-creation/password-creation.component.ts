import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-password-creation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, IonicModule],
  templateUrl: './password-creation.component.html',
  styleUrls: ['./password-creation.component.scss']
})
export class PasswordCreationComponent implements OnInit {
  passwordForm: FormGroup;
  email: string = '';
  isLoading = false;
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.email = this.authService.registrationEmail;
    if (!this.email) {
      this.router.navigate(['/register']);
    }
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  onSubmit() {
    if (this.passwordForm.invalid) return;

    this.isLoading = true;
    this.errorMsg = '';

    const password = this.passwordForm.value.password;

    this.authService.createPassword(this.email, password).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/profile-creation']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err.message || 'Failed to create password.';
      }
    });
  }
}
