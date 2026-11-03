import { Component, inject, computed, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { ShippingService } from '../../../services/shipping.service';
import { AuthService } from '../../../services/auth.service';
import { TimeService } from '../../../services/time.service';

@Component({
  selector: 'app-admin',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent implements OnInit, OnDestroy {
  readonly productService = inject(ProductService);
  readonly shippingService = inject(ShippingService);
  readonly authService = inject(AuthService);
  readonly timeService = inject(TimeService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('admin-portal-active');
    }
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('admin-portal-active');
    }
  }

  // Counters for Sidebar Badges
  readonly totalProductsCount = computed(() => this.productService.products().length);
  readonly discountedCount = computed(() => this.productService.products().filter(p => p.price < p.originalPrice).length);
  readonly flashSaleCount = computed(() => this.productService.products().filter(p => p.isFlashSale).length);
  readonly isFlashSaleActive = computed(() => this.timeService.flashSaleConfig().isActive);
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
