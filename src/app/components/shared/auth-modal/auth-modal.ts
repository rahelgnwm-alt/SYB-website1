import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-auth-modal',
  templateUrl: './auth-modal.html',
  styleUrl: './auth-modal.css'
})
export class AuthModalComponent {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly username = signal('');
  protected readonly password = signal('');
  protected readonly showPassword = signal(false);

  protected readonly isDetectedAdmin = computed(() =>
    this.authService.isAdminCredentials(this.username(), this.password())
  );

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  close(): void {
    this.username.set('');
    this.password.set('');
    this.showPassword.set(false);
    this.authService.closeLoginModal();
  }

  async handleLogin(event: Event): Promise<void> {
    event.preventDefault();
    const res = await this.authService.login(this.username(), this.password());
    if (res.success) {
      this.username.set('');
      this.password.set('');
      this.showPassword.set(false);
      const ret = this.authService.getReturnUrl();
      const isAdmin = res.role === 'admin';
      const target = ret && (isAdmin === ret.startsWith('/admin')) ? ret : (isAdmin ? '/admin/products' : '/profile');
      this.router.navigateByUrl(target);
    }
  }
}
