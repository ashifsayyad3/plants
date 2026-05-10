import { Component, input, computed } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [NgStyle],
  template: `
    @if (src()) {
      <img class="avatar" [src]="src()" [alt]="name()" [ngStyle]="sizeStyle()" />
    } @else {
      <span class="avatar avatar--initials" [ngStyle]="sizeStyle()" [style.background]="bgColor()">
        {{ initials() }}
      </span>
    }
  `,
  styles: [`
    @use '../../../../../styles/variables' as *;
    .avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      object-fit: cover;
      font-weight: 600;
      color: #fff;
      flex-shrink: 0;
      user-select: none;
    }
    .avatar--initials { font-size: 0.45em; }
  `],
})
export class AvatarComponent {
  readonly src  = input<string | null>(null);
  readonly name = input<string>('?');
  readonly size = input<number>(36);

  readonly initials = computed(() => {
    const parts = this.name().trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return this.name().slice(0, 2).toUpperCase();
  });

  readonly bgColor = computed(() => {
    const colors = ['#5c35c7','#0d9488','#d97706','#dc2626','#2563eb','#7c3aed','#059669'];
    let hash = 0;
    for (const c of this.name()) hash = c.charCodeAt(0) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  });

  readonly sizeStyle = computed(() => ({
    width:  `${this.size()}px`,
    height: `${this.size()}px`,
    fontSize: `${this.size()}px`,
  }));
}
