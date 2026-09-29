import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MaterialModule } from '../../../shared/material/material.module'; // if you're using shared material
import { BrandService } from '../../../core/services/brand.service'; // update path as needed

@Component({
  selector: 'app-products-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatOptionModule,
    MaterialModule,
  ],
  templateUrl: './products-form.component.html',
  styleUrls: ['./products-form.component.scss'],
})
export class ProductsFormComponent implements OnInit {
  productForm!: FormGroup;
  dialogTitle: string = 'Add Product';
  brands: any[] = [];

  constructor(
    private fb: FormBuilder,
    private brandService: BrandService,
    public dialogRef: MatDialogRef<ProductsFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  async ngOnInit(): Promise<void> {
    this.initForm();

    this.brands = await this.brandService.getBrands();

    if (this.data?.mode === 'edit') {
      this.dialogTitle = 'Edit Product';
      this.patchFormValues();
    }
  }
  patchFormValues(): void {
    const _product = this.data._product;
    this.productForm.patchValue({
      name: _product.name,
      description: _product.description,
      brandId: _product.brandid || _product.brand,
      price: _product.price,
      status: _product.status,
    });
  }

  initForm(): void {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      brandId: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(0)]],
      status: ['Active'],
    });
  }

  onSubmit(): void {
    if (this.productForm.valid) {
      this.dialogRef.close(this.productForm.value);
    } else {
      this.markFormGroupTouched(this.productForm);
    }
  }
  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
