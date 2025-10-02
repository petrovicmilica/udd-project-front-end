import { Component } from '@angular/core';
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
    SafeHtmlPipe
  ]
})
export class SearchDocumentsComponent {
  searchForm: FormGroup;
  results: SecurityIncidentReportResponse[] = [];

  constructor(
    private fb: FormBuilder,
    private reportService: SecurityIncidentReportService
  ) {
    this.searchForm = this.fb.group({
      keywords: ['']
    });
  }

  onSearch() {
    const keywords = this.searchForm.value.keywords.split(' ').filter((k: string) => k.trim() !== '');
    console.log('Searching with keywords:', keywords);

    this.reportService.searchDocuments(keywords, 'simple').subscribe({
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

    // 1) Sačuvaj highlight tagove markerima
    let s = src
      .replace(/<em\s+class=["']highlight["']>/g, OPEN)
      .replace(/<\/em>/g, CLOSE);

    // 2) Ukloni ostale HTML tagove
    s = s.replace(/<(?:.|\n)*?>/g, ' ');
    s = s.replace(/\s+/g, ' ').trim();

    // 3) Skupi parove (OPEN→CLOSE)
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

    // 4) Opsezi koji obuhvataju ceo highlight + kontekst
    type Range = { start: number; end: number };
    const ranges: Range[] = pairs.slice(0, maxChunks).map(({ open, close }) => ({
      start: Math.max(0, open - radius),
      end: Math.min(s.length, close + CLOSE.length + radius)
    }));

    // 5) Spoji preklapanja
    ranges.sort((a, b) => a.start - b.start);
    const merged: Range[] = [];
    for (const r of ranges) {
      if (!merged.length || r.start > merged[merged.length - 1].end + 5) {
        merged.push({ ...r });
      } else {
        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, r.end);
      }
    }

    // 6) Vrati isečke (sa vraćenim <em> tagovima)
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

  // Lista polja kroz koja treba da prođemo
  const fields: Array<{ key: keyof SecurityIncidentReportResponse; radius: number; maxChunks: number }> = [
    { key: 'employeeName', radius: 20, maxChunks: 2 },
    { key: 'affectedOrganizationName', radius: 20, maxChunks: 2 },
    { key: 'securityOrganizationName', radius: 20, maxChunks: 2 },
    { key: 'severityLevel', radius: 10, maxChunks: 1 },
    { key: 'reportContent', radius: 80, maxChunks: 10 }, // dodaj i content ovde
  ];

  // Za svako polje proveri da li sadrži highlight
  for (const { key, radius, maxChunks } of fields) {
    const v = (r as any)[key] as string | undefined;
    if (typeof v === 'string' && v.includes('class="highlight"')) {
      out.push(...this.dynamicSnippetsSafe(v, radius, maxChunks));
    }
  }

  // Ako ništa nije highlightovano, prikaži makar nešto (fallback)
  if (!out.length) {
    out.push(...this.dynamicSnippetsSafe(r.reportContent ?? r.employeeName ?? '', 80, 1));
  }

  // Ukloni duplikate
  return Array.from(new Set(out));
}
}
