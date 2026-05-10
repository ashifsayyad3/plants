import { Directive, inject, input, effect, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private readonly auth = inject(AuthService);
  private readonly tpl  = inject(TemplateRef<unknown>);
  private readonly vcr  = inject(ViewContainerRef);

  readonly appHasPermission = input.required<string | string[]>();

  constructor() {
    effect(() => {
      const perms  = this.appHasPermission();
      const user   = this.auth.user();
      const isSuperAdmin = user?.roles?.includes('super_admin') ?? false;

      const required = Array.isArray(perms) ? perms : [perms];
      const userPerms: string[] = (user as any)?.permissions ?? [];

      const allowed = isSuperAdmin || required.every(p => userPerms.includes(p));

      this.vcr.clear();
      if (allowed) this.vcr.createEmbeddedView(this.tpl);
    });
  }
}
