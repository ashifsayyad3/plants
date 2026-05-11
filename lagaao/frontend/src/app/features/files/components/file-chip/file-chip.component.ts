import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FileRecord, fileIcon, formatBytes } from '../../models/file.models';

@Component({
  selector: 'app-file-chip',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule],
  template: `
    <div class="file-chip" [matTooltip]="file().originalName">
      <mat-icon class="file-chip__icon">{{ fileIcon(file().mimeType) }}</mat-icon>
      <span class="file-chip__name">{{ file().originalName }}</span>
      <span class="file-chip__size">{{ formatBytes(file().size) }}</span>
      @if (removable()) {
        <button class="file-chip__remove" type="button" (click)="removed.emit(file().uuid)" matTooltip="Remove">
          <mat-icon>close</mat-icon>
        </button>
      }
    </div>
  `,
  styles: [`
    @use '../../../../../../styles/variables' as *;

    .file-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 16px;
      border: 1px solid var(--surface-border);
      background: var(--surface-card);
      font-size: $font-size-sm;
      max-width: 220px;
      cursor: default;
      transition: background .15s;

      &:hover { background: var(--surface-hover); }
    }

    .file-chip__icon {
      font-size: 14px; width: 14px; height: 14px;
      color: var(--text-muted); flex-shrink: 0;
    }

    .file-chip__name {
      flex: 1; min-width: 0;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      color: var(--text-primary);
    }

    .file-chip__size {
      color: var(--text-muted);
      font-size: 11px;
      flex-shrink: 0;
    }

    .file-chip__remove {
      display: flex; align-items: center; justify-content: center;
      width: 16px; height: 16px;
      border: none; background: none; cursor: pointer; padding: 0;
      border-radius: 50%;
      color: var(--text-muted);
      flex-shrink: 0;
      transition: background .15s, color .15s;

      &:hover { background: var(--status-danger-bg); color: var(--status-danger-text); }

      mat-icon { font-size: 12px; width: 12px; height: 12px; }
    }
  `],
})
export class FileChipComponent {
  readonly file      = input.required<FileRecord>();
  readonly removable = input<boolean>(false);
  readonly removed   = output<string>();

  readonly fileIcon    = fileIcon;
  readonly formatBytes = formatBytes;
}
