import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterOutlet, Router, RouterModule } from '@angular/router';
import { HealthService } from './core/health.service';
import { AuthService } from './core/auth/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

type ConnectionStatus = 'checking' | 'ok' | 'error';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('SIPPAT');
  protected readonly connectionStatus = signal<ConnectionStatus>('checking');
  private readonly router = inject(Router);
  protected readonly authService = inject(AuthService);

  constructor(private readonly healthService: HealthService) {}

  isAuthPage(): boolean {
    return this.router.url === '/login' || this.router.url === '/register';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnInit(): void {
    this.healthService.check().subscribe({
      next: () => this.connectionStatus.set('ok'),
      error: () => this.connectionStatus.set('error'),
    });
  }
}
