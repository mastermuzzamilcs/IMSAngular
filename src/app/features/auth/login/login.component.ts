import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { SessionBranch } from '../../../core/Models/AuthSession';
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
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  errorMessage = '';
  submitting = false;
  showPassword = false;
  choosingBranch = false;
  branches: SessionBranch[] = [];
  loginForm;
  branchForm;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.loginForm = this.fb.group({
      identifier: ['', [Validators.required]],
      password: ['', Validators.required],
    });
    this.branchForm = this.fb.group({
      branchid: ['', Validators.required],
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
      const identifier = this.loginForm.value.identifier || '';
      const password = this.loginForm.value.password || '';
      const result = await this.auth.login(identifier, password);
      if (!result.ok) {
        this.errorMessage = 'Email/username or password is incorrect, or the user is inactive.';
        return;
      }
      if (result.chooseBranch) {
        this.branches = result.branches;
        this.choosingBranch = true;
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

  async confirmBranch(): Promise<void> {
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      return;
    }
    const branchid = this.branchForm.value.branchid || '';
    if (!this.auth.selectBranch(branchid)) {
      this.errorMessage = 'Choose a branch to continue.';
      return;
    }
    await this.router.navigateByUrl(this.safeReturnUrl());
  }

  private safeReturnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
    if (!returnUrl.startsWith('/') || returnUrl.startsWith('/auth')) {
      return '/dashboard';
    }
    return returnUrl;
  }
}
