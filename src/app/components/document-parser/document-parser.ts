import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';

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
    MatCardModule
  ]
})
export class DocumentParserComponent {
  formVisible = false;
  parserForm: FormGroup;
  selectedFile: File | null = null;

  constructor(private fb: FormBuilder) {
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

    console.log('Parsing document:', this.selectedFile.name);

    this.parserForm.patchValue({
      employeeName: 'Marko Markovic',
      securityOrg: 'Security Agency',
      affectedOrg: 'Affected Organization',
      incidentSeverity: 'Medium',
      affectedAddress: 'Belgrade, Serbia'
    });

    this.formVisible = true;
  }

  submitForm() {
    console.log('Form submitted', this.parserForm.value);
    alert('Indexing confirmed!');
    this.formVisible = false;
    this.selectedFile = null;
  }

  cancelForm() {
    this.formVisible = false;
    this.selectedFile = null;
  }

  logout() {
    console.log('Logout clicked');
    // TODO: implement logout
  }
}
