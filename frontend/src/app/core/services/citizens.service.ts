import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CitizensService {
  constructor(private readonly http: HttpClient) {}

  findAll(params?: {
    search?: string;
    neighborhood?: string;
    educationLevel?: string;
    isPcd?: boolean;
    minIncome?: number;
    maxIncome?: number;
    page?: number;
    limit?: number;
  }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params?.neighborhood) {
      httpParams = httpParams.set('neighborhood', params.neighborhood);
    }
    if (params?.educationLevel) {
      httpParams = httpParams.set('educationLevel', params.educationLevel);
    }
    if (params?.isPcd !== undefined) {
      httpParams = httpParams.set('isPcd', params.isPcd.toString());
    }
    if (params?.minIncome !== undefined) {
      httpParams = httpParams.set('minIncome', params.minIncome.toString());
    }
    if (params?.maxIncome !== undefined) {
      httpParams = httpParams.set('maxIncome', params.maxIncome.toString());
    }
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    return this.http.get<any>(`${environment.apiUrl}/citizens`, { params: httpParams });
  }

  findOne(id: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/citizens/${id}`);
  }

  create(citizen: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/citizens`, citizen);
  }

  update(id: string, citizen: any): Observable<any> {
    return this.http.patch<any>(`${environment.apiUrl}/citizens/${id}`, citizen);
  }

  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/citizens/${id}`);
  }
}
