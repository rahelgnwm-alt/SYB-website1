import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../../../../directives';
import { Product } from '../../../../../data';
import { TimeService } from '../../../../../services/time.service';
import { ProductService } from '../../../../../services/product.service';

/** Dual Clocks & AM/PM Skincare Rituals section */
@Component({
  selector: 'app-dual-clock',
  imports: [RouterLink, RevealDirective],
  templateUrl: './dual-clock.html',
  styleUrl: './dual-clock.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DualClock {
  protected readonly time = inject(TimeService);
  private readonly productService = inject(ProductService);
  protected readonly activeRitual = signal<'am' | 'pm' | null>(null);

  protected readonly rituals = computed(() => {
    const list = this.productService.storefrontProducts();
    const findP = (id: string, fallbackName: string, fallbackImg: string): Product => {
      const match = list.find((p) => p.id === id);
      if (match) return match;
      return {
        id,
        name: fallbackName,
        tagline: '',
        image: fallbackImg,
        price: 0,
        compareAt: 0,
        handle: id,
        tint: '#ffe1ef',
      };
    };

    return [
      {
        key: 'am' as const,
        label: 'Ritual Pagi',
        time: '07:00',
        title: 'Fresh & Glowing',
        image: 'images/ritual-morning.jpg',
        hour: 7,
        steps: [
          { step: 'Prep', product: findP('aha-body-toner', 'AHA Skinboost Body Toner', 'products/aha-body-toner.jpg') },
          { step: 'Treat', product: findP('red-jelly-serum', 'FORTE Red Jelly Serum', 'products/red-jelly-serum.jpg') },
          { step: 'Pop of color', product: findP('lip-cream-matte', 'Lip Cream Matte', 'products/lip-cream-matte.jpg') },
        ],
      },
      {
        key: 'pm' as const,
        label: 'Ritual Malam',
        time: '22:00',
        title: 'Calm & Recharge',
        image: 'images/ritual-night.jpg',
        hour: 22,
        steps: [
          { step: 'Exfoliate', product: findP('peeling-serum', 'Peeling Serum Vitamin C', 'products/peeling-serum.jpg') },
          { step: 'Mask', product: findP('golden-egg-mask', 'Bright Glow Jelly Mask Golden Egg', 'products/golden-egg-mask.jpg') },
          { step: 'Lip care', product: findP('lippy-oil-serum', 'Vitamin Lippy Oil Serum', 'products/lippy-oil-serum.jpg') },
        ],
      },
    ];
  });
}
