import { Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';

interface HealthData {
  status: string;
  app: string;
  environment: string;
  timestamp: string;
  database: string;
  uptime: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatCardModule, MatProgressSpinnerModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Welcome to Lagaao.com</mat-card-title>
        <mat-card-subtitle>System Status</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        @if (loading()) {
          <mat-spinner diameter="32" />
        } @else if (health()) {
          <p>API Status: <strong>{{ health()?.status }}</strong></p>
          <p>Database: <strong>{{ health()?.database }}</strong></p>
          <p>Environment: <strong>{{ health()?.environment }}</strong></p>
          <p>Uptime: <strong>{{ health()?.uptime }}s</strong></p>
        } @else {
          <p>Could not connect to backend.</p>
        }
      </mat-card-content>
    </mat-card>
  `,
})
export class HomeComponent implements OnInit {
  private readonly api = inject(ApiService);

  loading = signal(true);
  health = signal<HealthData | null>(null);

  ngOnInit(): void {
    this.api.get<HealthData>('/health').subscribe({
      next: (res) => {
        this.health.set(res.data ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
