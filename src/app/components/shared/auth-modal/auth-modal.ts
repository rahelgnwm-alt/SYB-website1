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

  protected readonly username = signal('admin@sybindonesia.com');
  protected readonly password = signal('sybadmin2026');
  protected readonly selectedDemoType = signal<'admin' | 'customer'>('admin');

  protected readonly isDetectedAdmin = computed(() =>
    this.authService.isAdminCredentials(this.username(), this.password())
  );

  close(): void {
    this.authService.closeLoginModal();
  }

  fillAdminDemo(): void {
    this.selectedDemoType.set('admin');
    this.username.set('admin@sybindonesia.com');
    this.password.set('sybadmin2026');
  }

  fillCustomerDemo(): void {
    this.selectedDemoType.set('customer');
    this.username.set('aulia.r@gmail.com');
    this.password.set('customer123');
  }

  async handleLogin(event: Event): Promise<void> {
    event.preventDefault();
    const res = await this.authService.login(this.username(), this.password());
    if (res.success) {
      const ret = this.authService.getReturnUrl();
      const isAdmin = res.role === 'admin';
      const target = ret && (isAdmin === ret.startsWith('/admin')) ? ret : (isAdmin ? '/admin/products' : '/profile');
      this.router.navigateByUrl(target);
    }
  }
}
