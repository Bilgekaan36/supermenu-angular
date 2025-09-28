import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PageLayoutComponent } from './components/layout/page-layout.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PageLayoutComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('supermenu-angular');
}
