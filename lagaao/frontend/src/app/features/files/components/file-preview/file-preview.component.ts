import { Component, input, output, signal, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatIconModule }    from '@angular/material/icon';
import { MatButtonModule }  from '@angular/material/button';
import { MatDialogModule, MatDialog }  from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FileRecord, isImage, isPdf, fileIcon, formatBytes } from '../../models/file.models';
import { FileApiService }   from '../../services/file-api.service';
import { ConfirmDialogService } from '../../../../core/services/confirm-dialog.service';
import { ToastService }     from '../../../../core/services/toast.service';

@Component({
  selector: 'app-file-preview',
  standalone: true,
  imports: [NgClass, MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <div class="file-preview" [class.file-preview--grid]="layout() === 'grid'">

      @for (file of files(); track file.uuid) {
        <div class="fp-card">

          <!-- Thumbnail -->
          <div class="fp-card__thumb" (click)="openPreview(file)">
            @if (isImage(file.mimeType) && (file.thumbUrl || file.url)) {
              <img [src]="file.thumbUrl ?? file.url" [alt]="file.originalName" class="fp-card__img" loading="lazy" />
            } @else {
              <div class="fp-card__icon-wrap">
                <mat-icon class="fp-card__icon">{{ fileIcon(file.mimeType) }}</mat-icon>
              </div>
            }
          </div>

          <!-- Info -->
          <div class="fp-card__info">
            <span class="fp-card__name" [matTooltip]="file.originalName">{{ file.originalName }}</span>
            <span class="fp-card__meta">{{ formatBytes(file.size) }}</span>
          </div>

          <!-- Actions -->
          <div class="fp-card__actions">
            <a mat-icon-button [href]="api.downloadUrl(file)" target="_blank"
              matTooltip="Download" download>
              <mat-icon>download</mat-icon>
            </a>
            @if (deletable()) {
              <button mat-icon-button color="warn" matTooltip="Delete" (click)="onDelete(file)">
                <mat-icon>delete</mat-icon>
              </button>
            }
          </div>

        </div>
      }

      @if (files().length === 0) {
        <p class="fp-empty">No files attached.</p>
      }

    </div>

    <!-- Lightbox overlay -->
    @if (lightboxFile()) {
      <div class="lightbox" (click)="closeLightbox()">
        <button class="lightbox__close" mat-icon-button (click)="closeLightbox()">
          <mat-icon>close</mat-icon>
        </button>
        @if (isImage(lightboxFile()!.mimeType)) {
          <img [src]="lightboxFile()!.url" [alt]="lightboxFile()!.originalName" class="lightbox__img" (click)="$event.stopPropagation()" />
        } @else {
          <div class="lightbox__doc" (click)="$event.stopPropagation()">
            <mat-icon style="font-size:64px;width:64px;height:64px;color:#fff">{{ fileIcon(lightboxFile()!.mimeType) }}</mat-icon>
            <p style="color:#fff;margin:16px 0 0">{{ lightboxFile()!.originalName }}</p>
            <a mat-flat-button color="primary" [href]="lightboxFile()!.url" target="_blank" download style="margin-top:16px">
              <mat-icon>download</mat-icon> Download
            </a>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    @use '../../../../../../styles/variables' as *;

    .file-preview { display: flex; flex-direction: column; gap: $spacing-sm; }
    .file-preview--grid { flex-direction: row; flex-wrap: wrap; gap: $spacing-md; }

    .fp-card {
      display: flex; align-items: center; gap: $spacing-sm;
      border: 1px solid var(--surface-border);
      border-radius: $radius-md;
      padding: $spacing-sm;
      background: var(--surface-card);
      &:hover { background: var(--surface-hover); }

      .file-preview--grid & {
        flex-direction: column;
        width: 130px;
        align-items: flex-start;
      }
    }

    .fp-card__thumb {
      width: 48px; height: 48px; border-radius: $radius-sm; overflow: hidden;
      flex-shrink: 0; cursor: pointer;
      background: var(--surface-hover);
      display: flex; align-items: center; justify-content: center;
      .file-preview--grid & { width: 100%; height: 80px; }
    }
    .fp-card__img  { width: 100%; height: 100%; object-fit: cover; }
    .fp-card__icon-wrap { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
    .fp-card__icon { font-size: 26px; width: 26px; height: 26px; color: var(--text-muted); }

    .fp-card__info { flex: 1; min-width: 0; }
    .fp-card__name {
      font-size: $font-size-sm; font-weight: 500; color: var(--text-primary);
      display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .fp-card__meta { font-size: 11px; color: var(--text-muted); }
    .fp-card__actions { display: flex; gap: 0; flex-shrink: 0; }
    .fp-empty { color: var(--text-muted); font-size: $font-size-sm; }

    // Lightbox
    .lightbox {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(0,0,0,0.88);
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn .15s ease;
    }
    @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
    .lightbox__close { position: absolute; top: 16px; right: 16px; color: #fff; }
    .lightbox__img { max-width: 90vw; max-height: 88vh; border-radius: 4px; box-shadow: 0 8px 32px rgba(0,0,0,.5); }
    .lightbox__doc { display: flex; flex-direction: column; align-items: center; text-align: center; }
  `],
})
export class FilePreviewComponent {
  readonly files     = input<FileRecord[]>([]);
  readonly layout    = input<'list' | 'grid'>('list');
  readonly deletable = input<boolean>(false);
  readonly deleted   = output<string>();

  readonly lightboxFile = signal<FileRecord | null>(null);

  readonly api     = inject(FileApiService);
  private readonly confirm = inject(ConfirmDialogService);
  private readonly toast   = inject(ToastService);

  readonly isImage    = isImage;
  readonly fileIcon   = fileIcon;
  readonly formatBytes = formatBytes;

  openPreview(file: FileRecord): void {
    this.lightboxFile.set(file);
  }

  closeLightbox(): void {
    this.lightboxFile.set(null);
  }

  onDelete(file: FileRecord): void {
    this.confirm.danger('Delete File', `Delete "${file.originalName}"?`).subscribe((ok) => {
      if (!ok) return;
      this.api.deleteFile(file.uuid).subscribe({
        next: () => { this.deleted.emit(file.uuid); this.toast.success('File deleted'); },
        error: () => this.toast.error('Failed to delete file'),
      });
    });
  }
}
