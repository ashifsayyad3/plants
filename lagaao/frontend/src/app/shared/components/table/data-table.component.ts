import {
  Component, Input, Output, EventEmitter, computed, signal, ChangeDetectionStrategy,
} from '@angular/core';
import { NgClass }               from '@angular/common';
import { MatTableModule }        from '@angular/material/table';
import { MatSortModule, Sort }   from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCheckboxModule }     from '@angular/material/checkbox';
import { MatMenuModule }         from '@angular/material/menu';
import { MatButtonModule }       from '@angular/material/button';
import { MatIconModule }         from '@angular/material/icon';
import { MatTooltipModule }      from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SelectionModel }        from '@angular/cdk/collections';
import { TableColumn, PageMeta } from '../../../core/models/ui.models';
import { StatusBadgeComponent }  from '../status-badge/status-badge.component';
import { EmptyStateComponent }   from '../empty-state/empty-state.component';

export interface RowAction<T> {
  label:     string;
  icon:      string;
  color?:    'primary' | 'warn' | 'accent';
  action:    (row: T) => void;
  hidden?:   (row: T) => boolean;
  disabled?: (row: T) => boolean;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass, MatTableModule, MatSortModule, MatPaginatorModule,
    MatCheckboxModule, MatMenuModule, MatButtonModule, MatIconModule,
    MatTooltipModule, MatProgressSpinnerModule,
    StatusBadgeComponent, EmptyStateComponent,
  ],
  templateUrl: './data-table.component.html',
  styleUrl:    './data-table.component.scss',
})
export class DataTableComponent<T extends Record<string, unknown>> {
  @Input({ required: true }) columns:  TableColumn<T>[] = [];
  @Input({ required: true }) rows:     T[] = [];
  @Input() meta:      PageMeta | null  = null;
  @Input() loading    = false;
  @Input() selectable = false;
  @Input() actions:   RowAction<T>[]   = [];
  @Input() emptyIcon    = 'inbox';
  @Input() emptyTitle   = 'No records found';
  @Input() emptyMessage = 'Try adjusting your filters or search term.';

  @Output() sortChange   = new EventEmitter<Sort>();
  @Output() pageChange   = new EventEmitter<PageEvent>();
  @Output() rowClick     = new EventEmitter<T>();
  @Output() selectionChange = new EventEmitter<T[]>();

  readonly selection = new SelectionModel<T>(true, []);

  readonly displayedColumns = computed(() => {
    const cols = this.columns.map((c) => c.key);
    if (this.selectable)     cols.unshift('__select');
    if (this.actions.length) cols.push('__actions');
    return cols;
  });

  readonly pageSize   = signal(20);
  readonly pageIndex  = signal(0);

  isAllSelected(): boolean {
    return this.selection.selected.length === this.rows.length;
  }

  toggleAll(): void {
    this.isAllSelected() ? this.selection.clear() : this.selection.select(...this.rows);
    this.selectionChange.emit(this.selection.selected);
  }

  toggleRow(row: T): void {
    this.selection.toggle(row);
    this.selectionChange.emit(this.selection.selected);
  }

  onSort(sort: Sort): void {
    this.sortChange.emit(sort);
  }

  onPage(event: PageEvent): void {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
    this.pageChange.emit(event);
  }

  getCellValue(row: T, col: TableColumn<T>): unknown {
    if (col.format) return col.format(row[col.key], row);
    return row[col.key];
  }

  visibleActions(row: T): RowAction<T>[] {
    return this.actions.filter((a) => !a.hidden?.(row));
  }

  trackById(_: number, row: T): unknown {
    return (row as { id?: unknown }).id ?? row;
  }
}
