import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MagneticDirective, RevealDirective } from '../../../../../directives';
import { SHOP_URL } from '../../../../../data';

@Component({
  selector: 'app-glow-on-the-go',
  imports: [RevealDirective, MagneticDirective],
  templateUrl: './glow-on-the-go.html',
  styleUrl: './glow-on-the-go.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlowOnTheGo {
  protected readonly shopUrl = SHOP_URL;
}
