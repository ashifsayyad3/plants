import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule }            from '@angular/forms';
import { MatIconModule }          from '@angular/material/icon';
import { MatButtonModule }        from '@angular/material/button';
import { MatSelectModule }        from '@angular/material/select';
import { MatFormFieldModule }     from '@angular/material/form-field';
import { MatTooltipModule }       from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule }         from '@angular/material/chips';
import { MatCheckboxModule }      from '@angular/material/checkbox';
import { DatePipe }               from '@angular/common';
import { NotificationStore }      from '../../store/notification.store';
import { PageHeaderComponent }    from '../../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent }   from '../../../../shared/components/status-badge/status-badge.component';
import { notifIcon, notifVariant, NotificationRecord } from '../../models/notification.models';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [
    FormsModule, DatePipe,
    MatIconModule, MatButtonModule, MatSelectModule,
    MatFormFieldModule, MatTooltipModule, MatProgressSpinnerModule,
    MatChipsModule, MatCheckboxModule,
    PageHeaderComponent, StatusBadgeComponent,
  ],
  templateUrl: './notification-center.component.html',
  styleUrl: './notification-center.component.scss',
})
export class NotificationCenterComponent implements OnInit {
  readonly store = inject(NotificationStore);

  readonly notifIcon    = notifIcon;
  readonly notifVariant = notifVariant;

  unreadOnly = false;
  channel    = '';
  selected   = new Set<string>();

  readonly channels = [
    { value: '',        label: 'All Channels' },
    { value: 'in_app',  label: 'In-App' },
    { value: 'email',   label: 'Email' },
    { value: 'sms',     label: 'SMS' },
    { value: 'push',    label: 'Push' },
  ];

  ngOnInit(): void {
    this.load();
  }

  load(page = 1): void {
    this.store.load({
      page,
      unreadOnly: this.unreadOnly || undefined,
      channel:    this.channel   || undefined,
    });
    this.selected.clear();
  }

  toggleSelect(uuid: string, checked: boolean): void {
    checked ? this.selected.add(uuid) : this.selected.delete(uuid);
  }

  get allSelected(): boolean {
    return this.store.items().length > 0 &&
      this.store.items().every((n) => this.selected.has(n.uuid));
  }

  toggleAll(checked: boolean): void {
    this.store.items().forEach((n) => checked ? this.selected.add(n.uuid) : this.selected.delete(n.uuid));
  }

  markSelectedRead(): void {
    if (!this.selected.size) return;
    [...this.selected].forEach((uuid) => this.store.markRead(uuid));
    this.selected.clear();
  }

  deleteSelected(): void {
    [...this.selected].forEach((uuid) => this.store.delete(uuid));
    this.selected.clear();
  }
}
