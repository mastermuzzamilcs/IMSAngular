import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductsSetupComponent } from './products-setup.component';

describe('ProductsSetupComponent', () => {
  let component: ProductsSetupComponent;
  let fixture: ComponentFixture<ProductsSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsSetupComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductsSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
