import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { CitizenListComponent } from './features/citizens/citizen-list/citizen-list.component';
import { CitizenFormComponent } from './features/citizens/citizen-form/citizen-form.component';
import { AttendanceFormComponent } from './features/attendances/attendance-form/attendance-form.component';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'citizens', component: CitizenListComponent, canActivate: [authGuard] },
  { path: 'citizens/new', component: CitizenFormComponent, canActivate: [authGuard] },
  { path: 'citizens/edit/:id', component: CitizenFormComponent, canActivate: [authGuard] },
  { path: 'attendances/new', component: AttendanceFormComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/citizens', pathMatch: 'full' },
  { path: '**', redirectTo: '/citizens' }
];
