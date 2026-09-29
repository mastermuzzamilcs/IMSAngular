import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RolesFormComponent } from './roles-form.component';

describe('RolesFormComponent', () => {
  let component: RolesFormComponent;
  let fixture: ComponentFixture<RolesFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolesFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RolesFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
