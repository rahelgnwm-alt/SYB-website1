import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-ai-skin-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ai-skin-banner.html',
  styleUrl: './ai-skin-banner.css'
})
export class AiSkinBannerComponent {}

