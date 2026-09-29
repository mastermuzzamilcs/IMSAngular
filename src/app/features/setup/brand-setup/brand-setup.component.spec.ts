import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrandSetupComponent } from './brand-setup.component';

describe('BrandSetupComponent', () => {
  let component: BrandSetupComponent;
  let fixture: ComponentFixture<BrandSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrandSetupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BrandSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
