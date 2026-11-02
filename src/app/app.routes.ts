import { Routes } from '@angular/router';
import { authGuard, customerGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/pages/home/home').then((m) => m.Home),
    title: 'SYB Official — Glowing & Cute Skincare Indonesia',
  },
  {
    path: 'products',
    loadComponent: () => import('./components/pages/products/products').then((m) => m.Products),
    title: 'Semua Produk — SYB Official',
  },
  {
    path: 'products/:id',
    loadComponent: () => import('./components/pages/product-detail/product-detail').then((m) => m.ProductDetail),
    title: 'Detail Produk — SYB Official',
  },
  {
    path: 'about',
    loadComponent: () => import('./components/pages/about/about').then((m) => m.About),
    title: 'Tentang Kami — Profil Perusahaan SYB Official',
  },
  {
    path: 'cart',
    loadComponent: () => import('./components/pages/cart/cart').then((m) => m.Cart),
    title: 'Keranjang — SYB Official',
  },
  {
    path: 'flash-sale',
    loadComponent: () => import('./components/pages/home/components/flash-sale/flash-sale').then((m) => m.FlashSale),
    title: 'Flash Sale — SYB Official',
  },
  {
    path: 'rituals',
    loadComponent: () => import('./components/pages/home/components/dual-clock/dual-clock').then((m) => m.DualClock),
    title: "Glow O'Clock Ritual — SYB Official",
  },
  {
    path: 'profile',
    loadComponent: () => import('./components/pages/profile/profile').then((m) => m.ProfileComponent),
    canActivate: [customerGuard],
    title: 'Profil Saya — SYB Official',
  },
  { path: 'account', redirectTo: 'profile', pathMatch: 'full' },
  {
    path: 'admin',
    loadComponent: () => import('./components/pages/admin/admin').then((m) => m.AdminComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'products', pathMatch: 'full' },
      {
        path: 'products',
        loadComponent: () => import('./components/pages/admin/components/admin-products/admin-products').then((m) => m.AdminProductsComponent),
        title: 'Products — Shopify Admin SYBofficial',
      },
      {
        path: 'discounts',
        loadComponent: () => import('./components/pages/admin/components/admin-discounts/admin-discounts').then((m) => m.AdminDiscountsComponent),
        title: 'Discounts & Pricing — Shopify Admin SYBofficial',
      },
      {
        path: 'flash-sale',
        loadComponent: () => import('./components/pages/admin/components/admin-flash-sale/admin-flash-sale').then((m) => m.AdminFlashSaleComponent),
        title: 'Flash Sale Manager — Shopify Admin SYBofficial',
      },
      {
        path: 'shipping',
        loadComponent: () => import('./components/pages/admin/components/admin-logistics/admin-logistics').then((m) => m.AdminLogisticsComponent),
        title: 'Shipping & Delivery — Shopify Admin SYBofficial',
      },
      {
        path: 'orders',
        loadComponent: () => import('./components/pages/admin/components/admin-orders/admin-orders').then((m) => m.AdminOrdersComponent),
        title: 'Orders — Shopify Admin SYBofficial',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
