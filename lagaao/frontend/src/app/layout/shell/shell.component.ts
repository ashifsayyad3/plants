import { Component, inject } from '@angular/core';
import { RouterOutlet }      from '@angular/router';
import { NgClass }           from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SidebarComponent }    from '../sidebar/sidebar.component';
import { HeaderComponent }     from '../header/header.component';
import { FooterComponent }     from '../footer/footer.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { UiStore }             from '../../core/store/ui.store';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet, NgClass,
    MatProgressBarModule,
    SidebarComponent, HeaderComponent, FooterComponent, BreadcrumbComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl:    './shell.component.scss',
})
export class ShellComponent {
  readonly ui = inject(UiStore);
}
