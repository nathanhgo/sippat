import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AttendancesService {
  constructor(private readonly http: HttpClient) {}

  create(attendance: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/attendances`, attendance);
  }

  findByCitizen(citizenId: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/attendances/citizen/${citizenId}`);
  }

  findAll(params?: { page?: number; limit?: number }): Observable<any> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    return this.http.get<any>(`${environment.apiUrl}/attendances?page=${page}&limit=${limit}`);
  }
}
