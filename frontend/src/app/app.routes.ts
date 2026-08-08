import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { CitizenListComponent } from './features/citizens/citizen-list/citizen-list.component';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'citizens', component: CitizenListComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/citizens', pathMatch: 'full' },
  { path: '**', redirectTo: '/citizens' }
];
