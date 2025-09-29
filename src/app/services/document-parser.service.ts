import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SecurityIncidentReportResponse } from '../models/SecurityIncidentReportResponse';

@Injectable({ providedIn: 'root' })
export class DocumentParserService {
  private baseUrl = 'http://localhost:8080/api/v1/security-incident-report';

  constructor(private http: HttpClient) {}

  parseDocument(file: File): Observable<SecurityIncidentReportResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<SecurityIncidentReportResponse>(`${this.baseUrl}/parse`, formData);
  }
}