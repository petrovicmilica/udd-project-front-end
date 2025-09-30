import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { DocumentParserService } from '../../services/document-parser.service';
import { SecurityIncidentReportResponse } from '../../models/SecurityIncidentReportResponse';
import { HttpClientModule } from '@angular/common/http';
import { SecurityIncidentReportRequest } from '../../models/SecurityIncidentReportRequest';

@Component({
  selector: 'app-document-parser',
  standalone: true,
  templateUrl: './document-parser.html',
  styleUrls: ['./document-parser.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    HttpClientModule
  ]
})
export class DocumentParserComponent {
  formVisible = false;
  parserForm: FormGroup;
  selectedFile: File | null = null;
  parsedReport: SecurityIncidentReportResponse | null = null;

  constructor(private fb: FormBuilder, private parserService: DocumentParserService) {
    this.parserForm = this.fb.group({
      employeeName: [''],
      securityOrg: [''],
      affectedOrg: [''],
      incidentSeverity: [''],
      affectedAddress: ['']
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  parseDocument() {
    if (!this.selectedFile) return;

    this.parserService.parseDocument(this.selectedFile).subscribe({
      next: (report) => {
        this.parsedReport = report;
        this.formVisible = true; 
        this.parserForm.patchValue({
          employeeName: report.employeeName,
          securityOrg: report.securityOrganizationName,
          affectedOrg: report.affectedOrganizationName,
          incidentSeverity: report.severityLevel,
          affectedAddress: report.affectedOrganizationAddress
        });
      },
      error: (err) => {
        console.error('Failed to parse document', err);
        alert('Failed to parse document.');
      }
    });
  }

  submitForm() {
  if (!this.selectedFile) return;

  const request: SecurityIncidentReportRequest = {
    employeeName: this.parserForm.value.employeeName || 'Nepoznato',
    securityOrganizationName: this.parserForm.value.securityOrg || 'Nepoznato',
    affectedOrganizationName: this.parserForm.value.affectedOrg || 'Nepoznato',
    severityLevel: this.parserForm.value.incidentSeverity || 'LOW',
    affectedOrganizationAddress: this.parserForm.value.affectedAddress || 'Nepoznato',
    reportContent: this.parsedReport?.reportContent || ''
  };

  this.parserService.uploadDocument(this.selectedFile, request).subscribe({
    next: (response) => {
      console.log('Upload confirmed', response);
      alert('Upload confirmed!');
      this.formVisible = false;
      this.selectedFile = null;
      this.parsedReport = null;
    },
    error: (err) => {
      console.error('Failed to upload document', err);
      alert('Failed to upload document.');
    }
  });
}

  cancelForm() {
    this.formVisible = false;
    this.selectedFile = null;
    this.parsedReport = null;
  }

  logout() {
    console.log('Logout clicked');
    // TODO: implement logout
  }
}
