import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MagneticDirective, RevealDirective } from '../../../../../directives';
import { TimeService } from '../../../../../services/time.service';

/** Flash sale banner with live WIB countdown timer */
@Component({
  selector: 'app-flash-sale',
  imports: [RouterLink, RevealDirective, MagneticDirective],
  templateUrl: './flash-sale.html',
  styleUrl: './flash-sale.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlashSale {
  protected readonly time = inject(TimeService);
}
