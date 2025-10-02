import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchDocuments } from './search-documents';

describe('SearchDocuments', () => {
  let component: SearchDocuments;
  let fixture: ComponentFixture<SearchDocuments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchDocuments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchDocuments);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
