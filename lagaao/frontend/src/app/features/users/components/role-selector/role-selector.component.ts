import { Component, input, output, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule }  from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RoleRef } from '../../models/user.models';

@Component({
  selector: 'app-role-selector',
  standalone: true,
  imports: [FormsModule, MatChipsModule, MatIconModule, MatButtonModule, MatCheckboxModule],
  template: `
    <div class="role-selector">
      <p class="role-selector__label">Assigned Roles</p>

      <div class="role-selector__list">
        @for (role of allRoles(); track role.id) {
          <div class="role-option"
            [class.role-option--selected]="isSelected(role.id)"
            (click)="toggle(role.id)">
            <mat-checkbox
              [checked]="isSelected(role.id)"
              (click)="$event.stopPropagation()"
              (change)="toggle(role.id)"
              [disabled]="readonly()">
            </mat-checkbox>
            <div class="role-option__info">
              <span class="role-option__name">{{ role.name }}</span>
              @if (role.description) {
                <span class="role-option__desc">{{ role.description }}</span>
              }
              @if (role.isSystem) {
                <span class="role-option__system">System</span>
              }
            </div>
          </div>
        }
      </div>

      @if (selectedIds().length === 0) {
        <p class="role-selector__empty">No roles assigned</p>
      }
    </div>
  `,
  styles: [`
    @use '../../../../../../styles/variables' as *;
    .role-selector__label { margin: 0 0 $spacing-sm; font-size: $font-size-sm; font-weight: 600; color: var(--text-secondary); }
    .role-selector__empty { font-size: $font-size-sm; color: var(--text-muted); }

    .role-selector__list { display: flex; flex-direction: column; gap: 2px; }

    .role-option {
      display: flex; align-items: center; gap: $spacing-sm;
      padding: $spacing-sm $spacing-md;
      border-radius: $radius-md;
      border: 1px solid var(--surface-border);
      cursor: pointer;
      transition: background $transition-fast, border-color $transition-fast;
      &:hover { background: var(--surface-hover); }
      &--selected { border-color: var(--color-primary); background: rgba(92,53,199,.06); }
    }

    .role-option__info { display: flex; flex-direction: column; min-width: 0; }
    .role-option__name { font-size: $font-size-sm; font-weight: 500; color: var(--text-primary); }
    .role-option__desc { font-size: 11px; color: var(--text-muted); }
    .role-option__system {
      display: inline-block; font-size: 10px; font-weight: 600;
      background: var(--status-info-bg); color: var(--status-info-text);
      padding: 1px 6px; border-radius: $radius-full; margin-top: 2px; width: fit-content;
    }
  `],
})
export class RoleSelectorComponent {
  readonly allRoles   = input<RoleRef[]>([]);
  readonly selectedIds = input<number[]>([]);
  readonly readonly   = input<boolean>(false);
  readonly changed    = output<number[]>();

  isSelected(id: number): boolean {
    return this.selectedIds().includes(id);
  }

  toggle(id: number): void {
    if (this.readonly()) return;
    const current = this.selectedIds();
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    this.changed.emit(next);
  }
}
