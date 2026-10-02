import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemSearchModalComponent } from './item-search-modal.component';

describe('ItemSearchModalComponent', () => {
  let component: ItemSearchModalComponent;
  let fixture: ComponentFixture<ItemSearchModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemSearchModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemSearchModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
