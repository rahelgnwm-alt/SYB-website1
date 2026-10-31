import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { ShippingService } from '../../../services/shipping.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent {
  readonly productService = inject(ProductService);
  readonly shippingService = inject(ShippingService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Counters for Sidebar Badges
  readonly totalProductsCount = computed(() => this.productService.products().length);
  readonly totalOrdersCount = computed(() => this.shippingService.orders().length);
  readonly unfulfilledCount = computed(() => this.shippingService.orders().filter(o => o.fulfillmentStatus === 'Unfulfilled').length);
  readonly activeShippingCount = computed(() =>
    this.shippingService.orders().filter(o => o.fulfillmentStatus === 'Ready to Ship' || o.fulfillmentStatus === 'Shipped').length
  );

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
