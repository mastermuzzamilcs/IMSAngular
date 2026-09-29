import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockInComponent } from './stock-in.component';

describe('StockInComponent', () => {
  let component: StockInComponent;
  let fixture: ComponentFixture<StockInComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockInComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StockInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
