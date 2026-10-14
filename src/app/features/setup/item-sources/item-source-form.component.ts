import { MX_DIALOG_DATA, MxDialogRef } from '@mesix/custom-control';
import { Component, DestroyRef, Inject, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  ItemSource,
  ItemSourceParameter,
  ItemSourceStep,
  ParameterField,
  parameterFields,
  parameterTables,
  sourceFields,
  sourceTables,
  splitParameterValue,
} from '../../../core/item-sources/item-source.model';
import { compareOperators, CompareOperator } from '../../../core/item-sources/item-source-query';

interface ParameterDraft {
  variableName: string;
  table: string;
  field: string;
}

@Component({
  selector: 'app-item-source-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './item-source-form.component.html',
  styleUrl: './item-source-form.component.scss',
})
export class ItemSourceFormComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  readonly parameterTables = parameterTables;
  readonly sourceTables = sourceTables;
  readonly operators = compareOperators;
  stepValueOptions: { value: string; label: string }[][] = [];
  form!: FormGroup;
  dialogTitle = 'Add Item Source';
  logicError = '';
  parameterError = '';
  stepError = '';
  showLegacyLogic = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MxDialogRef<any>,
    @Inject(MX_DIALOG_DATA) public data: { mode: string; source?: ItemSource },
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^[A-Za-z_][A-Za-z0-9_]*$/)]],
      name: ['', Validators.required],
      output: ['', Validators.required],
      logic: [''],
      parameters: this.fb.array([]),
      steps: this.fb.array([]),
    });
    if (this.data.mode === 'edit' && this.data.source) {
      this.dialogTitle = 'Edit Item Source';
      const source = this.data.source;
      this.form.patchValue(source);
      source.parameters.forEach((parameter) => this.addParameter(parameter));
      (source.steps || []).forEach((step) => this.addStep(step));
      this.showLegacyLogic = !!source.logic.trim() && !(source.steps || []).length;
    }
    if (this.parameters.length === 0) {
      this.addParameter();
    }
    if (this.steps.length === 0) {
      this.addStep();
    }
    this.refreshValueOptions();
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.refreshValueOptions();
    });
  }

  get parameters(): FormArray {
    return this.form.get('parameters') as FormArray;
  }

  get steps(): FormArray {
    return this.form.get('steps') as FormArray;
  }

  fieldsFor(table: string | null | undefined): ParameterField[] {
    return parameterFields(table || '');
  }

  sourceFieldsFor(table: string | null | undefined): ParameterField[] {
    return sourceFields(table || '');
  }

  addParameter(parameter?: ItemSourceParameter): void {
    const selected = splitParameterValue(parameter?.variableValue || '');
    this.parameters.push(
      this.fb.group({
        variableName: [parameter?.variableName || ''],
        table: [selected.table],
        field: [selected.field],
      }),
    );
  }

  onTableChange(index: number): void {
    this.clearFieldWhenTableChanges(
      this.parameters.at(index) as FormGroup,
      'field',
      parameterFields,
    );
  }

  removeParameter(index: number): void {
    if (this.parameters.length === 1) {
      return;
    }
    this.parameters.removeAt(index);
  }

  addStep(step?: ItemSourceStep): void {
    this.steps.push(
      this.fb.group({
        table: [step?.table || ''],
        selectField: [step?.selectField || ''],
        into: [step?.into || ''],
        whereField: [step?.whereField || ''],
        operator: [step?.operator || '=='],
        whereValue: [step?.whereValue || ''],
      }),
    );
  }

  onStepTableChange(index: number): void {
    const group = this.steps.at(index) as FormGroup;
    this.clearFieldWhenTableChanges(group, 'selectField', sourceFields);
    this.clearFieldWhenTableChanges(group, 'whereField', sourceFields);
  }

  removeStep(index: number): void {
    if (this.steps.length === 1) {
      return;
    }
    this.steps.removeAt(index);
  }

  private refreshValueOptions(): void {
    const next = this.steps.controls.map((_, index) => this.valueOptions(index));
    if (JSON.stringify(next) === JSON.stringify(this.stepValueOptions)) {
      return;
    }
    this.stepValueOptions = next;
  }

  private valueOptions(index: number): { value: string; label: string }[] {
    const options: { value: string; label: string }[] = [];
    this.parameters.controls.forEach((control) => {
      const name = String(control.get('variableName')?.value || '').trim();
      if (!name) {
        return;
      }
      const token = name.startsWith('#') ? name : `#${name}`;
      options.push({ value: token, label: token });
    });
    for (let earlier = 0; earlier < index; earlier++) {
      const into = String(this.steps.at(earlier).get('into')?.value || '').trim();
      if (!into || into.toLowerCase() === 'result') {
        continue;
      }
      const token = `context.${into.replace(/^context\./i, '')}`;
      options.push({ value: token, label: token });
    }
    return options;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    this.logicError = '';
    this.parameterError = '';
    this.stepError = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const code = String(this.form.value.code || '').trim();
    const name = String(this.form.value.name || '').trim();
    const output = String(this.form.value.output || '').trim();
    const logic = String(this.form.value.logic || '').trim();
    const parameters = this.parameterDrafts();
    if (
      parameters.length === 0 ||
      parameters.some(
        (parameter) => !parameter.variableName || !parameter.table || !parameter.field,
      )
    ) {
      this.parameterError =
        'Add at least one input parameter. Each one needs a name, a table, and a field.';
      return;
    }
    const names = new Set<string>();
    for (const parameter of parameters) {
      const parameterName = parameter.variableName.replace(/^#/, '').toLowerCase();
      if (names.has(parameterName)) {
        this.parameterError = 'Input parameter names must be unique.';
        return;
      }
      names.add(parameterName);
    }
    const steps = this.stepDrafts();
    const usedSteps = steps.filter((step) => this.stepIsUsed(step));
    if (usedSteps.length && !this.stepsAreValid(usedSteps)) {
      return;
    }
    if (!usedSteps.length && !logic) {
      this.stepError = 'Add at least one step, and mark the last value as Result.';
      return;
    }
    this.dialogRef.close({
      code,
      name,
      output,
      logic,
      parameters: parameters.map((parameter) => ({
        variableName: parameter.variableName.startsWith('#')
          ? parameter.variableName
          : `#${parameter.variableName}`,
        variableValue: `${parameter.table}.${parameter.field}`,
      })),
      steps: usedSteps,
    });
  }

  private parameterDrafts(): ParameterDraft[] {
    return this.parameters.controls.map((control) => ({
      variableName: String(control.get('variableName')?.value || '').trim(),
      table: String(control.get('table')?.value || '').trim(),
      field: String(control.get('field')?.value || '').trim(),
    }));
  }

  private stepDrafts(): ItemSourceStep[] {
    return this.steps.controls.map((control) => ({
      table: String(control.get('table')?.value || '').trim(),
      selectField: String(control.get('selectField')?.value || '').trim(),
      into: String(control.get('into')?.value || '').trim(),
      whereField: String(control.get('whereField')?.value || '').trim(),
      operator: (control.get('operator')?.value || '==') as CompareOperator,
      whereValue: String(control.get('whereValue')?.value || '').trim(),
    }));
  }

  private stepIsUsed(step: ItemSourceStep): boolean {
    return !!(step.table || step.selectField || step.into || step.whereField || step.whereValue);
  }

  private stepsAreValid(steps: ItemSourceStep[]): boolean {
    if (
      steps.some(
        (step) =>
          !step.table || !step.selectField || !step.into || !step.whereField || !step.whereValue,
      )
    ) {
      this.stepError = 'Each step needs a table, a selected field, a saved name, and a condition.';
      return false;
    }
    const saved = new Set<string>();
    for (const step of steps) {
      const into = step.into.replace(/^context\./i, '');
      if (into.toLowerCase() === 'result') {
        continue;
      }
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(into)) {
        this.stepError = 'Save each step as Result, or as a name such as branchid.';
        return false;
      }
      const key = into.toLowerCase();
      if (saved.has(key)) {
        this.stepError = 'Each saved name can be used once.';
        return false;
      }
      saved.add(key);
    }
    const results = steps.filter(
      (step) => step.into.replace(/^context\./i, '').toLowerCase() === 'result',
    );
    if (results.length !== 1) {
      this.stepError = 'One step must be saved as Result. That value is the item source output.';
      return false;
    }
    return true;
  }

  private clearFieldWhenTableChanges(
    group: FormGroup,
    controlName: string,
    fields: (table: string) => ParameterField[],
  ): void {
    const field = String(group.get(controlName)?.value || '');
    const allowed = fields(String(group.get('table')?.value || '')).some(
      (item) => item.field === field,
    );
    if (!allowed) {
      group.patchValue({ [controlName]: '' });
    }
  }
}
