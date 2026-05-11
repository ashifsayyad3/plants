import { Component, input } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [NgStyle],
  template: `<span class="skeleton" [ngStyle]="{ width: width(), height: height(), borderRadius: radius() }"></span>`,
  styles: [`
    .skeleton {
      display: block;
      background: linear-gradient(90deg,
        var(--surface-hover) 25%,
        var(--surface-border) 50%,
        var(--surface-hover) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
      border-radius: 4px;
    }
    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `],
})
export class SkeletonComponent {
  readonly width  = input<string>('100%');
  readonly height = input<string>('16px');
  readonly radius = input<string>('4px');
}
