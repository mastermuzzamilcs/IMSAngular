import { EventEmitter } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import * as i0 from "@angular/core";
export interface MxSelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}
/** Drive-style filled dropdown (no floating outline label). */
export declare class MxSelectComponent implements ControlValueAccessor {
    label: string;
    placeholder: string;
    options: MxSelectOption[];
    disabled: boolean;
    block: boolean;
    value: string;
    valueChange: EventEmitter<string>;
    private onChangeFn;
    private onTouchedFn;
    writeValue(value: string | null): void;
    registerOnChange(fn: (value: string) => void): void;
    registerOnTouched(fn: () => void): void;
    setDisabledState(isDisabled: boolean): void;
    onChange(value: string): void;
    onTouched(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<MxSelectComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<MxSelectComponent, "mx-select", never, { "label": { "alias": "label"; "required": false; }; "placeholder": { "alias": "placeholder"; "required": false; }; "options": { "alias": "options"; "required": false; }; "disabled": { "alias": "disabled"; "required": false; }; "block": { "alias": "block"; "required": false; }; "value": { "alias": "value"; "required": false; }; }, { "valueChange": "valueChange"; }, never, never, true, never>;
}
