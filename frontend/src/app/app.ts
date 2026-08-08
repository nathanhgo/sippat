import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { HealthService } from './core/health.service';

type ConnectionStatus = 'checking' | 'ok' | 'error';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('SIPPAT');
  protected readonly connectionStatus = signal<ConnectionStatus>('checking');
  private readonly router = inject(Router);

  constructor(private readonly healthService: HealthService) {}

  isAuthPage(): boolean {
    return this.router.url === '/login' || this.router.url === '/register';
  }

  ngOnInit(): void {
    this.healthService.check().subscribe({
      next: () => this.connectionStatus.set('ok'),
      error: () => this.connectionStatus.set('error'),
    });
  }
}
