import { Injectable, inject } from '@angular/core';
import {
  HttpClient, HttpParams, HttpRequest,
  HttpEventType, HttpResponse,
} from '@angular/common/http';
import { Observable, map, filter } from 'rxjs';
import { environment }    from '../../../../environments/environment';
import { ApiService }     from '../../../core/services/api.service';
import { FileRecord, CollectionInfo, UploadCollection } from '../models/file.models';

export interface UploadProgress {
  progress: number;          // 0–100
  done:     boolean;
  record?:  FileRecord;
  error?:   string;
}

@Injectable({ providedIn: 'root' })
export class FileApiService {
  private readonly http    = inject(HttpClient);
  private readonly api     = inject(ApiService);
  private readonly baseUrl = `${environment.apiUrl}/files`;

  // ─── Upload single file with progress ─────────────────────────────────────

  uploadSingle(
    file:        File,
    collection:  UploadCollection = 'general',
    opts: { modelType?: string; modelId?: number; isPublic?: boolean } = {},
  ): Observable<UploadProgress> {
    const form = new FormData();
    form.append('file', file, file.name);

    let params = new HttpParams().set('collection', collection);
    if (opts.modelType) params = params.set('modelType', opts.modelType);
    if (opts.modelId)   params = params.set('modelId', String(opts.modelId));
    if (opts.isPublic)  params = params.set('isPublic', 'true');

    const req = new HttpRequest('POST', `${this.baseUrl}/upload`, form, {
      params,
      reportProgress: true,
    });

    return this.http.request<{ data: FileRecord }>(req).pipe(
      map((event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = event.total
            ? Math.round((event.loaded / event.total) * 95)   // cap at 95% until response
            : 0;
          return { progress, done: false };
        }
        if (event instanceof HttpResponse) {
          return { progress: 100, done: true, record: event.body?.data };
        }
        return { progress: 0, done: false };
      }),
    );
  }

  // ─── Upload multiple files ─────────────────────────────────────────────────

  uploadMultiple(
    files:       File[],
    collection:  UploadCollection = 'general',
    opts: { modelType?: string; modelId?: number; isPublic?: boolean } = {},
  ): Observable<UploadProgress> {
    const form = new FormData();
    files.forEach((f) => form.append('files', f, f.name));

    let params = new HttpParams().set('collection', collection);
    if (opts.modelType) params = params.set('modelType', opts.modelType);
    if (opts.modelId)   params = params.set('modelId', String(opts.modelId));
    if (opts.isPublic)  params = params.set('isPublic', 'true');

    const req = new HttpRequest('POST', `${this.baseUrl}/upload/multiple`, form, {
      params,
      reportProgress: true,
    });

    return this.http.request<{ data: FileRecord[] }>(req).pipe(
      map((event) => {
        if (event.type === HttpEventType.UploadProgress) {
          return { progress: Math.round((event.loaded / (event.total ?? 1)) * 95), done: false };
        }
        if (event instanceof HttpResponse) {
          return { progress: 100, done: true };
        }
        return { progress: 0, done: false };
      }),
    );
  }

  // ─── Metadata ─────────────────────────────────────────────────────────────

  getFile(uuid: string): Observable<FileRecord> {
    return this.api.get<FileRecord>(`/files/${uuid}`).pipe(map((r) => r.data!));
  }

  listByModel(modelType: string, modelId: number, collection?: string): Observable<FileRecord[]> {
    let params: Record<string, string | number> = { modelType, modelId };
    if (collection) params['collection'] = collection;
    return this.api.get<FileRecord[]>('/files/by-model', params).pipe(map((r) => r.data ?? []));
  }

  listMyFiles(page = 1, limit = 20): Observable<{ rows: FileRecord[]; total: number }> {
    return this.api.get<{ rows: FileRecord[]; total: number }>('/files/my', { page, limit }).pipe(map((r) => r.data!));
  }

  getCollections(): Observable<CollectionInfo[]> {
    return this.api.get<CollectionInfo[]>('/files/collections').pipe(map((r) => r.data ?? []));
  }

  attachToModel(uuid: string, modelType: string, modelId: number): Observable<FileRecord> {
    return this.api.patch<FileRecord>(`/files/${uuid}/attach`, { modelType, modelId }).pipe(map((r) => r.data!));
  }

  deleteFile(uuid: string): Observable<void> {
    return this.api.delete<void>(`/files/${uuid}`).pipe(map(() => void 0));
  }

  // ─── Build download URL (adds auth bypass for public files) ───────────────

  downloadUrl(file: FileRecord): string {
    if (file.isPublic) return file.url;
    return `${environment.apiUrl}/files/${file.uuid}/download`;
  }
}
