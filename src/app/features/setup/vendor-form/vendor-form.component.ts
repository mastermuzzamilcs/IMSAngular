import { Component, Inject, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MaterialModule } from '../../../shared/material/material.module';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MxButtonComponent, MxDialogRef, MX_DIALOG_DATA } from '@mesix/custom-control';
import { asStatus, Status } from '../../../core/enums/status.enum';
import { UsersService } from '../../../core/services/users.service';

@Component({
  selector: 'app-vendor-form',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MaterialModule,
    ReactiveFormsModule,
    CommonModule,
    MxButtonComponent,
  ],
  templateUrl: './vendor-form.component.html',
  styleUrls: ['./vendor-form.component.scss'],
})
export class VendorFormComponent implements OnInit {
  readonly Status = Status;
  VendorForm!: FormGroup;
  dialogTitle: string = 'Add Vendor';

  constructor(
    private fb: FormBuilder,
    public dialogRef: MxDialogRef<any>,
    @Inject(MX_DIALOG_DATA) public data: any,
    private userService: UsersService,
  ) {}

  ngOnInit(): void {
    this.InitForm();
    // this._roles = this.data.rolesLookup;
    // this._branches = this.data.branchesLookup;

    // const managerRole = this._roles?.find(r => r.name.toLowerCase() === this.managerRoleName.toLowerCase());
    // if (managerRole?.id) {
    //   this.userService.getUsersByRole(managerRole.id).then(tempUsers => {
    //     this._managerUsers = tempUsers;
    //   });
    // }

    if (this.data.mode === 'edit') {
      this.dialogTitle = 'Edit Vendor';
      this.patchFormValues();
    }
  }
  InitForm(): void {
    this.VendorForm = this.fb.group({
      name: ['', [Validators.required]],
      location: [''],
      description: [''],
      status: [Status.Active],
    });
  }
  patchFormValues(): void {
    const vendor = this.data._vendor;
    this.VendorForm.patchValue({
      name: vendor.name,
      location: vendor.location,
      description: vendor.description,
      status: asStatus(vendor.status),
    });
  }
  onSubmit(): void {
    if (this.VendorForm.valid) {
      this.dialogRef.close(this.VendorForm.value);
    } else {
      this.markFormGroupTouched(this.VendorForm);
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
  onCancel() {
    this.dialogRef.close(null);
  }
}
