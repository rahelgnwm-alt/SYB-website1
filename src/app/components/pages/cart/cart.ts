import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  OnInit,
  effect,
  untracked,
  ElementRef,
  HostListener
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MagneticDirective, RevealDirective } from '../../../directives';
import { Product, calcDiscount, formatRupiah } from '../../../data';
import { CartService } from '../../../services/cart.service';
import { JneApiService } from '../../../services/jne-api.service';
import { JntApiService } from '../../../services/jnt-api.service';
import { ProductService } from '../../../services/product.service';
import { DestinationOption, JneTariffOption } from '../../../models/jne.model';

/** Cart page (route: "/cart"). */
@Component({
  selector: 'app-cart',
  imports: [RouterLink, RevealDirective, MagneticDirective, FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cart implements OnInit {
  protected readonly cart = inject(CartService);
  protected readonly jneApi = inject(JneApiService);
  protected readonly jntApi = inject(JntApiService);
  protected readonly productService = inject(ProductService);
  private readonly hostEl = inject(ElementRef<HTMLElement>);
  protected readonly rupiah = formatRupiah;
  protected readonly discount = calcDiscount;

  // JNE Destinations & Custom Selector State
  protected readonly destinations: DestinationOption[] = this.jneApi.availableDestinations;
  protected readonly selectedDestCode = signal<string>('CGK10000');
  protected readonly isDestDropdownOpen = signal<boolean>(false);
  protected readonly destSearchQuery = signal<string>('');

  protected readonly selectedDestination = computed<DestinationOption>(() => {
    const code = this.selectedDestCode();
    return (
      this.destinations.find((d) => d.code === code) ||
      this.destinations[0] || {
        code: 'CGK10000',
        city: 'Jakarta Selatan & DKI Jakarta',
        province: 'DKI Jakarta',
        group: 'Jabodetabek',
      }
    );
  });

  protected readonly filteredDestinations = computed<DestinationOption[]>(() => {
    const q = this.destSearchQuery().trim().toLowerCase();
    if (!q) return this.destinations;
    return this.destinations.filter(
      (d) =>
        d.city.toLowerCase().includes(q) ||
        d.province.toLowerCase().includes(q) ||
        d.group.toLowerCase().includes(q)
    );
  });

  // JNE & J&T Tariffs state
  protected readonly isLoadingTariff = signal<boolean>(false);
  protected readonly tariffOptions = signal<JneTariffOption[]>([]);
  protected readonly selectedTariff = signal<JneTariffOption | null>(null);
  protected readonly activeCourierFilter = signal<'ALL' | 'JNE' | 'J&T'>('ALL');

  protected readonly filteredTariffOptions = computed<JneTariffOption[]>(() => {
    const filter = this.activeCourierFilter();
    const all = this.tariffOptions();
    if (filter === 'ALL') return all;
    return all.filter((o) => (o.courier || 'JNE') === filter);
  });

  // Weight computed: estimate ~250g per cosmetic item, minimum 1kg
  protected readonly estimatedWeightKg = computed(() => {
    const totalItems = this.cart.count();
    return Math.max(1, Math.ceil(totalItems * 0.25));
  });

  protected readonly isFreeShipping = computed(() =>
    this.cart.subtotal() >= this.cart.freeShippingThreshold
  );

  protected readonly shippingCost = computed(() => {
    if (this.isFreeShipping()) return 0;
    return this.selectedTariff()?.price ?? 0;
  });

  protected readonly grandTotal = computed(() =>
    this.cart.subtotal() + this.shippingCost()
  );

  /** Products not in the cart yet — shown as quick add-ons, synced with live admin state. */
  protected readonly suggestions = computed(() => {
    const inCart = new Set(this.cart.lines().map((l) => l.product.id));
    return this.productService.storefrontProducts()
      .filter((p) => !inCart.has(p.id))
      .slice(0, 4);
  });

  constructor() {
    // Automatically recalculate tariff when weight or destination changes
    effect(() => {
      const dest = this.selectedDestCode();
      const weight = this.estimatedWeightKg();
      untracked(() => {
        this.fetchTariff(dest, weight);
      });
    });
  }

  ngOnInit(): void {
    this.fetchTariff(this.selectedDestCode(), this.estimatedWeightKg());
  }

  protected onDestinationChange(code: string): void {
    this.selectedDestCode.set(code);
    this.isDestDropdownOpen.set(false);
    this.destSearchQuery.set('');
  }

  protected toggleDestDropdown(event?: MouseEvent): void {
    event?.stopPropagation();
    const next = !this.isDestDropdownOpen();
    this.isDestDropdownOpen.set(next);
    if (!next) {
      this.destSearchQuery.set('');
    }
  }

  protected closeDestDropdown(): void {
    this.isDestDropdownOpen.set(false);
    this.destSearchQuery.set('');
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.isDestDropdownOpen()) return;
    const target = event.target as HTMLElement | null;
    if (target && !this.hostEl.nativeElement.querySelector('.dest-field')?.contains(target)) {
      this.closeDestDropdown();
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscapeKey(): void {
    if (this.isDestDropdownOpen()) {
      this.closeDestDropdown();
    }
  }

  protected selectService(opt: JneTariffOption): void {
    this.selectedTariff.set(opt);
  }

  protected setCourierFilter(filter: 'ALL' | 'JNE' | 'J&T'): void {
    this.activeCourierFilter.set(filter);
    const filtered = this.filteredTariffOptions();
    const current = this.selectedTariff();
    if (filtered.length > 0 && (!current || (filter !== 'ALL' && (current.courier || 'JNE') !== filter))) {
      this.selectedTariff.set(filtered[0]);
    }
  }

  protected async fetchTariff(destCode: string, weightKg: number): Promise<void> {
    this.isLoadingTariff.set(true);
    try {
      const [jneOptions, jntOptions] = await Promise.all([
        this.jneApi.checkTariff(destCode, weightKg),
        this.jntApi.checkTariff(destCode, weightKg),
      ]);
      const options = [...jneOptions, ...jntOptions];
      this.tariffOptions.set(options);

      const current = this.selectedTariff();
      const matched = current
        ? options.find((o) => o.serviceCode === current.serviceCode && o.courier === current.courier)
        : null;
      if (matched) {
        this.selectedTariff.set(matched);
      } else {
        const recommended = options.find((o) => o.isRecommended) || options[0] || null;
        this.selectedTariff.set(recommended);
      }
    } catch {
      // Handled by service fallback
    } finally {
      this.isLoadingTariff.set(false);
    }
  }

  protected add(e: MouseEvent, p: Product) {
    this.cart.add(p, e.currentTarget as HTMLElement);
  }
}
