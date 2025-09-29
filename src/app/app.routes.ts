import { Routes } from '@angular/router';
import { DocumentParserComponent } from './components/document-parser/document-parser';

export const routes: Routes = [
  { path: '', redirectTo: 'document-parser', pathMatch: 'full' },
  { path: 'document-parser', component: DocumentParserComponent }
];