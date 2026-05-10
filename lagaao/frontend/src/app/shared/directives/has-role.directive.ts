import { Directive, inject, input, effect, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Directive({
  selector: '[appHasRole]',
  standalone: true,
})
export class HasRoleDirective {
  private readonly auth = inject(AuthService);
  private readonly tpl  = inject(TemplateRef<unknown>);
  private readonly vcr  = inject(ViewContainerRef);

  readonly appHasRole = input.required<string | string[]>();

  constructor() {
    effect(() => {
      const roles    = this.appHasRole();
      const user     = this.auth.user();
      const required = Array.isArray(roles) ? roles : [roles];
      const userRoles: string[] = (user as any)?.roles ?? [];

      const allowed  = required.some(r => userRoles.includes(r));

      this.vcr.clear();
      if (allowed) this.vcr.createEmbeddedView(this.tpl);
    });
  }
}
