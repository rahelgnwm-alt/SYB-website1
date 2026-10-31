import { Injectable, signal, computed } from '@angular/core';

export interface UserSession {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'superadmin' | 'store_manager' | 'customer';
  storeName?: string;
  lastLogin: string;
  glowPoints?: number;
  memberTier?: 'Bronze' | 'Silver' | 'Gold' | 'VIP';
  address?: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  };
}

// Kept for backward compatibility
export type AdminUser = UserSession;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly defaultAdminUsername = 'admin@sybindonesia.com';
  private readonly fallbackUsername = 'sybofficial';
  private readonly validAdminPasswords = ['sybadmin2026', 'admin123', 'admin'];

  // Known customers directory for rich simulated customer experiences
  private readonly knownCustomers: Record<string, Partial<UserSession>> = {
    'aulia.r@gmail.com': {
      fullName: 'Aulia Rahmadani',
      phone: '0812-9841-2933',
      glowPoints: 520,
      memberTier: 'Gold',
      address: {
        street: 'Jl. Senopati No. 42, Kebayoran Baru',
        city: 'Jakarta Selatan',
        province: 'DKI Jakarta',
        postalCode: '12190'
      }
    },
    'kezia.m@yahoo.com': {
      fullName: 'Kezia Maharani',
      phone: '0857-1239-8411',
      glowPoints: 340,
      memberTier: 'Silver',
      address: {
        street: 'Komplek Permata Buana Blok C3',
        city: 'Kota Surabaya (Origin)',
        province: 'Jawa Timur',
        postalCode: '60119'
      }
    },
    'siti.nur@gmail.com': {
      fullName: 'Siti Nurhaliza',
      phone: '0813-9908-1234',
      glowPoints: 680,
      memberTier: 'VIP',
      address: {
        street: 'Jl. Riau No. 88, Citarum',
        city: 'Kota Bandung',
        province: 'Jawa Barat',
        postalCode: '40115'
      }
    },
    'indahk@outlook.com': {
      fullName: 'Indah Kusuma',
      phone: '0819-8765-4321',
      glowPoints: 210,
      memberTier: 'Silver',
      address: {
        street: 'Jl. Sunset Road No. 12',
        city: 'Kota Denpasar',
        province: 'Bali',
        postalCode: '80361'
      }
    }
  };

  // Reactive State Signals
  readonly currentUser = signal<UserSession | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'superadmin' || role === 'store_manager';
  });
  readonly isCustomer = computed(() => this.currentUser()?.role === 'customer');

  readonly isLoginModalOpen = signal<boolean>(false);
  readonly loginError = signal<string | null>(null);
  readonly isAuthenticating = signal<boolean>(false);

  private returnUrl: string | null = null;

  constructor() {
    this.restoreSession();
  }

  openLoginModal(returnUrl?: string): void {
    if (returnUrl) {
      this.returnUrl = returnUrl;
    }
    this.loginError.set(null);
    this.isLoginModalOpen.set(true);
  }

  closeLoginModal(): void {
    this.isLoginModalOpen.set(false);
    this.loginError.set(null);
  }

  /**
   * Universal Login Handler:
   * If credentials match admin -> logs in as Super Admin (redirects to /admin/products)
   * If not admin credentials -> logs in as Customer (redirects to /profile)
   */
  async login(usernameInput: string, passwordInput: string): Promise<{ success: boolean; role: 'admin' | 'customer' }> {
    this.isAuthenticating.set(true);
    this.loginError.set(null);

    // Realistic short delay
    await new Promise((resolve) => setTimeout(resolve, 350));

    const cleanUsername = usernameInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    const isUsernameMatch =
      cleanUsername === this.defaultAdminUsername ||
      cleanUsername === this.fallbackUsername ||
      cleanUsername === 'admin';

    const isPasswordMatch = this.validAdminPasswords.includes(cleanPassword);

    const nowFormatted = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // 1. IF CREDENTIALS MATCH ADMIN -> LOG INTO ADMIN
    if (isUsernameMatch && isPasswordMatch) {
      const adminUser: UserSession = {
        id: 'usr_admin_01',
        username: cleanUsername.includes('@') ? cleanUsername.split('@')[0] : cleanUsername,
        email: cleanUsername.includes('@') ? cleanUsername : 'admin@sybindonesia.com',
        fullName: 'Super Admin SYB Official',
        role: 'superadmin',
        storeName: 'SYBofficial Official Store',
        lastLogin: nowFormatted
      };

      this.currentUser.set(adminUser);
      this.persistSession(adminUser);
      this.isAuthenticating.set(false);
      this.closeLoginModal();
      return { success: true, role: 'admin' };
    }

    // 2. IF NOT ADMIN -> LOG INTO CUSTOMER PROFILE
    // Match against known customer data or generate a personalized customer profile
    const matchedCustomer = this.knownCustomers[cleanUsername];
    const generatedName = cleanUsername.includes('@')
      ? cleanUsername.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
      : cleanUsername.replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

    const customerUser: UserSession = {
      id: `cust_${Date.now()}`,
      username: cleanUsername,
      email: cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@gmail.com`,
      fullName: matchedCustomer?.fullName || generatedName || 'Pelanggan Setia SYB',
      phone: matchedCustomer?.phone || '0812-9841-2933',
      role: 'customer',
      lastLogin: nowFormatted,
      glowPoints: matchedCustomer?.glowPoints || 350,
      memberTier: matchedCustomer?.memberTier || 'Gold',
      address: matchedCustomer?.address || {
        street: 'Jl. Senopati No. 42, RT 02 / RW 05',
        city: 'Jakarta Selatan',
        province: 'DKI Jakarta',
        postalCode: '12190'
      }
    };

    this.currentUser.set(customerUser);
    this.persistSession(customerUser);
    this.isAuthenticating.set(false);
    this.closeLoginModal();
    return { success: true, role: 'customer' };
  }

  updateProfile(partial: Partial<UserSession>): void {
    const current = this.currentUser();
    if (!current) return;
    const updated: UserSession = {
      ...current,
      ...partial,
      address: partial.address ? { ...current.address, ...partial.address } : current.address
    };
    this.currentUser.set(updated);
    this.persistSession(updated);
  }

  logout(): void {
    this.currentUser.set(null);
    try {
      localStorage.removeItem('syb_user_session');
      localStorage.removeItem('syb_admin_session');
    } catch {}
  }

  getReturnUrl(): string | null {
    const url = this.returnUrl;
    this.returnUrl = null;
    return url;
  }

  private persistSession(user: UserSession): void {
    try {
      localStorage.setItem('syb_user_session', JSON.stringify(user));
      // For legacy compatibility if admin
      if (user.role === 'superadmin' || user.role === 'store_manager') {
        localStorage.setItem('syb_admin_session', JSON.stringify(user));
      } else {
        localStorage.removeItem('syb_admin_session');
      }
    } catch {}
  }

  private restoreSession(): void {
    try {
      const savedUser = localStorage.getItem('syb_user_session');
      if (savedUser) {
        this.currentUser.set(JSON.parse(savedUser));
        return;
      }
      const savedAdmin = localStorage.getItem('syb_admin_session');
      if (savedAdmin) {
        this.currentUser.set(JSON.parse(savedAdmin));
      }
    } catch {}
  }
}
