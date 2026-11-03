import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  OnInit,
  effect,
  untracked
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MagneticDirective, RevealDirective } from '../../../directives';
import { PRODUCTS, Product, SHOP_URL, productUrl } from '../../../data';
import { CartService } from '../../../services/cart.service';
import { JneApiService } from '../../../services/jne-api.service';
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
  protected readonly productUrl = productUrl;
  protected readonly shopUrl = SHOP_URL;

  // JNE Destinations
  protected readonly destinations: DestinationOption[] = this.jneApi.availableDestinations;
  protected readonly selectedDestCode = signal<string>('CGK10000');

  // JNE Tariffs state
  protected readonly isLoadingTariff = signal<boolean>(false);
  protected readonly tariffOptions = signal<JneTariffOption[]>([]);
  protected readonly selectedTariff = signal<JneTariffOption | null>(null);

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

  /** Products not in the cart yet — shown as quick add-ons. */
  protected readonly suggestions = computed(() => {
    const inCart = new Set(this.cart.lines().map((l) => l.product.id));
    return PRODUCTS.filter((p) => !inCart.has(p.id)).slice(0, 4);
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
  }

  protected selectService(opt: JneTariffOption): void {
    this.selectedTariff.set(opt);
  }

  protected async fetchTariff(destCode: string, weightKg: number): Promise<void> {
    this.isLoadingTariff.set(true);
    try {
      const options = await this.jneApi.checkTariff(destCode, weightKg);
      this.tariffOptions.set(options);

      const current = this.selectedTariff();
      const matched = current ? options.find((o) => o.serviceCode === current.serviceCode) : null;
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

  protected rupiah(n: number) {
    return 'Rp' + Math.round(n).toLocaleString('id-ID');
  }

  protected discount(p: Product) {
    return Math.round((1 - p.price / p.compareAt) * 100);
  }
}
