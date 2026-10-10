import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  errorMessage = '';
  submitting = false;
  loginForm;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
    if (this.auth.isAuthenticated()) {
      void this.router.navigateByUrl(this.safeReturnUrl());
    }
  }

  async submit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.errorMessage = '';
    try {
      const email = this.loginForm.value.email || '';
      const password = this.loginForm.value.password || '';
      const signedIn = await this.auth.login(email, password);
      if (!signedIn) {
        this.errorMessage = 'Email or password is incorrect, or the user is inactive.';
        return;
      }
      await this.router.navigateByUrl(this.safeReturnUrl());
    } catch (error) {
      console.error('Login failed', error);
      this.errorMessage = 'Unable to sign in right now.';
    } finally {
      this.submitting = false;
    }
  }

  private safeReturnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
    if (!returnUrl.startsWith('/') || returnUrl.startsWith('/auth')) {
      return '/dashboard';
    }
    return returnUrl;
  }
}
