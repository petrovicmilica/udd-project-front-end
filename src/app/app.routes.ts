import { Routes } from '@angular/router';
import { DocumentParserComponent } from './components/document-parser/document-parser';
import { SearchDocumentsComponent } from './components/search-documents/search-documents';

export const routes: Routes = [
  { path: '', redirectTo: 'document-parser', pathMatch: 'full' },
  { path: 'document-parser', component: DocumentParserComponent },
  { path: 'search', component: SearchDocumentsComponent}
];