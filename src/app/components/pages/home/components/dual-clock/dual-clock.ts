import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../../../../directives';
import { RITUALS } from '../../../../../data';
import { TimeService } from '../../../../../services/time.service';

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
  protected readonly rituals = RITUALS;
  protected readonly activeRitual = signal<'am' | 'pm' | null>(null);
}
