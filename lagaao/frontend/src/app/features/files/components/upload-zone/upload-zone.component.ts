import {
  Component, input, output, signal, computed,
  HostListener, ElementRef, inject, OnDestroy,
} from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { MatIconModule }     from '@angular/material/icon';
import { MatButtonModule }   from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule }  from '@angular/material/tooltip';
import { v4 as uuidv4 }     from 'uuid';
import { Subscription }      from 'rxjs';

import { FileApiService }    from '../../services/file-api.service';
import { ToastService }      from '../../../../core/services/toast.service';
import {
  UploadItem, UploadStatus, UploadCollection,
  isImage, fileIcon, formatBytes,
} from '../../models/file.models';
import { FileRecord } from '../../models/file.models';

const COLLECTION_MIME: Record<string, string> = {
  avatar:        'image/jpeg,image/png,image/webp',
  listing_image: 'image/jpeg,image/png,image/webp,image/gif',
  document:      'application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv',
  general:       'image/*,application/pdf,text/plain,text/csv',
};

@Component({
  selector: 'app-upload-zone',
  standalone: true,
  imports: [NgClass, NgStyle, MatIconModule, MatButtonModule, MatProgressBarModule, MatTooltipModule],
  templateUrl: './upload-zone.component.html',
  styleUrl:    './upload-zone.component.scss',
})
export class UploadZoneComponent implements OnDestroy {
  // ── Inputs ──────────────────────────────────────────────────────────────────
  readonly collection  = input<UploadCollection>('general');
  readonly multiple    = input<boolean>(true);
  readonly maxSizeMb   = input<number>(8);
  readonly maxCount    = input<number>(10);
  readonly modelType   = input<string | undefined>(undefined);
  readonly modelId     = input<number | undefined>(undefined);
  readonly isPublic    = input<boolean>(false);
  readonly label       = input<string>('Drop files here or click to upload');
  readonly compact     = input<boolean>(false);   // smaller variant
  readonly disabled    = input<boolean>(false);

  // ── Outputs ─────────────────────────────────────────────────────────────────
  readonly uploaded    = output<FileRecord[]>();   // emitted after each successful upload
  readonly removed     = output<string>();          // emitted with uuid of removed record

  // ── State ────────────────────────────────────────────────────────────────────
  readonly items       = signal<UploadItem[]>([]);
  readonly isDragging  = signal(false);

  readonly pendingCount   = computed(() => this.items().filter((i) => i.status === 'pending').length);
  readonly uploadingCount = computed(() => this.items().filter((i) => i.status === 'uploading').length);
  readonly doneCount      = computed(() => this.items().filter((i) => i.status === 'done').length);
  readonly errorCount     = computed(() => this.items().filter((i) => i.status === 'error').length);
  readonly totalCount     = computed(() => this.items().length);
  readonly isUploading    = computed(() => this.uploadingCount() > 0);
  readonly acceptAttr     = computed(() => COLLECTION_MIME[this.collection()] ?? '*/*');

  private readonly subs: Subscription[] = [];
  private readonly api   = inject(FileApiService);
  private readonly toast = inject(ToastService);

  // ── Drag & drop host listeners ───────────────────────────────────────────────

  @HostListener('dragover', ['$event'])
  onDragOver(e: DragEvent): void {
    if (this.disabled()) return;
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(true);
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(false);
  }

  @HostListener('drop', ['$event'])
  onDrop(e: DragEvent): void {
    if (this.disabled()) return;
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(false);
    const files = Array.from(e.dataTransfer?.files ?? []);
    this.addFiles(files);
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';           // reset so same file can be re-selected
    this.addFiles(files);
  }

  removeItem(id: string): void {
    const item = this.items().find((i) => i.id === id);
    if (!item) return;

    if (item.preview) URL.revokeObjectURL(item.preview);
    if (item.record)  this.removed.emit(item.record.uuid);

    this.items.update((list) => list.filter((i) => i.id !== id));
  }

  retryItem(id: string): void {
    const item = this.items().find((i) => i.id === id);
    if (!item || item.status !== 'error') return;
    this.uploadItem(item);
  }

  clearAll(): void {
    this.items().forEach((i) => { if (i.preview) URL.revokeObjectURL(i.preview); });
    this.items.set([]);
  }

  // ── Private ──────────────────────────────────────────────────────────────────

  private addFiles(files: File[]): void {
    if (this.disabled()) return;

    const maxMb    = this.maxSizeMb() * 1024 * 1024;
    const maxCount = this.maxCount();

    const filtered = files.filter((f) => {
      if (f.size > maxMb) {
        this.toast.error(`"${f.name}" exceeds ${this.maxSizeMb()} MB limit`);
        return false;
      }
      return true;
    });

    const current  = this.items().length;
    const allowed  = Math.max(0, maxCount - current);
    const batch    = this.multiple() ? filtered.slice(0, allowed) : filtered.slice(0, 1);

    if (batch.length < filtered.length) {
      this.toast.warning(`Only ${maxCount} files allowed. Extra files were ignored.`);
    }

    const newItems: UploadItem[] = batch.map((f) => ({
      id:       uuidv4(),
      file:     f,
      status:   'pending' as UploadStatus,
      progress: 0,
      preview:  isImage(f.type) ? URL.createObjectURL(f) : undefined,
    }));

    this.items.update((list) => [...list, ...newItems]);

    // Auto-upload
    newItems.forEach((item) => this.uploadItem(item));
  }

  private uploadItem(item: UploadItem): void {
    this.patchItem(item.id, { status: 'uploading', progress: 0, error: undefined });

    const sub = this.api.uploadSingle(item.file, this.collection(), {
      modelType: this.modelType(),
      modelId:   this.modelId(),
      isPublic:  this.isPublic(),
    }).subscribe({
      next: (evt) => {
        this.patchItem(item.id, { progress: evt.progress });
        if (evt.done && evt.record) {
          this.patchItem(item.id, { status: 'done', progress: 100, record: evt.record });
          this.uploaded.emit([evt.record]);
        }
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Upload failed';
        this.patchItem(item.id, { status: 'error', error: msg });
        this.toast.error(`Failed to upload "${item.file.name}": ${msg}`);
      },
    });

    this.subs.push(sub);
  }

  private patchItem(id: string, patch: Partial<UploadItem>): void {
    this.items.update((list) =>
      list.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.items().forEach((i) => { if (i.preview) URL.revokeObjectURL(i.preview); });
  }

  // ── Template helpers (exposed for template) ───────────────────────────────────
  readonly isImage    = isImage;
  readonly fileIcon   = fileIcon;
  readonly formatBytes = formatBytes;
}
