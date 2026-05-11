import { Component, input, output, signal, inject } from '@angular/core';
import { MatIconModule }   from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AvatarComponent } from '../../../../shared/components/avatar/avatar.component';
import { UserApiService }  from '../../services/user-api.service';
import { ToastService }    from '../../../../core/services/toast.service';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatTooltipModule, AvatarComponent],
  template: `
    <div class="avatar-wrap">
      <app-avatar [src]="avatarUrl()" [name]="name()" [size]="size()" />

      @if (editable()) {
        <label class="avatar-upload-btn" matTooltip="Change avatar">
          <mat-icon>photo_camera</mat-icon>
          <input type="file" accept="image/jpeg,image/png,image/webp"
            (change)="onFileSelected($event)" hidden />
        </label>
      }
    </div>

    @if (uploading()) {
      <span class="avatar-uploading">Uploading…</span>
    }
  `,
  styles: [`
    @use '../../../../../../styles/variables' as *;
    .avatar-wrap { position: relative; display: inline-block; }
    .avatar-upload-btn {
      position: absolute; bottom: 0; right: 0;
      width: 28px; height: 28px; border-radius: 50%;
      background: var(--color-primary); color: #fff;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; box-shadow: $shadow-sm;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover { background: var(--color-primary-dark); }
    }
    .avatar-uploading { font-size: $font-size-sm; color: var(--text-muted); display: block; margin-top: 4px; }
  `],
})
export class UserAvatarComponent {
  readonly uuid      = input.required<string>();
  readonly name      = input<string>('User');
  readonly avatarUrl = input<string | null>(null);
  readonly size      = input<number>(72);
  readonly editable  = input<boolean>(false);
  readonly updated   = output<string>();

  readonly uploading = signal(false);

  private readonly api   = inject(UserApiService);
  private readonly toast = inject(ToastService);

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      this.toast.error('Image must be under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.uploading.set(true);
      // In production this would upload to storage and return a URL.
      // Here we send the data URL directly for simplicity.
      this.api.updateAvatar(this.uuid(), dataUrl).subscribe({
        next: (user) => {
          this.uploading.set(false);
          this.updated.emit(user.meta?.avatarUrl ?? '');
          this.toast.success('Avatar updated');
        },
        error: () => {
          this.uploading.set(false);
          this.toast.error('Avatar upload failed');
        },
      });
    };
    reader.readAsDataURL(file);
  }
}
