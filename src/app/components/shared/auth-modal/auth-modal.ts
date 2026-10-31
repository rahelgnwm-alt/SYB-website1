import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-auth-modal',
  imports: [CommonModule],
  templateUrl: './auth-modal.html',
  styleUrl: './auth-modal.css'
})
export class AuthModalComponent {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly username = signal('admin@sybindonesia.com');
  protected readonly password = signal('sybadmin2026');
  protected readonly selectedDemoType = signal<'admin' | 'customer'>('admin');

  // Reactive detection of whether the entered credentials will log into Admin or Customer
  protected readonly isDetectedAdmin = computed(() => {
    const u = this.username().trim().toLowerCase();
    const p = this.password().trim();
    const isUser = u === 'admin@sybindonesia.com' || u === 'sybofficial' || u === 'admin';
    const isPass = ['sybadmin2026', 'admin123', 'admin'].includes(p);
    return isUser && isPass;
  });

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
      if (res.role === 'admin') {
        const returnUrl = this.authService.getReturnUrl();
        const target = returnUrl && returnUrl.startsWith('/admin') ? returnUrl : '/admin/products';
        this.router.navigateByUrl(target);
      } else {
        const returnUrl = this.authService.getReturnUrl();
        const target = returnUrl && !returnUrl.startsWith('/admin') ? returnUrl : '/profile';
        this.router.navigateByUrl(target);
      }
    }
  }
}
