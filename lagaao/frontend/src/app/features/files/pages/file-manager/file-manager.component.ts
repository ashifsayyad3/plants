import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FileApiService } from '../../services/file-api.service';
import { FileRecord } from '../../models/file.models';
import { FilePreviewComponent } from '../../components/file-preview/file-preview.component';
import { UploadZoneComponent } from '../../components/upload-zone/upload-zone.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ToastService } from '../../../../core/services/toast.service';

type Layout = 'list' | 'grid';

@Component({
  selector: 'app-file-manager',
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule, MatButtonModule, MatSelectModule,
    MatFormFieldModule, MatTooltipModule, MatProgressSpinnerModule,
    FilePreviewComponent, UploadZoneComponent, PageHeaderComponent,
  ],
  templateUrl: './file-manager.component.html',
  styleUrl: './file-manager.component.scss',
})
export class FileManagerComponent implements OnInit {
  private readonly api   = inject(FileApiService);
  private readonly toast = inject(ToastService);

  readonly loading    = signal(false);
  readonly files      = signal<FileRecord[]>([]);
  readonly layout     = signal<Layout>('grid');
  readonly collection = signal<string>('');
  readonly showUpload = signal(false);

  get collectionValue(): string { return this.collection(); }
  set collectionValue(v: string) { this.collection.set(v); }

  readonly collections = signal<{ key: string; label: string }[]>([]);

  readonly filteredFiles = computed(() => {
    const col = this.collection();
    return col ? this.files().filter(f => f.collection === col) : this.files();
  });

  ngOnInit(): void {
    this.loadCollections();
    this.loadFiles();
  }

  private loadCollections(): void {
    this.api.getCollections().subscribe({
      next: (cols) => {
        this.collections.set([
          { key: '', label: 'All Collections' },
          ...cols.map(c => ({ key: c.key, label: c.key.replace(/_/g, ' ') })),
        ]);
      },
    });
  }

  loadFiles(): void {
    this.loading.set(true);
    this.api.listMyFiles().subscribe({
      next: (res) => { this.files.set(res.rows); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load files'); this.loading.set(false); },
    });
  }

  onFileDeleted(uuid: string): void {
    this.files.update(list => list.filter(f => f.uuid !== uuid));
  }

  onUploaded(records: FileRecord[]): void {
    this.files.update(list => [...records, ...list]);
    this.showUpload.set(false);
    this.toast.success(`${records.length} file(s) uploaded`);
  }

  toggleUpload(): void {
    this.showUpload.update(v => !v);
  }

  toggleLayout(): void {
    this.layout.update(l => l === 'grid' ? 'list' : 'grid');
  }
}
