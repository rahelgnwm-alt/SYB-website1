import { ChangeDetectionStrategy, Component } from '@angular/core';
import { INGREDIENTS } from '../../../../../data';

@Component({
  selector: 'app-ingredients',
  imports: [],
  templateUrl: './ingredients.html',
  styleUrl: './ingredients.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Ingredients {
  protected readonly ingredients = INGREDIENTS;
}
