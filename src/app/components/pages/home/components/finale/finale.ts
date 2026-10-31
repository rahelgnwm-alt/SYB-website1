import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MagneticDirective, RevealDirective } from '../../../../../directives';

@Component({
  selector: 'app-finale',
  imports: [RouterLink, RevealDirective, MagneticDirective],
  templateUrl: './finale.html',
  styleUrl: './finale.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Finale {}
