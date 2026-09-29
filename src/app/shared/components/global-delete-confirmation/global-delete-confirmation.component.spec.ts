import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GlobalDeleteConfirmationComponent } from './global-delete-confirmation.component';

describe('GlobalDeleteConfirmationComponent', () => {
  let component: GlobalDeleteConfirmationComponent;
  let fixture: ComponentFixture<GlobalDeleteConfirmationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalDeleteConfirmationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GlobalDeleteConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
