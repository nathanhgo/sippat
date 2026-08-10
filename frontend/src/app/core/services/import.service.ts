import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImportService {
  constructor(private readonly http: HttpClient) {}

  upload(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${environment.apiUrl}/import/upload`, formData);
  }

  confirm(data: {
    citizens: any[];
    duplicateStrategy: 'overwrite_all' | 'ignore_all' | 'individual';
    decisions?: Record<string, 'overwrite' | 'ignore'>;
  }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/import/confirm`, data);
  }
}
