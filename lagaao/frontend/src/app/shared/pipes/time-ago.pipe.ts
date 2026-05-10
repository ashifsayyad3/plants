import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'timeAgo', standalone: true, pure: false })
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) return '';
    const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
    if (seconds < 60)  return 'just now';
    const m = Math.floor(seconds / 60);
    if (m < 60)        return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24)        return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30)        return `${d}d ago`;
    const mo = Math.floor(d / 30);
    if (mo < 12)       return `${mo}mo ago`;
    return `${Math.floor(mo / 12)}y ago`;
  }
}
