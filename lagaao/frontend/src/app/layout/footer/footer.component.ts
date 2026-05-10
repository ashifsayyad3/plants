import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <span>&copy; {{ year }} Lagaao.com — All rights reserved</span>
      <nav class="footer__links">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Service</a>
        <a href="#">Support</a>
      </nav>
    </footer>
  `,
  styles: [`
    @use '../../../../styles/variables' as *;
    .footer {
      height: $footer-height;
      background: var(--surface-card);
      border-top: 1px solid var(--surface-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 $spacing-lg;
      font-size: $font-size-sm;
      color: var(--text-muted);
      flex-shrink: 0;
    }
    .footer__links {
      display: flex;
      gap: $spacing-md;
      a { color: var(--text-muted); text-decoration: none;
        &:hover { color: var(--text-link); } }
    }
  `],
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
}
