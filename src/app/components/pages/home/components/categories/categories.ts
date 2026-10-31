import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RevealDirective } from '../../../../../directives';
import { CATEGORIES } from '../../../../../data';

@Component({
  selector: 'app-categories',
  imports: [RevealDirective],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Categories {
  protected readonly categories = CATEGORIES;
  protected readonly activeCategory = signal(0);
}
