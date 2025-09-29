import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentParser } from './document-parser';

describe('DocumentParser', () => {
  let component: DocumentParser;
  let fixture: ComponentFixture<DocumentParser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentParser]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentParser);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
