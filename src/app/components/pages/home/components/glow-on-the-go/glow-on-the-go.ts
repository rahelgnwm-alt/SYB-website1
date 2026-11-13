import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MagneticDirective, RevealDirective } from '../../../../../directives';

@Component({
  selector: 'app-glow-on-the-go',
  imports: [RouterLink, RevealDirective, MagneticDirective],
  templateUrl: './glow-on-the-go.html',
  styleUrl: './glow-on-the-go.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlowOnTheGo {}
