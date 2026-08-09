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

  findAll(params?: {
    page?: number;
    limit?: number;
    serviceType?: string;
    citizenName?: string;
    attendantName?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Observable<any> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const queryParams = new URLSearchParams();
    queryParams.set('page', String(page));
    queryParams.set('limit', String(limit));
    if (params?.serviceType) queryParams.set('serviceType', params.serviceType);
    if (params?.citizenName) queryParams.set('citizenName', params.citizenName);
    if (params?.attendantName) queryParams.set('attendantName', params.attendantName);
    if (params?.dateFrom) queryParams.set('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.set('dateTo', params.dateTo);
    return this.http.get<any>(`${environment.apiUrl}/attendances?${queryParams.toString()}`);
  }
}
