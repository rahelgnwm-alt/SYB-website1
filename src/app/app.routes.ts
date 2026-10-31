import { Routes } from '@angular/router';
import { Home } from './components/pages/home/home';
import { Products } from './components/pages/products/products';
import { ProductDetail } from './components/pages/product-detail/product-detail';
import { About } from './components/pages/about/about';
import { Cart } from './components/pages/cart/cart';
import { FlashSale, DualClock } from './components/pages/home/components';
import { AdminComponent } from './components/pages/admin/admin';
import { AdminProductsComponent } from './components/pages/admin/components/admin-products/admin-products';
import { AdminLogisticsComponent } from './components/pages/admin/components/admin-logistics/admin-logistics';
import { AdminOrdersComponent } from './components/pages/admin/components/admin-orders/admin-orders';
import { ProfileComponent } from './components/pages/profile/profile';
import { authGuard, customerGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Home, title: 'SYB Official — Glowing & Cute Skincare Indonesia' },
  { path: 'products', component: Products, title: 'Semua Produk — SYB Official' },
  { path: 'products/:id', component: ProductDetail, title: 'Detail Produk — SYB Official' },
  { path: 'about', component: About, title: 'Tentang Kami — Profil Perusahaan SYB Official' },
  { path: 'cart', component: Cart, title: 'Keranjang — SYB Official' },
  { path: 'flash-sale', component: FlashSale, title: 'Flash Sale — SYB Official' },
  { path: 'rituals', component: DualClock, title: "Glow O'Clock Ritual — SYB Official" },
  { path: 'profile', component: ProfileComponent, canActivate: [customerGuard], title: 'Profil Saya — SYB Official' },
  { path: 'account', redirectTo: 'profile', pathMatch: 'full' },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'products', pathMatch: 'full' },
      { path: 'products', component: AdminProductsComponent, title: 'Products — Shopify Admin SYBofficial' },
      { path: 'shipping', component: AdminLogisticsComponent, title: 'Shipping & Delivery — Shopify Admin SYBofficial' },
      { path: 'orders', component: AdminOrdersComponent, title: 'Orders — Shopify Admin SYBofficial' },
    ]
  },
  { path: '**', redirectTo: '' },
];
