import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { SecurityIncidentReportResponse } from '../../models/SecurityIncidentReportResponse';
import { SecurityIncidentReportService } from '../../services/security-incident-report.service';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { getKeycloak } from '../../auth/keycloak.init';
import { DocumentSearchRequest } from '../../models/DocumentSearchRequest';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-search-documents',
  standalone: true,
  templateUrl: './search-documents.html',
  styleUrls: ['./search-documents.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule, 
    SafeHtmlPipe,
    MatCheckboxModule
  ]
})
export class SearchDocumentsComponent{
  searchForm: FormGroup;
  results: SecurityIncidentReportResponse[] = [];
  hasSearched: boolean = false;
  searchType: string = '';

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private reportService: SecurityIncidentReportService
  ) {
    this.searchForm = this.fb.group({
      keywords: [''],
      geoSearch: [false],  
      radius: ['']
    });
  }

  onSearch() {
  this.hasSearched = true;

  const keywordsInput: string = this.searchForm.value.keywords.trim();
  const geoEnabled: boolean = this.searchForm.value.geoSearch;
  const radius: number = geoEnabled ? Number(this.searchForm.value.radius) : 0;

  if (!keywordsInput) {
    this.results = [];
    return;
  }

  let searchRequest: DocumentSearchRequest;

  if (geoEnabled) {
    // Ako je geolocation search aktivan
    searchRequest = {
      searchKeywords: [keywordsInput],  // ubaci ceo input kao jedan string
      booleanQuery: '',
      radius: radius
    };
    this.searchType = 'geolocation';
  } else {
    // Standardna pretraga: boolean ili simple
    const booleanOrPhraseRegex = /\b(AND|OR|NOT)\b|".+?"/i;

    if (booleanOrPhraseRegex.test(keywordsInput)) {
      searchRequest = {
        searchKeywords: [],
        booleanQuery: keywordsInput,
        radius: 0
      };
      this.searchType = 'boolean';
    } else {
      const keywords = keywordsInput.split(' ').filter(k => k.trim() !== '');
      searchRequest = {
        searchKeywords: keywords,
        booleanQuery: '',
        radius: 0
      };
      this.searchType = 'simple';
    }
  }

  console.log('Search request:', searchRequest, 'Type:', this.searchType);

  this.reportService.searchDocuments(searchRequest, this.searchType).subscribe({
    next: (data) => {
      console.log('Search results:', data);
      this.results = data;
    },
    error: (err) => {
      console.error('Search error:', err);
    }
  });
}


  onClear() {
    this.searchForm.reset();
    this.results = [];
    this.hasSearched = false;
  }

  toggleExpanded(result: any) {
    result.expanded = !result.expanded;
  }

  getSnippet(content: string, expanded: boolean): string {
    if (!content) return '';
    return expanded ? content : content.substring(0, 200) + (content.length > 200 ? '...' : '');
  }

   private dynamicSnippetsSafe(html: string | null | undefined, radius = 60, maxChunks = 2): string[] {
    const src = html ?? '';
    if (!src) return [];

    const OPEN = '[[[HL_OPEN]]]';
    const CLOSE = '[[[HL_CLOSE]]]';

    let s = src
      .replace(/<em\s+class=["']highlight["']>/g, OPEN)
      .replace(/<\/em>/g, CLOSE);

    s = s.replace(/<(?:.|\n)*?>/g, ' ');
    s = s.replace(/\s+/g, ' ').trim();

    const pairs: Array<{ open: number; close: number }> = [];
    let seek = 0;
    while (true) {
      const o = s.indexOf(OPEN, seek);
      if (o === -1) break;
      const c = s.indexOf(CLOSE, o + OPEN.length);
      if (c === -1) break;
      pairs.push({ open: o, close: c });
      seek = c + CLOSE.length;
    }

    if (!pairs.length) {
      const cut = s.length > radius * 2 ? s.slice(0, radius * 2) + '…' : s;
      return [cut];
    }

    type Range = { start: number; end: number };
    const ranges: Range[] = pairs.slice(0, maxChunks).map(({ open, close }) => ({
      start: Math.max(0, open - radius),
      end: Math.min(s.length, close + CLOSE.length + radius)
    }));

    ranges.sort((a, b) => a.start - b.start);
    const merged: Range[] = [];
    for (const r of ranges) {
      if (!merged.length || r.start > merged[merged.length - 1].end + 5) {
        merged.push({ ...r });
      } else {
        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, r.end);
      }
    }

    return merged.map(({ start, end }) => {
      let chunk = s.slice(start, end);
      if (start > 0) chunk = '… ' + chunk;
      if (end < s.length) chunk = chunk + ' …';
      return chunk
        .replaceAll(OPEN, '<em class="highlight">')
        .replaceAll(CLOSE, '</em>');
    });
  }

  getAllDynamicSummaries(r: SecurityIncidentReportResponse): string[] {
  const out: string[] = [];

  if (this.searchType === 'geolocation') {
    if (r.affectedOrganizationAddress) {
      out.push(r.affectedOrganizationAddress);
    }
    return out;
  }

  const fields: Array<{ key: keyof SecurityIncidentReportResponse; radius: number; maxChunks: number }> = [
    { key: 'employeeName', radius: 20, maxChunks: 2 },
    { key: 'affectedOrganizationName', radius: 20, maxChunks: 2 },
    { key: 'securityOrganizationName', radius: 20, maxChunks: 2 },
    { key: 'severityLevel', radius: 10, maxChunks: 1 },
    { key: 'reportContent', radius: 80, maxChunks: 10 }, 
  ];

  for (const { key, radius, maxChunks } of fields) {
    const v = (r as any)[key] as string | undefined;
    if (typeof v === 'string' && v.includes('class="highlight"')) {
      out.push(...this.dynamicSnippetsSafe(v, radius, maxChunks));
    }
  }

  if (!out.length) {
    out.push(...this.dynamicSnippetsSafe(r.reportContent ?? r.employeeName ?? '', 80, 1));
  }

  return Array.from(new Set(out));
}

  logout() {
    getKeycloak().logout({
      redirectUri: window.location.origin,
    });
  }

  navigateToDocumentParser() {
    this.router.navigate(['/document-parser']);
  }
}
