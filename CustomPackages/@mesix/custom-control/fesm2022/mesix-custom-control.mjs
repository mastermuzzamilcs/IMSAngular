import '@angular/compiler';
import * as i0 from '@angular/core';
import { InjectionToken, Injectable, Component, Input, inject, DestroyRef, Injector, EventEmitter, Output, ViewEncapsulation, forwardRef } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import * as i1 from '@angular/common';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import * as i2 from '@angular/material/icon';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as i2$1 from '@angular/forms';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import * as i3 from '@angular/material/progress-spinner';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/** Data passed into a component opened via MxNoticeService.open(). */
const MX_DIALOG_DATA = new InjectionToken('MX_DIALOG_DATA');
/** Handle returned from MxNoticeService.open() — mirrors MatDialogRef close API. */
class MxDialogRef {
    onDismiss;
    closedSubject = new Subject();
    settled = false;
    constructor(onDismiss) {
        this.onDismiss = onDismiss;
    }
    afterClosed() {
        return this.closedSubject.asObservable();
    }
    close(result) {
        if (this.settled)
            return;
        this.settled = true;
        this.onDismiss();
        this.closedSubject.next(result);
        this.closedSubject.complete();
    }
}

class MxNoticeService {
    nextId = 0;
    toastTimers = new Map();
    toastClosers = new Map();
    toastsSubject = new BehaviorSubject([]);
    toasts$ = this.toastsSubject.asObservable();
    currentDialog = null;
    dialogQueue = [];
    dialogClosers = new Map();
    dialogSubject = new BehaviorSubject(null);
    dialog$ = this.dialogSubject.asObservable();
    contentDialogsSubject = new BehaviorSubject([]);
    /** All open component dialogs (supports nesting). */
    contentDialogs$ = this.contentDialogsSubject.asObservable();
    toast(options) {
        const result = new Subject();
        const id = ++this.nextId;
        const item = { id, type: options.type, message: options.message };
        const close = () => {
            if (!this.toastClosers.has(id))
                return;
            this.toastClosers.delete(id);
            const timer = this.toastTimers.get(id);
            if (timer)
                clearTimeout(timer);
            this.toastTimers.delete(id);
            this.toastsSubject.next(this.toastsSubject.value.filter((toast) => toast.id !== id));
            options.onClose?.();
            result.next();
            result.complete();
        };
        this.toastClosers.set(id, close);
        this.toastsSubject.next([...this.toastsSubject.value, item]);
        this.toastTimers.set(id, setTimeout(close, options.durationMs ?? 4000));
        return result.asObservable();
    }
    dismissToast(id) {
        this.toastClosers.get(id)?.();
    }
    /**
     * Open an Angular component inside the Mesix dialog shell (flexible width, no horizontal scroll).
     * Supports stacking for nested dialogs. Component should inject MxDialogRef + MX_DIALOG_DATA.
     */
    open(component, config) {
        const id = ++this.nextId;
        const ref = new MxDialogRef(() => this.dismissContentDialog(id));
        const state = {
            id,
            component: component,
            data: config?.data ?? null,
            ref: ref,
            disableClose: !!config?.disableClose,
        };
        this.contentDialogsSubject.next([...this.contentDialogsSubject.value, state]);
        return ref;
    }
    dismissContentDialog(id) {
        const list = this.contentDialogsSubject.value;
        if (!list.length)
            return;
        if (id == null) {
            this.contentDialogsSubject.next([]);
            return;
        }
        this.contentDialogsSubject.next(list.filter((item) => item.id !== id));
    }
    dialog(options) {
        const result = new Subject();
        const id = ++this.nextId;
        const item = {
            id,
            type: options.type,
            title: options.title,
            message: options.message,
            confirmText: options.confirmText ?? (options.type === 'success' || options.type === 'info' ? 'OK' : 'Confirm'),
            cancelText: options.cancelText ?? 'Cancel',
            showCancel: options.type === 'warning' || options.type === 'error' || !!options.cancelText,
            input: options.input,
            size: options.size ?? 'auto',
            width: options.width,
        };
        this.dialogClosers.set(id, (value) => {
            if (value.confirmed) {
                if (options.input)
                    options.onConfirm?.(value.value ?? '');
                else
                    options.onConfirm?.();
            }
            else {
                options.onCancel?.();
            }
            result.next(value);
            result.complete();
        });
        if (this.currentDialog)
            this.dialogQueue.push(item);
        else
            this.showDialog(item);
        return result.asObservable();
    }
    confirmDialog(value) {
        const current = this.currentDialog;
        if (!current)
            return;
        this.finishDialog(current.id, { confirmed: true, value });
    }
    cancelDialog() {
        const current = this.currentDialog;
        if (!current)
            return;
        this.finishDialog(current.id, { confirmed: false });
    }
    showDialog(item) {
        this.currentDialog = item;
        this.dialogSubject.next(item);
    }
    finishDialog(id, value) {
        const close = this.dialogClosers.get(id);
        this.dialogClosers.delete(id);
        close?.(value);
        this.currentDialog = null;
        this.dialogSubject.next(null);
        const next = this.dialogQueue.shift();
        if (next)
            this.showDialog(next);
    }
    static ɵfac = function MxNoticeService_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || MxNoticeService)(); };
    static ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: MxNoticeService, factory: MxNoticeService.ɵfac, providedIn: 'root' });
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(MxNoticeService, [{
        type: Injectable,
        args: [{ providedIn: 'root' }]
    }], null, null); })();

function MxToastHostComponent_article_1_Template(rf, ctx) { if (rf & 1) {
    const _r1 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "article", 2)(1, "mat-icon", 3);
    i0.ɵɵtext(2);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(3, "p");
    i0.ɵɵtext(4);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(5, "button", 4);
    i0.ɵɵlistener("click", function MxToastHostComponent_article_1_Template_button_click_5_listener() { const toast_r2 = i0.ɵɵrestoreView(_r1).$implicit; const ctx_r2 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r2.notice.dismissToast(toast_r2.id)); });
    i0.ɵɵelementStart(6, "mat-icon");
    i0.ɵɵtext(7, "close");
    i0.ɵɵelementEnd()()();
} if (rf & 2) {
    const toast_r2 = ctx.$implicit;
    const ctx_r2 = i0.ɵɵnextContext();
    i0.ɵɵproperty("ngClass", toast_r2.type);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(ctx_r2.iconFor(toast_r2.type));
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(toast_r2.message);
} }
class MxToastHostComponent {
    notice;
    /** Where toasts appear */
    position = 'top-right';
    constructor(notice) {
        this.notice = notice;
    }
    iconFor(type) {
        if (type === 'success')
            return 'check_circle';
        if (type === 'warning')
            return 'warning';
        if (type === 'info')
            return 'info';
        return 'error';
    }
    static ɵfac = function MxToastHostComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || MxToastHostComponent)(i0.ɵɵdirectiveInject(MxNoticeService)); };
    static ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: MxToastHostComponent, selectors: [["mx-toast-host"]], inputs: { position: "position" }, decls: 3, vars: 7, consts: [["aria-live", "polite", 1, "toast-stack"], ["class", "toast", 3, "ngClass", 4, "ngFor", "ngForOf"], [1, "toast", 3, "ngClass"], ["aria-hidden", "true"], ["type", "button", "aria-label", "Dismiss", 1, "close", 3, "click"]], template: function MxToastHostComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵelementStart(0, "div", 0);
            i0.ɵɵtemplate(1, MxToastHostComponent_article_1_Template, 8, 3, "article", 1);
            i0.ɵɵpipe(2, "async");
            i0.ɵɵelementEnd();
        } if (rf & 2) {
            i0.ɵɵclassProp("left", ctx.position === "top-left")("center", ctx.position === "top-center");
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngForOf", i0.ɵɵpipeBind1(2, 5, ctx.notice.toasts$));
        } }, dependencies: [CommonModule, i1.NgClass, i1.NgForOf, i1.AsyncPipe, MatIconModule, i2.MatIcon], styles: [".toast-stack[_ngcontent-%COMP%]{position:fixed;top:var(--mx-space-4, 16px);right:var(--mx-space-4, 16px);z-index:var(--mx-z-toast, 10050);display:flex;flex-direction:column;gap:var(--mx-space-2, 8px);width:min(360px,calc(100vw - 32px));pointer-events:none}.toast-stack.left[_ngcontent-%COMP%]{right:auto;left:var(--mx-space-4, 16px)}.toast-stack.center[_ngcontent-%COMP%]{left:50%;right:auto;transform:translate(-50%)}.toast[_ngcontent-%COMP%]{pointer-events:auto;display:flex;align-items:flex-start;gap:10px;padding:12px 12px 12px 14px;border-radius:var(--mx-radius, 10px);border:1px solid transparent;box-shadow:var(--mx-shadow);background:var(--mx-surface, #fff);font-family:var(--mx-font, inherit);animation:_ngcontent-%COMP%_mx-toast-in var(--mx-motion, .2s) var(--mx-ease, ease)}.toast[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{margin:2px 0 0;flex:1;line-height:1.4;overflow-wrap:anywhere}.toast.success[_ngcontent-%COMP%]{background:var(--mx-success-bg);border-color:var(--mx-success-border);color:var(--mx-success)}.toast.warning[_ngcontent-%COMP%]{background:var(--mx-warning-bg);border-color:var(--mx-warning-border);color:var(--mx-warning)}.toast.error[_ngcontent-%COMP%]{background:var(--mx-error-bg);border-color:var(--mx-error-border);color:var(--mx-warn)}.toast.info[_ngcontent-%COMP%]{background:color-mix(in srgb,var(--mx-primary) 10%,white);border-color:color-mix(in srgb,var(--mx-primary) 30%,white);color:var(--mx-primary)}.close[_ngcontent-%COMP%]{border:0;background:transparent;color:inherit;padding:0;cursor:pointer;line-height:0}@keyframes _ngcontent-%COMP%_mx-toast-in{0%{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}"] });
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(MxToastHostComponent, [{
        type: Component,
        args: [{ selector: 'mx-toast-host', standalone: true, imports: [CommonModule, MatIconModule], template: `
    <div class="toast-stack" [class.left]="position === 'top-left'" [class.center]="position === 'top-center'" aria-live="polite">
      <article *ngFor="let toast of notice.toasts$ | async" class="toast" [ngClass]="toast.type">
        <mat-icon aria-hidden="true">{{ iconFor(toast.type) }}</mat-icon>
        <p>{{ toast.message }}</p>
        <button type="button" class="close" (click)="notice.dismissToast(toast.id)" aria-label="Dismiss">
          <mat-icon>close</mat-icon>
        </button>
      </article>
    </div>
  `, styles: [".toast-stack{position:fixed;top:var(--mx-space-4, 16px);right:var(--mx-space-4, 16px);z-index:var(--mx-z-toast, 10050);display:flex;flex-direction:column;gap:var(--mx-space-2, 8px);width:min(360px,calc(100vw - 32px));pointer-events:none}.toast-stack.left{right:auto;left:var(--mx-space-4, 16px)}.toast-stack.center{left:50%;right:auto;transform:translate(-50%)}.toast{pointer-events:auto;display:flex;align-items:flex-start;gap:10px;padding:12px 12px 12px 14px;border-radius:var(--mx-radius, 10px);border:1px solid transparent;box-shadow:var(--mx-shadow);background:var(--mx-surface, #fff);font-family:var(--mx-font, inherit);animation:mx-toast-in var(--mx-motion, .2s) var(--mx-ease, ease)}.toast p{margin:2px 0 0;flex:1;line-height:1.4;overflow-wrap:anywhere}.toast.success{background:var(--mx-success-bg);border-color:var(--mx-success-border);color:var(--mx-success)}.toast.warning{background:var(--mx-warning-bg);border-color:var(--mx-warning-border);color:var(--mx-warning)}.toast.error{background:var(--mx-error-bg);border-color:var(--mx-error-border);color:var(--mx-warn)}.toast.info{background:color-mix(in srgb,var(--mx-primary) 10%,white);border-color:color-mix(in srgb,var(--mx-primary) 30%,white);color:var(--mx-primary)}.close{border:0;background:transparent;color:inherit;padding:0;cursor:pointer;line-height:0}@keyframes mx-toast-in{0%{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}\n"] }]
    }], () => [{ type: MxNoticeService }], { position: [{
            type: Input
        }] }); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(MxToastHostComponent, { className: "MxToastHostComponent", filePath: "lib/notice/mx-toast-host.component.ts", lineNumber: 103 }); })();

function MxDialogHostComponent_div_0_label_9_textarea_3_Template(rf, ctx) { if (rf & 1) {
    const _r3 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "textarea", 13);
    i0.ɵɵtwoWayListener("ngModelChange", function MxDialogHostComponent_div_0_label_9_textarea_3_Template_textarea_ngModelChange_0_listener($event) { i0.ɵɵrestoreView(_r3); const ctx_r1 = i0.ɵɵnextContext(3); i0.ɵɵtwoWayBindingSet(ctx_r1.draft, $event) || (ctx_r1.draft = $event); return i0.ɵɵresetView($event); });
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const input_r4 = i0.ɵɵnextContext().ngIf;
    const ctx_r1 = i0.ɵɵnextContext(2);
    i0.ɵɵtwoWayProperty("ngModel", ctx_r1.draft);
    i0.ɵɵproperty("placeholder", input_r4.placeholder || "");
} }
function MxDialogHostComponent_div_0_label_9_ng_template_4_Template(rf, ctx) { if (rf & 1) {
    const _r5 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "input", 14);
    i0.ɵɵtwoWayListener("ngModelChange", function MxDialogHostComponent_div_0_label_9_ng_template_4_Template_input_ngModelChange_0_listener($event) { i0.ɵɵrestoreView(_r5); const ctx_r1 = i0.ɵɵnextContext(3); i0.ɵɵtwoWayBindingSet(ctx_r1.draft, $event) || (ctx_r1.draft = $event); return i0.ɵɵresetView($event); });
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const input_r4 = i0.ɵɵnextContext().ngIf;
    const ctx_r1 = i0.ɵɵnextContext(2);
    i0.ɵɵtwoWayProperty("ngModel", ctx_r1.draft);
    i0.ɵɵproperty("placeholder", input_r4.placeholder || "");
    i0.ɵɵattribute("aria-required", input_r4.required || null);
} }
function MxDialogHostComponent_div_0_label_9_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "label", 11)(1, "span");
    i0.ɵɵtext(2);
    i0.ɵɵelementEnd();
    i0.ɵɵtemplate(3, MxDialogHostComponent_div_0_label_9_textarea_3_Template, 1, 2, "textarea", 12)(4, MxDialogHostComponent_div_0_label_9_ng_template_4_Template, 1, 3, "ng-template", null, 0, i0.ɵɵtemplateRefExtractor);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const input_r4 = ctx.ngIf;
    const singleLine_r6 = i0.ɵɵreference(5);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(input_r4.label);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", input_r4.multiline)("ngIfElse", singleLine_r6);
} }
function MxDialogHostComponent_div_0_button_11_Template(rf, ctx) { if (rf & 1) {
    const _r7 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "button", 15);
    i0.ɵɵlistener("click", function MxDialogHostComponent_div_0_button_11_Template_button_click_0_listener() { i0.ɵɵrestoreView(_r7); const ctx_r1 = i0.ɵɵnextContext(2); return i0.ɵɵresetView(ctx_r1.notice.cancelDialog()); });
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const dialog_r8 = i0.ɵɵnextContext().ngIf;
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate1(" ", dialog_r8.cancelText, " ");
} }
function MxDialogHostComponent_div_0_Template(rf, ctx) { if (rf & 1) {
    const _r1 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "div", 3);
    i0.ɵɵlistener("click", function MxDialogHostComponent_div_0_Template_div_click_0_listener() { i0.ɵɵrestoreView(_r1); const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.notice.cancelDialog()); });
    i0.ɵɵelementStart(1, "section", 4);
    i0.ɵɵlistener("click", function MxDialogHostComponent_div_0_Template_section_click_1_listener($event) { i0.ɵɵrestoreView(_r1); return i0.ɵɵresetView($event.stopPropagation()); });
    i0.ɵɵelementStart(2, "header")(3, "mat-icon", 5);
    i0.ɵɵtext(4);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(5, "h2", 6);
    i0.ɵɵtext(6);
    i0.ɵɵelementEnd()();
    i0.ɵɵelementStart(7, "p", 7);
    i0.ɵɵtext(8);
    i0.ɵɵelementEnd();
    i0.ɵɵtemplate(9, MxDialogHostComponent_div_0_label_9_Template, 6, 3, "label", 8);
    i0.ɵɵelementStart(10, "footer");
    i0.ɵɵtemplate(11, MxDialogHostComponent_div_0_button_11_Template, 2, 1, "button", 9);
    i0.ɵɵelementStart(12, "button", 10);
    i0.ɵɵlistener("click", function MxDialogHostComponent_div_0_Template_button_click_12_listener() { const dialog_r8 = i0.ɵɵrestoreView(_r1).ngIf; const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.confirm(dialog_r8)); });
    i0.ɵɵtext(13);
    i0.ɵɵelementEnd()()()();
} if (rf & 2) {
    const dialog_r8 = ctx.ngIf;
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵstyleProp("width", dialog_r8.width || null);
    i0.ɵɵclassProp("compact", dialog_r8.size === "compact")("wide", dialog_r8.size === "wide");
    i0.ɵɵproperty("ngClass", dialog_r8.type);
    i0.ɵɵattribute("aria-labelledby", "mx-notice-title-" + dialog_r8.id);
    i0.ɵɵadvance(3);
    i0.ɵɵtextInterpolate(ctx_r1.iconFor(dialog_r8.type));
    i0.ɵɵadvance();
    i0.ɵɵproperty("id", "mx-notice-title-" + dialog_r8.id);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(dialog_r8.title);
    i0.ɵɵadvance(2);
    i0.ɵɵtextInterpolate(dialog_r8.message);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", dialog_r8.input);
    i0.ɵɵadvance(2);
    i0.ɵɵproperty("ngIf", dialog_r8.showCancel);
    i0.ɵɵadvance();
    i0.ɵɵproperty("disabled", ctx_r1.confirmDisabled(dialog_r8));
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate1(" ", dialog_r8.confirmText, " ");
} }
function MxDialogHostComponent_div_2_ng_container_2_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementContainer(0);
} }
function MxDialogHostComponent_div_2_Template(rf, ctx) { if (rf & 1) {
    const _r9 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "div", 3);
    i0.ɵɵlistener("click", function MxDialogHostComponent_div_2_Template_div_click_0_listener() { const active_r10 = i0.ɵɵrestoreView(_r9).$implicit; const ctx_r1 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r1.onContentBackdrop(active_r10)); });
    i0.ɵɵelementStart(1, "section", 16);
    i0.ɵɵlistener("click", function MxDialogHostComponent_div_2_Template_section_click_1_listener($event) { i0.ɵɵrestoreView(_r9); return i0.ɵɵresetView($event.stopPropagation()); });
    i0.ɵɵtemplate(2, MxDialogHostComponent_div_2_ng_container_2_Template, 1, 0, "ng-container", 17);
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const active_r10 = ctx.$implicit;
    const i_r11 = ctx.index;
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵstyleProp("z-index", 10000 + i_r11);
    i0.ɵɵadvance(2);
    i0.ɵɵproperty("ngComponentOutlet", active_r10.component)("ngComponentOutletInjector", ctx_r1.injectorFor(active_r10));
} }
class MxDialogHostComponent {
    notice;
    draft = '';
    contentDialogs = [];
    draftDialogId = null;
    destroyRef = inject(DestroyRef);
    parentInjector = inject(Injector);
    injectors = new Map();
    constructor(notice) {
        this.notice = notice;
        this.notice.dialog$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((dialog) => {
            const id = dialog?.id ?? null;
            if (id !== this.draftDialogId) {
                this.draftDialogId = id;
                this.draft = '';
            }
        });
        this.notice.contentDialogs$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((list) => {
            const activeIds = new Set(list.map((item) => item.id));
            for (const id of [...this.injectors.keys()]) {
                if (!activeIds.has(id))
                    this.injectors.delete(id);
            }
            this.contentDialogs = list;
        });
    }
    injectorFor(state) {
        let injector = this.injectors.get(state.id);
        if (!injector) {
            injector = Injector.create({
                providers: [
                    { provide: MxDialogRef, useValue: state.ref },
                    { provide: MX_DIALOG_DATA, useValue: state.data },
                ],
                parent: this.parentInjector,
            });
            this.injectors.set(state.id, injector);
        }
        return injector;
    }
    iconFor(type) {
        if (type === 'success')
            return 'check_circle';
        if (type === 'warning')
            return 'warning';
        if (type === 'info')
            return 'info';
        return 'error';
    }
    confirmDisabled(dialog) {
        return !!dialog.input?.required && !this.draft.trim();
    }
    confirm(dialog) {
        if (this.confirmDisabled(dialog))
            return;
        this.notice.confirmDialog(dialog.input ? this.draft.trim() : undefined);
    }
    onContentBackdrop(state) {
        if (state.disableClose)
            return;
        state.ref.close(undefined);
    }
    static ɵfac = function MxDialogHostComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || MxDialogHostComponent)(i0.ɵɵdirectiveInject(MxNoticeService)); };
    static ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: MxDialogHostComponent, selectors: [["mx-dialog-host"]], decls: 3, vars: 4, consts: [["singleLine", ""], ["class", "backdrop", 3, "click", 4, "ngIf"], ["class", "backdrop", 3, "zIndex", "click", 4, "ngFor", "ngForOf"], [1, "backdrop", 3, "click"], ["role", "dialog", "aria-modal", "true", 1, "panel", 3, "click", "ngClass"], ["aria-hidden", "true"], [3, "id"], [1, "message"], ["class", "field", 4, "ngIf"], ["type", "button", "class", "ghost", 3, "click", 4, "ngIf"], ["type", "button", 1, "confirm", 3, "click", "disabled"], [1, "field"], ["rows", "4", 3, "ngModel", "placeholder", "ngModelChange", 4, "ngIf", "ngIfElse"], ["rows", "4", 3, "ngModelChange", "ngModel", "placeholder"], [3, "ngModelChange", "ngModel", "placeholder"], ["type", "button", 1, "ghost", 3, "click"], ["role", "dialog", "aria-modal", "true", 1, "panel", "content-panel", 3, "click"], [4, "ngComponentOutlet", "ngComponentOutletInjector"]], template: function MxDialogHostComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵtemplate(0, MxDialogHostComponent_div_0_Template, 14, 16, "div", 1);
            i0.ɵɵpipe(1, "async");
            i0.ɵɵtemplate(2, MxDialogHostComponent_div_2_Template, 3, 4, "div", 2);
        } if (rf & 2) {
            i0.ɵɵproperty("ngIf", i0.ɵɵpipeBind1(1, 2, ctx.notice.dialog$));
            i0.ɵɵadvance(2);
            i0.ɵɵproperty("ngForOf", ctx.contentDialogs);
        } }, dependencies: [CommonModule, i1.NgClass, i1.NgComponentOutlet, i1.NgForOf, i1.NgIf, i1.AsyncPipe, FormsModule, i2$1.DefaultValueAccessor, i2$1.NgControlStatus, i2$1.NgModel, MatIconModule, i2.MatIcon], styles: [".backdrop[_ngcontent-%COMP%]{position:fixed;inset:0;z-index:var(--mx-z-dialog, 10000);display:flex;align-items:center;justify-content:center;padding:var(--mx-space-5, 24px);background:var(--mx-overlay, rgba(0, 0, 0, .45))}.panel[_ngcontent-%COMP%]{width:fit-content;min-width:280px;max-width:min(96vw,1200px);max-height:80vh;overflow-x:hidden;overflow-y:auto;padding:20px 22px;border-radius:var(--mx-radius-lg, 14px);background:var(--mx-surface, #fff);color:var(--mx-text, #101828);box-shadow:var(--mx-shadow-lg);font-family:var(--mx-font, inherit);animation:_ngcontent-%COMP%_mx-dialog-in var(--mx-motion, .2s) var(--mx-ease, ease);box-sizing:border-box}.panel.content-panel[_ngcontent-%COMP%]{min-width:min(480px,92vw)}.panel.compact[_ngcontent-%COMP%]{max-width:min(360px,92vw)}.panel.wide[_ngcontent-%COMP%]{width:fit-content;max-width:min(96vw,1200px)}header[_ngcontent-%COMP%]{display:flex;align-items:flex-start;gap:10px}h2[_ngcontent-%COMP%]{margin:2px 0 0;font-size:1.2rem;line-height:1.3;overflow-wrap:anywhere}.message[_ngcontent-%COMP%]{margin:12px 0 0;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.5;color:var(--mx-text-muted, inherit)}.panel.success[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]{color:var(--mx-success)}.panel.warning[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]{color:var(--mx-warning)}.panel.error[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]{color:var(--mx-warn)}.panel.info[_ngcontent-%COMP%]   header[_ngcontent-%COMP%]{color:var(--mx-primary)}.field[_ngcontent-%COMP%]{display:flex;flex-direction:column;gap:6px;margin-top:16px}.field[_ngcontent-%COMP%]   input[_ngcontent-%COMP%], .field[_ngcontent-%COMP%]   textarea[_ngcontent-%COMP%]{width:100%;min-width:240px;box-sizing:border-box;border:1px solid var(--mx-border);border-radius:calc(var(--mx-radius, 10px) - 2px);padding:10px 12px;font:inherit;background:var(--mx-surface);color:var(--mx-text);resize:vertical}footer[_ngcontent-%COMP%]{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}button[_ngcontent-%COMP%]{border-radius:20px;padding:8px 18px;font:inherit;font-weight:500;cursor:pointer;min-height:36px;border:1px solid var(--mx-border);box-sizing:border-box}.ghost[_ngcontent-%COMP%]{border-color:var(--mx-border);background:transparent;color:var(--mx-primary)}.ghost[_ngcontent-%COMP%]:hover{background:color-mix(in srgb,var(--mx-primary) 8%,transparent);border-color:color-mix(in srgb,var(--mx-primary) 45%,var(--mx-border))}.confirm[_ngcontent-%COMP%]{border-color:var(--mx-primary);color:var(--mx-primary-contrast, #fff);background:var(--mx-primary)}.confirm[_ngcontent-%COMP%]:hover:not(:disabled){filter:brightness(1.06);border-color:var(--mx-primary)}.confirm[_ngcontent-%COMP%]:disabled{border-color:var(--mx-border)}.panel.success[_ngcontent-%COMP%]   .confirm[_ngcontent-%COMP%]{background:var(--mx-success)}.panel.warning[_ngcontent-%COMP%]   .confirm[_ngcontent-%COMP%]{background:var(--mx-warning)}.panel.error[_ngcontent-%COMP%]   .confirm[_ngcontent-%COMP%]{background:var(--mx-warn)}.confirm[_ngcontent-%COMP%]:disabled{opacity:.5;cursor:default}@keyframes _ngcontent-%COMP%_mx-dialog-in{0%{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}"] });
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(MxDialogHostComponent, [{
        type: Component,
        args: [{ selector: 'mx-dialog-host', standalone: true, imports: [CommonModule, FormsModule, MatIconModule, NgComponentOutlet], template: `
    <div class="backdrop" *ngIf="notice.dialog$ | async as dialog" (click)="notice.cancelDialog()">
      <section
        class="panel"
        [ngClass]="dialog.type"
        [class.compact]="dialog.size === 'compact'"
        [class.wide]="dialog.size === 'wide'"
        [style.width]="dialog.width || null"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="'mx-notice-title-' + dialog.id"
        (click)="$event.stopPropagation()"
      >
        <header>
          <mat-icon aria-hidden="true">{{ iconFor(dialog.type) }}</mat-icon>
          <h2 [id]="'mx-notice-title-' + dialog.id">{{ dialog.title }}</h2>
        </header>
        <p class="message">{{ dialog.message }}</p>
        <label class="field" *ngIf="dialog.input as input">
          <span>{{ input.label }}</span>
          <textarea
            *ngIf="input.multiline; else singleLine"
            [(ngModel)]="draft"
            rows="4"
            [placeholder]="input.placeholder || ''"
          ></textarea>
          <ng-template #singleLine>
            <input
              [(ngModel)]="draft"
              [placeholder]="input.placeholder || ''"
              [attr.aria-required]="input.required || null"
            />
          </ng-template>
        </label>
        <footer>
          <button *ngIf="dialog.showCancel" type="button" class="ghost" (click)="notice.cancelDialog()">
            {{ dialog.cancelText }}
          </button>
          <button type="button" class="confirm" [disabled]="confirmDisabled(dialog)" (click)="confirm(dialog)">
            {{ dialog.confirmText }}
          </button>
        </footer>
      </section>
    </div>

    <div
      class="backdrop"
      *ngFor="let active of contentDialogs; let i = index"
      [style.zIndex]="10000 + i"
      (click)="onContentBackdrop(active)"
    >
      <section
        class="panel content-panel"
        role="dialog"
        aria-modal="true"
        (click)="$event.stopPropagation()"
      >
        <ng-container
          *ngComponentOutlet="active.component; injector: injectorFor(active)"
        />
      </section>
    </div>
  `, styles: [".backdrop{position:fixed;inset:0;z-index:var(--mx-z-dialog, 10000);display:flex;align-items:center;justify-content:center;padding:var(--mx-space-5, 24px);background:var(--mx-overlay, rgba(0, 0, 0, .45))}.panel{width:fit-content;min-width:280px;max-width:min(96vw,1200px);max-height:80vh;overflow-x:hidden;overflow-y:auto;padding:20px 22px;border-radius:var(--mx-radius-lg, 14px);background:var(--mx-surface, #fff);color:var(--mx-text, #101828);box-shadow:var(--mx-shadow-lg);font-family:var(--mx-font, inherit);animation:mx-dialog-in var(--mx-motion, .2s) var(--mx-ease, ease);box-sizing:border-box}.panel.content-panel{min-width:min(480px,92vw)}.panel.compact{max-width:min(360px,92vw)}.panel.wide{width:fit-content;max-width:min(96vw,1200px)}header{display:flex;align-items:flex-start;gap:10px}h2{margin:2px 0 0;font-size:1.2rem;line-height:1.3;overflow-wrap:anywhere}.message{margin:12px 0 0;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.5;color:var(--mx-text-muted, inherit)}.panel.success header{color:var(--mx-success)}.panel.warning header{color:var(--mx-warning)}.panel.error header{color:var(--mx-warn)}.panel.info header{color:var(--mx-primary)}.field{display:flex;flex-direction:column;gap:6px;margin-top:16px}.field input,.field textarea{width:100%;min-width:240px;box-sizing:border-box;border:1px solid var(--mx-border);border-radius:calc(var(--mx-radius, 10px) - 2px);padding:10px 12px;font:inherit;background:var(--mx-surface);color:var(--mx-text);resize:vertical}footer{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}button{border-radius:20px;padding:8px 18px;font:inherit;font-weight:500;cursor:pointer;min-height:36px;border:1px solid var(--mx-border);box-sizing:border-box}.ghost{border-color:var(--mx-border);background:transparent;color:var(--mx-primary)}.ghost:hover{background:color-mix(in srgb,var(--mx-primary) 8%,transparent);border-color:color-mix(in srgb,var(--mx-primary) 45%,var(--mx-border))}.confirm{border-color:var(--mx-primary);color:var(--mx-primary-contrast, #fff);background:var(--mx-primary)}.confirm:hover:not(:disabled){filter:brightness(1.06);border-color:var(--mx-primary)}.confirm:disabled{border-color:var(--mx-border)}.panel.success .confirm{background:var(--mx-success)}.panel.warning .confirm{background:var(--mx-warning)}.panel.error .confirm{background:var(--mx-warn)}.confirm:disabled{opacity:.5;cursor:default}@keyframes mx-dialog-in{0%{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}\n"] }]
    }], () => [{ type: MxNoticeService }], null); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(MxDialogHostComponent, { className: "MxDialogHostComponent", filePath: "lib/notice/mx-dialog-host.component.ts", lineNumber: 236 }); })();

class MxLoadingService {
    count = 0;
    loadingSubject = new BehaviorSubject(false);
    loading$ = this.loadingSubject.asObservable();
    show() {
        this.count += 1;
        this.loadingSubject.next(true);
    }
    hide() {
        this.count = Math.max(0, this.count - 1);
        if (this.count === 0)
            this.loadingSubject.next(false);
    }
    reset() {
        this.count = 0;
        this.loadingSubject.next(false);
    }
    static ɵfac = function MxLoadingService_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || MxLoadingService)(); };
    static ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: MxLoadingService, factory: MxLoadingService.ɵfac, providedIn: 'root' });
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(MxLoadingService, [{
        type: Injectable,
        args: [{ providedIn: 'root' }]
    }], null, null); })();

function MxSpinnerComponent_div_0_p_2_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "p");
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext(2);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r0.label);
} }
function MxSpinnerComponent_div_0_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 1);
    i0.ɵɵelement(1, "mat-spinner", 2);
    i0.ɵɵtemplate(2, MxSpinnerComponent_div_0_p_2_Template, 2, 1, "p", 3);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵclassProp("local", ctx_r0.mode === "local");
    i0.ɵɵadvance();
    i0.ɵɵproperty("diameter", ctx_r0.diameter);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r0.label);
} }
class MxSpinnerComponent {
    loading;
    /** fixed = full page, local = relative to positioned parent */
    mode = 'fixed';
    diameter = 50;
    label = '';
    constructor(loading) {
        this.loading = loading;
    }
    static ɵfac = function MxSpinnerComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || MxSpinnerComponent)(i0.ɵɵdirectiveInject(MxLoadingService)); };
    static ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: MxSpinnerComponent, selectors: [["mx-spinner"]], inputs: { mode: "mode", diameter: "diameter", label: "label" }, decls: 2, vars: 3, consts: [["class", "overlay", 3, "local", 4, "ngIf"], [1, "overlay"], [3, "diameter"], [4, "ngIf"]], template: function MxSpinnerComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵtemplate(0, MxSpinnerComponent_div_0_Template, 3, 4, "div", 0);
            i0.ɵɵpipe(1, "async");
        } if (rf & 2) {
            i0.ɵɵproperty("ngIf", i0.ɵɵpipeBind1(1, 1, ctx.loading.loading$));
        } }, dependencies: [CommonModule, i1.NgIf, i1.AsyncPipe, MatProgressSpinnerModule, i3.MatProgressSpinner], styles: [".overlay[_ngcontent-%COMP%]{position:fixed;inset:0;width:100vw;height:100vh;background:var(--mx-overlay-light);display:flex;flex-direction:column;justify-content:center;align-items:center;gap:12px;z-index:var(--mx-z-spinner, 9999)}.overlay.local[_ngcontent-%COMP%]{position:absolute;width:100%;height:100%}p[_ngcontent-%COMP%]{margin:0;color:var(--mx-text);font-family:var(--mx-font, inherit)}"] });
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(MxSpinnerComponent, [{
        type: Component,
        args: [{ selector: 'mx-spinner', standalone: true, imports: [CommonModule, MatProgressSpinnerModule], template: `
    <div class="overlay" *ngIf="loading.loading$ | async" [class.local]="mode === 'local'">
      <mat-spinner [diameter]="diameter"></mat-spinner>
      <p *ngIf="label">{{ label }}</p>
    </div>
  `, styles: [".overlay{position:fixed;inset:0;width:100vw;height:100vh;background:var(--mx-overlay-light);display:flex;flex-direction:column;justify-content:center;align-items:center;gap:12px;z-index:var(--mx-z-spinner, 9999)}.overlay.local{position:absolute;width:100%;height:100%}p{margin:0;color:var(--mx-text);font-family:var(--mx-font, inherit)}\n"] }]
    }], () => [{ type: MxLoadingService }], { mode: [{
            type: Input
        }], diameter: [{
            type: Input
        }], label: [{
            type: Input
        }] }); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(MxSpinnerComponent, { className: "MxSpinnerComponent", filePath: "lib/spinner/mx-spinner.component.ts", lineNumber: 44 }); })();

const _c0$6 = ["*"];
const _c1$3 = (a0, a1, a2) => [a0, a1, a2];
function MxButtonComponent_mat_icon_1_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "mat-icon", 4);
    i0.ɵɵtext(1, "autorenew");
    i0.ɵɵelementEnd();
} }
function MxButtonComponent_mat_icon_2_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "mat-icon", 5);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r0.icon);
} }
function MxButtonComponent_span_3_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "span", 6);
    i0.ɵɵprojection(1);
    i0.ɵɵelementEnd();
} }
/**
 * Drive-style actions — every non-link state keeps a visible 1px border.
 * - solid + primary  → filled primary (default)
 * - outline          → secondary / Cancel
 */
class MxButtonComponent {
    variant = 'solid';
    tone = 'primary';
    size = 'md';
    type = 'button';
    icon = '';
    iconOnly = false;
    block = false;
    disabled = false;
    loading = false;
    pressed = new EventEmitter();
    static ɵfac = function MxButtonComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || MxButtonComponent)(); };
    static ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: MxButtonComponent, selectors: [["mx-button"]], inputs: { variant: "variant", tone: "tone", size: "size", type: "type", icon: "icon", iconOnly: "iconOnly", block: "block", disabled: "disabled", loading: "loading" }, outputs: { pressed: "pressed" }, ngContentSelectors: _c0$6, decls: 4, vars: 14, consts: [[1, "mx-btn", 3, "click", "disabled", "ngClass"], ["class", "spin", 4, "ngIf"], ["class", "lead-icon", 4, "ngIf"], ["class", "label", 4, "ngIf"], [1, "spin"], [1, "lead-icon"], [1, "label"]], template: function MxButtonComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵprojectionDef();
            i0.ɵɵelementStart(0, "button", 0);
            i0.ɵɵlistener("click", function MxButtonComponent_Template_button_click_0_listener($event) { return ctx.pressed.emit($event); });
            i0.ɵɵtemplate(1, MxButtonComponent_mat_icon_1_Template, 2, 0, "mat-icon", 1)(2, MxButtonComponent_mat_icon_2_Template, 2, 1, "mat-icon", 2)(3, MxButtonComponent_span_3_Template, 2, 0, "span", 3);
            i0.ɵɵelementEnd();
        } if (rf & 2) {
            i0.ɵɵclassProp("block", ctx.block)("icon-only", ctx.iconOnly);
            i0.ɵɵproperty("disabled", ctx.disabled || ctx.loading)("ngClass", i0.ɵɵpureFunction3(10, _c1$3, ctx.variant, ctx.tone, ctx.size));
            i0.ɵɵattribute("type", ctx.type);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.loading);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", !ctx.loading && ctx.icon);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", !ctx.iconOnly);
        } }, dependencies: [CommonModule, i1.NgClass, i1.NgIf, MatIconModule, i2.MatIcon], styles: ["[_nghost-%COMP%]{display:inline-flex}.mx-btn[_ngcontent-%COMP%]{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:20px;border:1px solid #9aa0a6;box-sizing:border-box;font-family:var(--mx-font, inherit);font-weight:500;letter-spacing:.01em;cursor:pointer;box-shadow:none;background-color:transparent;transition:background-color var(--mx-motion-fast, .1s) var(--mx-ease, ease),border-color var(--mx-motion-fast, .1s) var(--mx-ease, ease),color var(--mx-motion-fast, .1s) var(--mx-ease, ease),filter var(--mx-motion-fast, .1s) var(--mx-ease, ease);white-space:nowrap}.mx-btn[_ngcontent-%COMP%]   .lead-icon[_ngcontent-%COMP%], .mx-btn[_ngcontent-%COMP%]   .spin[_ngcontent-%COMP%]{font-size:18px;width:18px;height:18px}.mx-btn[_ngcontent-%COMP%]:hover:not(:disabled){box-shadow:none}.mx-btn[_ngcontent-%COMP%]:active:not(:disabled){filter:brightness(.96)}.mx-btn[_ngcontent-%COMP%]:disabled{opacity:.45;cursor:default;box-shadow:none;border-color:#9aa0a6}.sm[_ngcontent-%COMP%]{height:32px;padding:0 14px;font-size:.8125rem}.md[_ngcontent-%COMP%]{height:36px;padding:0 18px;font-size:.875rem}.lg[_ngcontent-%COMP%]{height:40px;padding:0 22px;font-size:.9375rem}.icon-only.sm[_ngcontent-%COMP%]{width:32px;padding:0}.icon-only.md[_ngcontent-%COMP%]{width:36px;padding:0}.icon-only.lg[_ngcontent-%COMP%]{width:40px;padding:0}.block[_ngcontent-%COMP%]{width:100%}.solid.primary[_ngcontent-%COMP%]{background-color:var(--mx-primary);color:var(--mx-primary-contrast);border-color:color-mix(in srgb,var(--mx-primary) 65%,#000)}.solid.primary[_ngcontent-%COMP%]:hover:not(:disabled){filter:brightness(1.06);border-color:color-mix(in srgb,var(--mx-primary) 55%,#000)}.solid.primary[_ngcontent-%COMP%]:active:not(:disabled){filter:brightness(.94)}.solid.primary[_ngcontent-%COMP%]:disabled{border-color:color-mix(in srgb,var(--mx-primary) 45%,#5f6368)}.solid.success[_ngcontent-%COMP%]{background-color:var(--mx-success);color:#fff;border-color:color-mix(in srgb,var(--mx-success) 65%,#000)}.solid.warning[_ngcontent-%COMP%]{background-color:var(--mx-warning);color:#202124;border-color:color-mix(in srgb,var(--mx-warning) 55%,#000)}.solid.danger[_ngcontent-%COMP%]{background-color:var(--mx-warn);color:#fff;border-color:color-mix(in srgb,var(--mx-warn) 65%,#000)}.solid.neutral[_ngcontent-%COMP%], .solid.info[_ngcontent-%COMP%]{background-color:var(--mx-text);color:var(--mx-surface);border-color:color-mix(in srgb,var(--mx-text) 75%,#000)}.soft.primary[_ngcontent-%COMP%]{background-color:color-mix(in srgb,var(--mx-primary) 16%,var(--mx-surface));color:var(--mx-primary);border-color:color-mix(in srgb,var(--mx-primary) 55%,#9aa0a6)}.soft.primary[_ngcontent-%COMP%]:hover:not(:disabled){background-color:color-mix(in srgb,var(--mx-primary) 22%,var(--mx-surface));border-color:color-mix(in srgb,var(--mx-primary) 70%,#5f6368)}.soft.success[_ngcontent-%COMP%]{background-color:var(--mx-success-bg);color:var(--mx-success);border-color:var(--mx-success-border)}.soft.warning[_ngcontent-%COMP%]{background-color:var(--mx-warning-bg);color:var(--mx-warning);border-color:var(--mx-warning-border)}.soft.danger[_ngcontent-%COMP%]{background-color:var(--mx-error-bg);color:var(--mx-warn);border-color:var(--mx-error-border)}.soft.neutral[_ngcontent-%COMP%], .soft.info[_ngcontent-%COMP%]{background-color:color-mix(in srgb,var(--mx-text-muted) 14%,var(--mx-surface));color:var(--mx-text);border-color:#9aa0a6}.outline[_ngcontent-%COMP%]{background-color:transparent;border-color:color-mix(in srgb,var(--mx-primary) 50%,#9aa0a6);color:var(--mx-primary)}.outline[_ngcontent-%COMP%]:hover:not(:disabled){background-color:color-mix(in srgb,var(--mx-primary) 8%,transparent);border-color:var(--mx-primary)}.outline[_ngcontent-%COMP%]:active:not(:disabled){background-color:color-mix(in srgb,var(--mx-primary) 12%,transparent)}.outline.neutral[_ngcontent-%COMP%]{color:var(--mx-text);border-color:#9aa0a6}.outline.neutral[_ngcontent-%COMP%]:hover:not(:disabled){border-color:var(--mx-text-muted)}.outline.danger[_ngcontent-%COMP%]{border-color:color-mix(in srgb,var(--mx-warn) 65%,#9aa0a6);color:var(--mx-warn)}.outline.danger[_ngcontent-%COMP%]:hover:not(:disabled){border-color:var(--mx-warn);background-color:color-mix(in srgb,var(--mx-warn) 8%,transparent)}.ghost[_ngcontent-%COMP%]{background-color:transparent;color:var(--mx-text-muted);border-color:#9aa0a6}.ghost[_ngcontent-%COMP%]:hover:not(:disabled){background-color:color-mix(in srgb,var(--mx-text) 6%,transparent);border-color:var(--mx-text-muted);color:var(--mx-text)}.ghost.primary[_ngcontent-%COMP%]{color:var(--mx-primary);border-color:color-mix(in srgb,var(--mx-primary) 45%,#9aa0a6)}.ghost.primary[_ngcontent-%COMP%]:hover:not(:disabled){border-color:var(--mx-primary);background-color:color-mix(in srgb,var(--mx-primary) 8%,transparent)}.ghost.danger[_ngcontent-%COMP%]{color:var(--mx-warn);border-color:color-mix(in srgb,var(--mx-warn) 50%,#9aa0a6)}.ghost.danger[_ngcontent-%COMP%]:hover:not(:disabled){border-color:var(--mx-warn);background-color:color-mix(in srgb,var(--mx-warn) 8%,transparent)}.link[_ngcontent-%COMP%]{background-color:transparent;color:var(--mx-primary);padding-inline:4px;height:auto;text-decoration:underline;border-color:transparent;box-shadow:none}.link[_ngcontent-%COMP%]:hover:not(:disabled){border-color:color-mix(in srgb,var(--mx-primary) 35%,transparent)}.spin[_ngcontent-%COMP%]{animation:_ngcontent-%COMP%_mx-spin .8s linear infinite}@keyframes _ngcontent-%COMP%_mx-spin{to{transform:rotate(360deg)}}"] });
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(MxButtonComponent, [{
        type: Component,
        args: [{ selector: 'mx-button', standalone: true, imports: [CommonModule, MatIconModule], template: `
    <button
      class="mx-btn"
      [attr.type]="type"
      [disabled]="disabled || loading"
      [ngClass]="[variant, tone, size]"
      [class.block]="block"
      [class.icon-only]="iconOnly"
      (click)="pressed.emit($event)"
    >
      <mat-icon *ngIf="loading" class="spin">autorenew</mat-icon>
      <mat-icon *ngIf="!loading && icon" class="lead-icon">{{ icon }}</mat-icon>
      <span *ngIf="!iconOnly" class="label"><ng-content></ng-content></span>
    </button>
  `, styles: [":host{display:inline-flex}.mx-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:20px;border:1px solid #9aa0a6;box-sizing:border-box;font-family:var(--mx-font, inherit);font-weight:500;letter-spacing:.01em;cursor:pointer;box-shadow:none;background-color:transparent;transition:background-color var(--mx-motion-fast, .1s) var(--mx-ease, ease),border-color var(--mx-motion-fast, .1s) var(--mx-ease, ease),color var(--mx-motion-fast, .1s) var(--mx-ease, ease),filter var(--mx-motion-fast, .1s) var(--mx-ease, ease);white-space:nowrap}.mx-btn .lead-icon,.mx-btn .spin{font-size:18px;width:18px;height:18px}.mx-btn:hover:not(:disabled){box-shadow:none}.mx-btn:active:not(:disabled){filter:brightness(.96)}.mx-btn:disabled{opacity:.45;cursor:default;box-shadow:none;border-color:#9aa0a6}.sm{height:32px;padding:0 14px;font-size:.8125rem}.md{height:36px;padding:0 18px;font-size:.875rem}.lg{height:40px;padding:0 22px;font-size:.9375rem}.icon-only.sm{width:32px;padding:0}.icon-only.md{width:36px;padding:0}.icon-only.lg{width:40px;padding:0}.block{width:100%}.solid.primary{background-color:var(--mx-primary);color:var(--mx-primary-contrast);border-color:color-mix(in srgb,var(--mx-primary) 65%,#000)}.solid.primary:hover:not(:disabled){filter:brightness(1.06);border-color:color-mix(in srgb,var(--mx-primary) 55%,#000)}.solid.primary:active:not(:disabled){filter:brightness(.94)}.solid.primary:disabled{border-color:color-mix(in srgb,var(--mx-primary) 45%,#5f6368)}.solid.success{background-color:var(--mx-success);color:#fff;border-color:color-mix(in srgb,var(--mx-success) 65%,#000)}.solid.warning{background-color:var(--mx-warning);color:#202124;border-color:color-mix(in srgb,var(--mx-warning) 55%,#000)}.solid.danger{background-color:var(--mx-warn);color:#fff;border-color:color-mix(in srgb,var(--mx-warn) 65%,#000)}.solid.neutral,.solid.info{background-color:var(--mx-text);color:var(--mx-surface);border-color:color-mix(in srgb,var(--mx-text) 75%,#000)}.soft.primary{background-color:color-mix(in srgb,var(--mx-primary) 16%,var(--mx-surface));color:var(--mx-primary);border-color:color-mix(in srgb,var(--mx-primary) 55%,#9aa0a6)}.soft.primary:hover:not(:disabled){background-color:color-mix(in srgb,var(--mx-primary) 22%,var(--mx-surface));border-color:color-mix(in srgb,var(--mx-primary) 70%,#5f6368)}.soft.success{background-color:var(--mx-success-bg);color:var(--mx-success);border-color:var(--mx-success-border)}.soft.warning{background-color:var(--mx-warning-bg);color:var(--mx-warning);border-color:var(--mx-warning-border)}.soft.danger{background-color:var(--mx-error-bg);color:var(--mx-warn);border-color:var(--mx-error-border)}.soft.neutral,.soft.info{background-color:color-mix(in srgb,var(--mx-text-muted) 14%,var(--mx-surface));color:var(--mx-text);border-color:#9aa0a6}.outline{background-color:transparent;border-color:color-mix(in srgb,var(--mx-primary) 50%,#9aa0a6);color:var(--mx-primary)}.outline:hover:not(:disabled){background-color:color-mix(in srgb,var(--mx-primary) 8%,transparent);border-color:var(--mx-primary)}.outline:active:not(:disabled){background-color:color-mix(in srgb,var(--mx-primary) 12%,transparent)}.outline.neutral{color:var(--mx-text);border-color:#9aa0a6}.outline.neutral:hover:not(:disabled){border-color:var(--mx-text-muted)}.outline.danger{border-color:color-mix(in srgb,var(--mx-warn) 65%,#9aa0a6);color:var(--mx-warn)}.outline.danger:hover:not(:disabled){border-color:var(--mx-warn);background-color:color-mix(in srgb,var(--mx-warn) 8%,transparent)}.ghost{background-color:transparent;color:var(--mx-text-muted);border-color:#9aa0a6}.ghost:hover:not(:disabled){background-color:color-mix(in srgb,var(--mx-text) 6%,transparent);border-color:var(--mx-text-muted);color:var(--mx-text)}.ghost.primary{color:var(--mx-primary);border-color:color-mix(in srgb,var(--mx-primary) 45%,#9aa0a6)}.ghost.primary:hover:not(:disabled){border-color:var(--mx-primary);background-color:color-mix(in srgb,var(--mx-primary) 8%,transparent)}.ghost.danger{color:var(--mx-warn);border-color:color-mix(in srgb,var(--mx-warn) 50%,#9aa0a6)}.ghost.danger:hover:not(:disabled){border-color:var(--mx-warn);background-color:color-mix(in srgb,var(--mx-warn) 8%,transparent)}.link{background-color:transparent;color:var(--mx-primary);padding-inline:4px;height:auto;text-decoration:underline;border-color:transparent;box-shadow:none}.link:hover:not(:disabled){border-color:color-mix(in srgb,var(--mx-primary) 35%,transparent)}.spin{animation:mx-spin .8s linear infinite}@keyframes mx-spin{to{transform:rotate(360deg)}}\n"] }]
    }], null, { variant: [{
            type: Input
        }], tone: [{
            type: Input
        }], size: [{
            type: Input
        }], type: [{
            type: Input
        }], icon: [{
            type: Input
        }], iconOnly: [{
            type: Input
        }], block: [{
            type: Input
        }], disabled: [{
            type: Input
        }], loading: [{
            type: Input
        }], pressed: [{
            type: Output
        }] }); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(MxButtonComponent, { className: "MxButtonComponent", filePath: "lib/button/mx-button.component.ts", lineNumber: 254 }); })();

const _c0$5 = ["*", [["", "mxCardActions", ""]], [["", "mxCardFooter", ""]]];
const _c1$2 = ["*", "[mxCardActions]", "[mxCardFooter]"];
const _c2 = (a0, a1) => [a0, a1];
function MxCardComponent_header_1_h3_2_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "h3");
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext(2);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r0.title);
} }
function MxCardComponent_header_1_p_3_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "p");
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext(2);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r0.subtitle);
} }
function MxCardComponent_header_1_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "header", 4)(1, "div");
    i0.ɵɵtemplate(2, MxCardComponent_header_1_h3_2_Template, 2, 1, "h3", 5)(3, MxCardComponent_header_1_p_3_Template, 2, 1, "p", 5);
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(4, "div", 6);
    i0.ɵɵprojection(5, 1);
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵadvance(2);
    i0.ɵɵproperty("ngIf", ctx_r0.title);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r0.subtitle);
} }
function MxCardComponent_footer_4_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "footer", 7);
    i0.ɵɵprojection(1, 2);
    i0.ɵɵelementEnd();
} }
class MxCardComponent {
    title = '';
    subtitle = '';
    padding = 'md';
    elevation = 'elevated';
    clickable = false;
    hasFooter = false;
    static ɵfac = function MxCardComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || MxCardComponent)(); };
    static ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: MxCardComponent, selectors: [["mx-card"]], inputs: { title: "title", subtitle: "subtitle", padding: "padding", elevation: "elevation", clickable: "clickable", hasFooter: "hasFooter" }, ngContentSelectors: _c1$2, decls: 5, vars: 8, consts: [[1, "card", 3, "ngClass"], ["class", "head", 4, "ngIf"], [1, "body"], ["class", "foot", 4, "ngIf"], [1, "head"], [4, "ngIf"], [1, "actions"], [1, "foot"]], template: function MxCardComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵprojectionDef(_c0$5);
            i0.ɵɵelementStart(0, "section", 0);
            i0.ɵɵtemplate(1, MxCardComponent_header_1_Template, 6, 2, "header", 1);
            i0.ɵɵelementStart(2, "div", 2);
            i0.ɵɵprojection(3);
            i0.ɵɵelementEnd();
            i0.ɵɵtemplate(4, MxCardComponent_footer_4_Template, 2, 0, "footer", 3);
            i0.ɵɵelementEnd();
        } if (rf & 2) {
            i0.ɵɵclassProp("clickable", ctx.clickable);
            i0.ɵɵproperty("ngClass", i0.ɵɵpureFunction2(5, _c2, ctx.padding, ctx.elevation));
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.title || ctx.subtitle);
            i0.ɵɵadvance(3);
            i0.ɵɵproperty("ngIf", ctx.hasFooter);
        } }, dependencies: [CommonModule, i1.NgClass, i1.NgIf], styles: [".card[_ngcontent-%COMP%]{background:var(--mx-surface);color:var(--mx-text);border:1px solid var(--mx-border);border-radius:var(--mx-radius-lg, 14px);font-family:var(--mx-font, inherit)}.elevated[_ngcontent-%COMP%]{box-shadow:var(--mx-shadow);border-color:transparent}.flat[_ngcontent-%COMP%]{box-shadow:none}.clickable[_ngcontent-%COMP%]{cursor:pointer;transition:box-shadow var(--mx-motion-fast) var(--mx-ease)}.clickable[_ngcontent-%COMP%]:hover{box-shadow:var(--mx-shadow-lg)}.sm[_ngcontent-%COMP%]{padding:var(--mx-space-3, 12px)}.md[_ngcontent-%COMP%]{padding:var(--mx-space-4, 16px)}.lg[_ngcontent-%COMP%]{padding:var(--mx-space-5, 24px)}.head[_ngcontent-%COMP%]{display:flex;justify-content:space-between;gap:12px;margin-bottom:12px}h3[_ngcontent-%COMP%]{margin:0;font-size:1.05rem}p[_ngcontent-%COMP%]{margin:4px 0 0;color:var(--mx-text-muted);font-size:.875rem}.foot[_ngcontent-%COMP%]{margin-top:16px;padding-top:12px;border-top:1px solid var(--mx-border)}"] });
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(MxCardComponent, [{
        type: Component,
        args: [{ selector: 'mx-card', standalone: true, imports: [CommonModule], template: `
    <section class="card" [ngClass]="[padding, elevation]" [class.clickable]="clickable">
      <header *ngIf="title || subtitle" class="head">
        <div>
          <h3 *ngIf="title">{{ title }}</h3>
          <p *ngIf="subtitle">{{ subtitle }}</p>
        </div>
        <div class="actions"><ng-content select="[mxCardActions]"></ng-content></div>
      </header>
      <div class="body"><ng-content></ng-content></div>
      <footer *ngIf="hasFooter" class="foot"><ng-content select="[mxCardFooter]"></ng-content></footer>
    </section>
  `, styles: [".card{background:var(--mx-surface);color:var(--mx-text);border:1px solid var(--mx-border);border-radius:var(--mx-radius-lg, 14px);font-family:var(--mx-font, inherit)}.elevated{box-shadow:var(--mx-shadow);border-color:transparent}.flat{box-shadow:none}.clickable{cursor:pointer;transition:box-shadow var(--mx-motion-fast) var(--mx-ease)}.clickable:hover{box-shadow:var(--mx-shadow-lg)}.sm{padding:var(--mx-space-3, 12px)}.md{padding:var(--mx-space-4, 16px)}.lg{padding:var(--mx-space-5, 24px)}.head{display:flex;justify-content:space-between;gap:12px;margin-bottom:12px}h3{margin:0;font-size:1.05rem}p{margin:4px 0 0;color:var(--mx-text-muted);font-size:.875rem}.foot{margin-top:16px;padding-top:12px;border-top:1px solid var(--mx-border)}\n"] }]
    }], null, { title: [{
            type: Input
        }], subtitle: [{
            type: Input
        }], padding: [{
            type: Input
        }], elevation: [{
            type: Input
        }], clickable: [{
            type: Input
        }], hasFooter: [{
            type: Input
        }] }); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(MxCardComponent, { className: "MxCardComponent", filePath: "lib/card/mx-card.component.ts", lineNumber: 77 }); })();

const _c0$4 = ["*"];
const _c1$1 = (a0, a1) => [a0, a1];
/** Drive-style status / role chips with readable contrast on light and dark. */
class MxBadgeComponent {
    tone = 'neutral';
    size = 'md';
    pill = true;
    static ɵfac = function MxBadgeComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || MxBadgeComponent)(); };
    static ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: MxBadgeComponent, selectors: [["mx-badge"]], inputs: { tone: "tone", size: "size", pill: "pill" }, ngContentSelectors: _c0$4, decls: 2, vars: 6, consts: [[1, "badge", 3, "ngClass"]], template: function MxBadgeComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵprojectionDef();
            i0.ɵɵelementStart(0, "span", 0);
            i0.ɵɵprojection(1);
            i0.ɵɵelementEnd();
        } if (rf & 2) {
            i0.ɵɵclassProp("pill", ctx.pill);
            i0.ɵɵproperty("ngClass", i0.ɵɵpureFunction2(3, _c1$1, ctx.tone, ctx.size));
        } }, dependencies: [CommonModule, i1.NgClass], styles: [".badge[_ngcontent-%COMP%]{display:inline-flex;align-items:center;gap:4px;font-family:var(--mx-font, inherit);font-weight:500;line-height:1.2;border:1px solid var(--mx-border);white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}.sm[_ngcontent-%COMP%]{font-size:.6875rem;padding:2px 8px;border-radius:6px}.md[_ngcontent-%COMP%]{font-size:.75rem;padding:3px 10px;border-radius:8px}.lg[_ngcontent-%COMP%]{font-size:.8125rem;padding:4px 12px;border-radius:10px}.pill[_ngcontent-%COMP%]{border-radius:var(--mx-radius-full, 999px)}.neutral[_ngcontent-%COMP%]{background:color-mix(in srgb,var(--mx-text) 8%,var(--mx-surface-elevated));color:var(--mx-text);border-color:var(--mx-border)}.primary[_ngcontent-%COMP%], .info[_ngcontent-%COMP%]{background:color-mix(in srgb,var(--mx-primary) 16%,var(--mx-surface));color:var(--mx-primary);border-color:color-mix(in srgb,var(--mx-primary) 35%,var(--mx-border))}.success[_ngcontent-%COMP%]{background:var(--mx-success-bg);color:var(--mx-success);border-color:var(--mx-success-border)}.warning[_ngcontent-%COMP%]{background:var(--mx-warning-bg);color:color-mix(in srgb,var(--mx-warning) 70%,var(--mx-text));border-color:var(--mx-warning-border)}.danger[_ngcontent-%COMP%]{background:var(--mx-error-bg);color:var(--mx-warn);border-color:var(--mx-error-border)}"] });
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(MxBadgeComponent, [{
        type: Component,
        args: [{ selector: 'mx-badge', standalone: true, imports: [CommonModule], template: ` <span class="badge" [ngClass]="[tone, size]" [class.pill]="pill"><ng-content></ng-content></span> `, styles: [".badge{display:inline-flex;align-items:center;gap:4px;font-family:var(--mx-font, inherit);font-weight:500;line-height:1.2;border:1px solid var(--mx-border);white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}.sm{font-size:.6875rem;padding:2px 8px;border-radius:6px}.md{font-size:.75rem;padding:3px 10px;border-radius:8px}.lg{font-size:.8125rem;padding:4px 12px;border-radius:10px}.pill{border-radius:var(--mx-radius-full, 999px)}.neutral{background:color-mix(in srgb,var(--mx-text) 8%,var(--mx-surface-elevated));color:var(--mx-text);border-color:var(--mx-border)}.primary,.info{background:color-mix(in srgb,var(--mx-primary) 16%,var(--mx-surface));color:var(--mx-primary);border-color:color-mix(in srgb,var(--mx-primary) 35%,var(--mx-border))}.success{background:var(--mx-success-bg);color:var(--mx-success);border-color:var(--mx-success-border)}.warning{background:var(--mx-warning-bg);color:color-mix(in srgb,var(--mx-warning) 70%,var(--mx-text));border-color:var(--mx-warning-border)}.danger{background:var(--mx-error-bg);color:var(--mx-warn);border-color:var(--mx-error-border)}\n"] }]
    }], null, { tone: [{
            type: Input
        }], size: [{
            type: Input
        }], pill: [{
            type: Input
        }] }); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(MxBadgeComponent, { className: "MxBadgeComponent", filePath: "lib/badge/mx-badge.component.ts", lineNumber: 73 }); })();

const _c0$3 = ["*"];
function MxAlertComponent_strong_4_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "strong");
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r0.title);
} }
function MxAlertComponent_button_7_Template(rf, ctx) { if (rf & 1) {
    const _r2 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "button", 5);
    i0.ɵɵlistener("click", function MxAlertComponent_button_7_Template_button_click_0_listener() { i0.ɵɵrestoreView(_r2); const ctx_r0 = i0.ɵɵnextContext(); return i0.ɵɵresetView(ctx_r0.dismissed.emit()); });
    i0.ɵɵelementStart(1, "mat-icon");
    i0.ɵɵtext(2, "close");
    i0.ɵɵelementEnd()();
} }
class MxAlertComponent {
    tone = 'info';
    title = '';
    icon = '';
    dismissible = false;
    dismissed = new EventEmitter();
    get iconName() {
        if (this.icon)
            return this.icon;
        if (this.tone === 'success')
            return 'check_circle';
        if (this.tone === 'warning')
            return 'warning';
        if (this.tone === 'danger')
            return 'error';
        return 'info';
    }
    static ɵfac = function MxAlertComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || MxAlertComponent)(); };
    static ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: MxAlertComponent, selectors: [["mx-alert"]], inputs: { tone: "tone", title: "title", icon: "icon", dismissible: "dismissible" }, outputs: { dismissed: "dismissed" }, ngContentSelectors: _c0$3, decls: 8, vars: 4, consts: [["role", "status", 1, "alert", 3, "ngClass"], ["aria-hidden", "true"], [1, "content"], [4, "ngIf"], ["type", "button", "class", "close", "aria-label", "Dismiss", 3, "click", 4, "ngIf"], ["type", "button", "aria-label", "Dismiss", 1, "close", 3, "click"]], template: function MxAlertComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵprojectionDef();
            i0.ɵɵelementStart(0, "div", 0)(1, "mat-icon", 1);
            i0.ɵɵtext(2);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(3, "div", 2);
            i0.ɵɵtemplate(4, MxAlertComponent_strong_4_Template, 2, 1, "strong", 3);
            i0.ɵɵelementStart(5, "div");
            i0.ɵɵprojection(6);
            i0.ɵɵelementEnd()();
            i0.ɵɵtemplate(7, MxAlertComponent_button_7_Template, 3, 0, "button", 4);
            i0.ɵɵelementEnd();
        } if (rf & 2) {
            i0.ɵɵproperty("ngClass", ctx.tone);
            i0.ɵɵadvance(2);
            i0.ɵɵtextInterpolate(ctx.iconName);
            i0.ɵɵadvance(2);
            i0.ɵɵproperty("ngIf", ctx.title);
            i0.ɵɵadvance(3);
            i0.ɵɵproperty("ngIf", ctx.dismissible);
        } }, dependencies: [CommonModule, i1.NgClass, i1.NgIf, MatIconModule, i2.MatIcon], styles: [".alert[_ngcontent-%COMP%]{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border-radius:var(--mx-radius, 10px);border:1px solid transparent;font-family:var(--mx-font, inherit)}.content[_ngcontent-%COMP%]{flex:1;min-width:0}strong[_ngcontent-%COMP%]{display:block;margin-bottom:2px}.close[_ngcontent-%COMP%]{border:0;background:transparent;color:inherit;cursor:pointer;line-height:0;padding:0}.neutral[_ngcontent-%COMP%], .info[_ngcontent-%COMP%]{background:color-mix(in srgb,var(--mx-primary) 10%,white);border-color:color-mix(in srgb,var(--mx-primary) 25%,white);color:var(--mx-primary)}.primary[_ngcontent-%COMP%]{background:color-mix(in srgb,var(--mx-primary) 12%,white);border-color:color-mix(in srgb,var(--mx-primary) 28%,white);color:var(--mx-primary)}.success[_ngcontent-%COMP%]{background:var(--mx-success-bg);border-color:var(--mx-success-border);color:var(--mx-success)}.warning[_ngcontent-%COMP%]{background:var(--mx-warning-bg);border-color:var(--mx-warning-border);color:var(--mx-warning)}.danger[_ngcontent-%COMP%]{background:var(--mx-error-bg);border-color:var(--mx-error-border);color:var(--mx-warn)}"] });
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(MxAlertComponent, [{
        type: Component,
        args: [{ selector: 'mx-alert', standalone: true, imports: [CommonModule, MatIconModule], template: `
    <div class="alert" [ngClass]="tone" role="status">
      <mat-icon aria-hidden="true">{{ iconName }}</mat-icon>
      <div class="content">
        <strong *ngIf="title">{{ title }}</strong>
        <div><ng-content></ng-content></div>
      </div>
      <button *ngIf="dismissible" type="button" class="close" (click)="dismissed.emit()" aria-label="Dismiss">
        <mat-icon>close</mat-icon>
      </button>
    </div>
  `, styles: [".alert{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border-radius:var(--mx-radius, 10px);border:1px solid transparent;font-family:var(--mx-font, inherit)}.content{flex:1;min-width:0}strong{display:block;margin-bottom:2px}.close{border:0;background:transparent;color:inherit;cursor:pointer;line-height:0;padding:0}.neutral,.info{background:color-mix(in srgb,var(--mx-primary) 10%,white);border-color:color-mix(in srgb,var(--mx-primary) 25%,white);color:var(--mx-primary)}.primary{background:color-mix(in srgb,var(--mx-primary) 12%,white);border-color:color-mix(in srgb,var(--mx-primary) 28%,white);color:var(--mx-primary)}.success{background:var(--mx-success-bg);border-color:var(--mx-success-border);color:var(--mx-success)}.warning{background:var(--mx-warning-bg);border-color:var(--mx-warning-border);color:var(--mx-warning)}.danger{background:var(--mx-error-bg);border-color:var(--mx-error-border);color:var(--mx-warn)}\n"] }]
    }], null, { tone: [{
            type: Input
        }], title: [{
            type: Input
        }], icon: [{
            type: Input
        }], dismissible: [{
            type: Input
        }], dismissed: [{
            type: Output
        }] }); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(MxAlertComponent, { className: "MxAlertComponent", filePath: "lib/alert/mx-alert.component.ts", lineNumber: 78 }); })();

const _c0$2 = ["*"];
function MxEmptyStateComponent_mat_icon_1_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "mat-icon");
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r0.icon);
} }
function MxEmptyStateComponent_h3_2_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "h3");
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r0.title);
} }
function MxEmptyStateComponent_p_3_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "p");
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r0.description);
} }
class MxEmptyStateComponent {
    title = 'Nothing here yet';
    description = '';
    icon = 'inbox';
    compact = false;
    static ɵfac = function MxEmptyStateComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || MxEmptyStateComponent)(); };
    static ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: MxEmptyStateComponent, selectors: [["mx-empty-state"]], inputs: { title: "title", description: "description", icon: "icon", compact: "compact" }, ngContentSelectors: _c0$2, decls: 6, vars: 5, consts: [[1, "empty"], [4, "ngIf"], [1, "actions"]], template: function MxEmptyStateComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵprojectionDef();
            i0.ɵɵelementStart(0, "div", 0);
            i0.ɵɵtemplate(1, MxEmptyStateComponent_mat_icon_1_Template, 2, 1, "mat-icon", 1)(2, MxEmptyStateComponent_h3_2_Template, 2, 1, "h3", 1)(3, MxEmptyStateComponent_p_3_Template, 2, 1, "p", 1);
            i0.ɵɵelementStart(4, "div", 2);
            i0.ɵɵprojection(5);
            i0.ɵɵelementEnd()();
        } if (rf & 2) {
            i0.ɵɵclassProp("compact", ctx.compact);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.icon);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.title);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.description);
        } }, dependencies: [CommonModule, i1.NgIf, MatIconModule, i2.MatIcon], styles: [".empty[_ngcontent-%COMP%]{display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;padding:var(--mx-space-6, 32px);color:var(--mx-text-muted);font-family:var(--mx-font, inherit)}.compact[_ngcontent-%COMP%]{padding:var(--mx-space-4, 16px)}mat-icon[_ngcontent-%COMP%]{font-size:40px;width:40px;height:40px;color:var(--mx-primary);opacity:.85}h3[_ngcontent-%COMP%]{margin:4px 0 0;color:var(--mx-text);font-size:1.1rem}p[_ngcontent-%COMP%]{margin:0;max-width:420px;line-height:1.5}.actions[_ngcontent-%COMP%]{margin-top:8px}"] });
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(MxEmptyStateComponent, [{
        type: Component,
        args: [{ selector: 'mx-empty-state', standalone: true, imports: [CommonModule, MatIconModule], template: `
    <div class="empty" [class.compact]="compact">
      <mat-icon *ngIf="icon">{{ icon }}</mat-icon>
      <h3 *ngIf="title">{{ title }}</h3>
      <p *ngIf="description">{{ description }}</p>
      <div class="actions"><ng-content></ng-content></div>
    </div>
  `, styles: [".empty{display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;padding:var(--mx-space-6, 32px);color:var(--mx-text-muted);font-family:var(--mx-font, inherit)}.compact{padding:var(--mx-space-4, 16px)}mat-icon{font-size:40px;width:40px;height:40px;color:var(--mx-primary);opacity:.85}h3{margin:4px 0 0;color:var(--mx-text);font-size:1.1rem}p{margin:0;max-width:420px;line-height:1.5}.actions{margin-top:8px}\n"] }]
    }], null, { title: [{
            type: Input
        }], description: [{
            type: Input
        }], icon: [{
            type: Input
        }], compact: [{
            type: Input
        }] }); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(MxEmptyStateComponent, { className: "MxEmptyStateComponent", filePath: "lib/empty-state/mx-empty-state.component.ts", lineNumber: 55 }); })();

function MxTableSkeletonComponent_div_1_span_1_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "span", 5);
    i0.ɵɵelement(1, "span", 6);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const w_r1 = ctx.$implicit;
    const ctx_r1 = i0.ɵɵnextContext(2);
    i0.ɵɵstyleProp("flex", ctx_r1.flexFor(w_r1))("max-width", w_r1, "%");
} }
function MxTableSkeletonComponent_div_1_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 3);
    i0.ɵɵtemplate(1, MxTableSkeletonComponent_div_1_span_1_Template, 2, 4, "span", 4);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngForOf", ctx_r1.widths);
} }
function MxTableSkeletonComponent_div_2_span_1_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "span", 5);
    i0.ɵɵelement(1, "span", 8);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const w_r3 = ctx.$implicit;
    const i_r4 = ctx.index;
    const ctx_r1 = i0.ɵɵnextContext(2);
    i0.ɵɵstyleProp("flex", ctx_r1.flexFor(w_r3))("max-width", w_r3, "%");
    i0.ɵɵadvance();
    i0.ɵɵstyleProp("width", ctx_r1.barWidth(i_r4), "%")("animation-delay", ctx_r1.delayFor(i_r4), "ms");
} }
function MxTableSkeletonComponent_div_2_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 7);
    i0.ɵɵtemplate(1, MxTableSkeletonComponent_div_2_span_1_Template, 2, 8, "span", 4);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngForOf", ctx_r1.widths);
} }
/**
 * Placeholder table rows with shimmer bars for data-grid loading states.
 * Use standalone or via `mx-grid` `[loading]`.
 */
class MxTableSkeletonComponent {
    /** Number of columns (ignored when `columnWidths` is set). */
    columns = 5;
    /** Placeholder row count. */
    rows = 6;
    /** Optional per-column flex share / max width percentages. */
    columnWidths = null;
    showHeader = true;
    ariaLabel = 'Loading table';
    widths = [];
    rowSlots = [];
    ngOnInit() {
        this.syncSlots();
    }
    ngOnChanges(_changes) {
        this.syncSlots();
    }
    flexFor(width) {
        return `${width} 1 0`;
    }
    barWidth(colIndex) {
        const pattern = [72, 58, 84, 46, 66, 52, 78];
        return pattern[colIndex % pattern.length];
    }
    delayFor(colIndex) {
        return (colIndex % 5) * 80;
    }
    syncSlots() {
        if (this.columnWidths?.length) {
            this.widths = [...this.columnWidths];
        }
        else {
            const count = Math.max(1, Math.floor(this.columns) || 1);
            const each = Math.floor(100 / count);
            this.widths = Array.from({ length: count }, () => each);
        }
        const rowCount = Math.max(1, Math.floor(this.rows) || 1);
        this.rowSlots = Array.from({ length: rowCount }, (_, i) => i);
    }
    static ɵfac = function MxTableSkeletonComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || MxTableSkeletonComponent)(); };
    static ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: MxTableSkeletonComponent, selectors: [["mx-table-skeleton"]], inputs: { columns: "columns", rows: "rows", columnWidths: "columnWidths", showHeader: "showHeader", ariaLabel: "ariaLabel" }, features: [i0.ɵɵNgOnChangesFeature], decls: 3, vars: 3, consts: [["role", "status", "aria-live", "polite", "aria-busy", "true", 1, "mx-table-skeleton"], ["class", "sk-header", 4, "ngIf"], ["class", "sk-row", 4, "ngFor", "ngForOf"], [1, "sk-header"], ["class", "sk-cell", 3, "flex", "max-width", 4, "ngFor", "ngForOf"], [1, "sk-cell"], [1, "sk-bar", "sk-bar--header"], [1, "sk-row"], [1, "sk-bar"]], template: function MxTableSkeletonComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵelementStart(0, "div", 0);
            i0.ɵɵtemplate(1, MxTableSkeletonComponent_div_1_Template, 2, 1, "div", 1)(2, MxTableSkeletonComponent_div_2_Template, 2, 1, "div", 2);
            i0.ɵɵelementEnd();
        } if (rf & 2) {
            i0.ɵɵattribute("aria-label", ctx.ariaLabel);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.showHeader);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngForOf", ctx.rowSlots);
        } }, dependencies: [CommonModule, i1.NgForOf, i1.NgIf], styles: ["[_nghost-%COMP%]{display:block;width:100%}.mx-table-skeleton[_ngcontent-%COMP%]{width:100%;font-family:var(--mx-font, inherit)}.sk-header[_ngcontent-%COMP%], .sk-row[_ngcontent-%COMP%]{display:flex;align-items:center;gap:16px;padding:0 16px;min-height:52px;box-sizing:border-box}.sk-header[_ngcontent-%COMP%]{min-height:48px;background:color-mix(in srgb,var(--mx-primary, #0b5fff) 16%,var(--mx-surface, #fff));border-bottom:1px solid color-mix(in srgb,var(--mx-primary, #0b5fff) 28%,var(--mx-border, rgba(0, 0, 0, .08)))}.sk-row[_ngcontent-%COMP%]{border-bottom:1px solid var(--mx-border, rgba(0, 0, 0, .08))}.sk-row[_ngcontent-%COMP%]:last-child{border-bottom:0}.sk-cell[_ngcontent-%COMP%]{flex:1 1 0;min-width:0;display:flex;align-items:center}.sk-bar[_ngcontent-%COMP%]{display:block;height:12px;border-radius:6px;background:linear-gradient(90deg,color-mix(in srgb,var(--mx-text, #101828) 8%,var(--mx-surface, #fff)),color-mix(in srgb,var(--mx-text, #101828) 14%,var(--mx-surface, #fff)) 45%,color-mix(in srgb,var(--mx-text, #101828) 8%,var(--mx-surface, #fff)));background-size:200% 100%;animation:_ngcontent-%COMP%_mx-sk-shimmer 1.35s ease-in-out infinite}.sk-bar--header[_ngcontent-%COMP%]{height:10px;width:56%;opacity:.9;background:linear-gradient(90deg,color-mix(in srgb,var(--mx-primary, #0b5fff) 22%,var(--mx-surface, #fff)),color-mix(in srgb,var(--mx-primary, #0b5fff) 34%,var(--mx-surface, #fff)) 45%,color-mix(in srgb,var(--mx-primary, #0b5fff) 22%,var(--mx-surface, #fff)));background-size:200% 100%}@keyframes _ngcontent-%COMP%_mx-sk-shimmer{0%{background-position:100% 0}to{background-position:-100% 0}}@media(prefers-reduced-motion:reduce){.sk-bar[_ngcontent-%COMP%]{animation:none}}"] });
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(MxTableSkeletonComponent, [{
        type: Component,
        args: [{ selector: 'mx-table-skeleton', standalone: true, imports: [CommonModule], template: `
    <div
      class="mx-table-skeleton"
      role="status"
      aria-live="polite"
      aria-busy="true"
      [attr.aria-label]="ariaLabel"
    >
      <div class="sk-header" *ngIf="showHeader">
        <span
          class="sk-cell"
          *ngFor="let w of widths; let i = index"
          [style.flex]="flexFor(w)"
          [style.max-width.%]="w"
        >
          <span class="sk-bar sk-bar--header"></span>
        </span>
      </div>
      <div class="sk-row" *ngFor="let _ of rowSlots">
        <span
          class="sk-cell"
          *ngFor="let w of widths; let i = index"
          [style.flex]="flexFor(w)"
          [style.max-width.%]="w"
        >
          <span
            class="sk-bar"
            [style.width.%]="barWidth(i)"
            [style.animation-delay.ms]="delayFor(i)"
          ></span>
        </span>
      </div>
    </div>
  `, styles: [":host{display:block;width:100%}.mx-table-skeleton{width:100%;font-family:var(--mx-font, inherit)}.sk-header,.sk-row{display:flex;align-items:center;gap:16px;padding:0 16px;min-height:52px;box-sizing:border-box}.sk-header{min-height:48px;background:color-mix(in srgb,var(--mx-primary, #0b5fff) 16%,var(--mx-surface, #fff));border-bottom:1px solid color-mix(in srgb,var(--mx-primary, #0b5fff) 28%,var(--mx-border, rgba(0, 0, 0, .08)))}.sk-row{border-bottom:1px solid var(--mx-border, rgba(0, 0, 0, .08))}.sk-row:last-child{border-bottom:0}.sk-cell{flex:1 1 0;min-width:0;display:flex;align-items:center}.sk-bar{display:block;height:12px;border-radius:6px;background:linear-gradient(90deg,color-mix(in srgb,var(--mx-text, #101828) 8%,var(--mx-surface, #fff)),color-mix(in srgb,var(--mx-text, #101828) 14%,var(--mx-surface, #fff)) 45%,color-mix(in srgb,var(--mx-text, #101828) 8%,var(--mx-surface, #fff)));background-size:200% 100%;animation:mx-sk-shimmer 1.35s ease-in-out infinite}.sk-bar--header{height:10px;width:56%;opacity:.9;background:linear-gradient(90deg,color-mix(in srgb,var(--mx-primary, #0b5fff) 22%,var(--mx-surface, #fff)),color-mix(in srgb,var(--mx-primary, #0b5fff) 34%,var(--mx-surface, #fff)) 45%,color-mix(in srgb,var(--mx-primary, #0b5fff) 22%,var(--mx-surface, #fff)));background-size:200% 100%}@keyframes mx-sk-shimmer{0%{background-position:100% 0}to{background-position:-100% 0}}@media(prefers-reduced-motion:reduce){.sk-bar{animation:none}}\n"] }]
    }], null, { columns: [{
            type: Input
        }], rows: [{
            type: Input
        }], columnWidths: [{
            type: Input
        }], showHeader: [{
            type: Input
        }], ariaLabel: [{
            type: Input
        }] }); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(MxTableSkeletonComponent, { className: "MxTableSkeletonComponent", filePath: "lib/table-skeleton/mx-table-skeleton.component.ts", lineNumber: 124 }); })();

const _c0$1 = ["*"];
function MxPageHeaderComponent_p_2_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "p", 5);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r0.eyebrow);
} }
function MxPageHeaderComponent_p_5_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "p", 6);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r0.subtitle);
} }
class MxPageHeaderComponent {
    title;
    subtitle = '';
    eyebrow = '';
    bordered = true;
    static ɵfac = function MxPageHeaderComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || MxPageHeaderComponent)(); };
    static ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: MxPageHeaderComponent, selectors: [["mx-page-header"]], inputs: { title: "title", subtitle: "subtitle", eyebrow: "eyebrow", bordered: "bordered" }, ngContentSelectors: _c0$1, decls: 8, vars: 5, consts: [[1, "page-header"], [1, "text"], ["class", "eyebrow", 4, "ngIf"], ["class", "subtitle", 4, "ngIf"], [1, "actions"], [1, "eyebrow"], [1, "subtitle"]], template: function MxPageHeaderComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵprojectionDef();
            i0.ɵɵelementStart(0, "header", 0)(1, "div", 1);
            i0.ɵɵtemplate(2, MxPageHeaderComponent_p_2_Template, 2, 1, "p", 2);
            i0.ɵɵelementStart(3, "h1");
            i0.ɵɵtext(4);
            i0.ɵɵelementEnd();
            i0.ɵɵtemplate(5, MxPageHeaderComponent_p_5_Template, 2, 1, "p", 3);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(6, "div", 4);
            i0.ɵɵprojection(7);
            i0.ɵɵelementEnd()();
        } if (rf & 2) {
            i0.ɵɵclassProp("bordered", ctx.bordered);
            i0.ɵɵadvance(2);
            i0.ɵɵproperty("ngIf", ctx.eyebrow);
            i0.ɵɵadvance(2);
            i0.ɵɵtextInterpolate(ctx.title);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.subtitle);
        } }, dependencies: [CommonModule, i1.NgIf], styles: [".page-header[_ngcontent-%COMP%]{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:var(--mx-space-5, 24px);font-family:var(--mx-font, inherit)}.bordered[_ngcontent-%COMP%]{padding-bottom:16px;border-bottom:1px solid var(--mx-border)}.eyebrow[_ngcontent-%COMP%]{margin:0 0 4px;color:var(--mx-primary);font-size:.75rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase}h1[_ngcontent-%COMP%]{margin:0;font-size:clamp(1.4rem,2vw,1.75rem);color:var(--mx-text);font-family:var(--mx-font-display, var(--mx-font))}.subtitle[_ngcontent-%COMP%]{margin:6px 0 0;color:var(--mx-text-muted);max-width:60ch}.actions[_ngcontent-%COMP%]{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.actions[_ngcontent-%COMP%]     mx-button:first-of-type .mx-btn{min-width:8.5rem;height:36px;box-sizing:border-box;background-color:var(--mx-primary)!important;color:var(--mx-primary-contrast, #fff)!important;border-color:color-mix(in srgb,var(--mx-primary) 65%,#000)!important}.actions[_ngcontent-%COMP%]     mx-button:first-of-type .mx-btn:hover:not(:disabled){filter:brightness(1.06);border-color:color-mix(in srgb,var(--mx-primary) 55%,#000)!important}.actions[_ngcontent-%COMP%]     mx-button:first-of-type .mx-btn:active:not(:disabled){filter:brightness(.94)}.actions[_ngcontent-%COMP%]     mx-button:not(:first-of-type) .mx-btn{min-width:8.5rem;height:36px;box-sizing:border-box;background-color:transparent!important;color:var(--mx-primary)!important;border-color:color-mix(in srgb,var(--mx-primary) 50%,#9aa0a6)!important;filter:none}.actions[_ngcontent-%COMP%]     mx-button:not(:first-of-type) .mx-btn:hover:not(:disabled){background-color:color-mix(in srgb,var(--mx-primary) 8%,transparent)!important;border-color:var(--mx-primary)!important;filter:none}"] });
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(MxPageHeaderComponent, [{
        type: Component,
        args: [{ selector: 'mx-page-header', standalone: true, imports: [CommonModule], template: `
    <header class="page-header" [class.bordered]="bordered">
      <div class="text">
        <p *ngIf="eyebrow" class="eyebrow">{{ eyebrow }}</p>
        <h1>{{ title }}</h1>
        <p *ngIf="subtitle" class="subtitle">{{ subtitle }}</p>
      </div>
      <div class="actions"><ng-content></ng-content></div>
    </header>
  `, styles: [".page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:var(--mx-space-5, 24px);font-family:var(--mx-font, inherit)}.bordered{padding-bottom:16px;border-bottom:1px solid var(--mx-border)}.eyebrow{margin:0 0 4px;color:var(--mx-primary);font-size:.75rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase}h1{margin:0;font-size:clamp(1.4rem,2vw,1.75rem);color:var(--mx-text);font-family:var(--mx-font-display, var(--mx-font))}.subtitle{margin:6px 0 0;color:var(--mx-text-muted);max-width:60ch}.actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.actions ::ng-deep mx-button:first-of-type .mx-btn{min-width:8.5rem;height:36px;box-sizing:border-box;background-color:var(--mx-primary)!important;color:var(--mx-primary-contrast, #fff)!important;border-color:color-mix(in srgb,var(--mx-primary) 65%,#000)!important}.actions ::ng-deep mx-button:first-of-type .mx-btn:hover:not(:disabled){filter:brightness(1.06);border-color:color-mix(in srgb,var(--mx-primary) 55%,#000)!important}.actions ::ng-deep mx-button:first-of-type .mx-btn:active:not(:disabled){filter:brightness(.94)}.actions ::ng-deep mx-button:not(:first-of-type) .mx-btn{min-width:8.5rem;height:36px;box-sizing:border-box;background-color:transparent!important;color:var(--mx-primary)!important;border-color:color-mix(in srgb,var(--mx-primary) 50%,#9aa0a6)!important;filter:none}.actions ::ng-deep mx-button:not(:first-of-type) .mx-btn:hover:not(:disabled){background-color:color-mix(in srgb,var(--mx-primary) 8%,transparent)!important;border-color:var(--mx-primary)!important;filter:none}\n"] }]
    }], null, { title: [{
            type: Input,
            args: [{ required: true }]
        }], subtitle: [{
            type: Input
        }], eyebrow: [{
            type: Input
        }], bordered: [{
            type: Input
        }] }); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(MxPageHeaderComponent, { className: "MxPageHeaderComponent", filePath: "lib/page-header/mx-page-header.component.ts", lineNumber: 97 }); })();

const _c0 = ["*", [["", "mxGridActions", ""]], [["", "mxGridFooter", ""]]];
const _c1 = ["*", "[mxGridActions]", "[mxGridFooter]"];
function MxGridComponent_div_1_label_1_Template(rf, ctx) { if (rf & 1) {
    const _r1 = i0.ɵɵgetCurrentView();
    i0.ɵɵelementStart(0, "label", 9)(1, "mat-icon", 10);
    i0.ɵɵtext(2, "search");
    i0.ɵɵelementEnd();
    i0.ɵɵelementStart(3, "input", 11);
    i0.ɵɵlistener("ngModelChange", function MxGridComponent_div_1_label_1_Template_input_ngModelChange_3_listener($event) { i0.ɵɵrestoreView(_r1); const ctx_r1 = i0.ɵɵnextContext(2); return i0.ɵɵresetView(ctx_r1.onFilter($event)); });
    i0.ɵɵelementEnd()();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext(2);
    i0.ɵɵadvance(3);
    i0.ɵɵproperty("placeholder", ctx_r1.filterPlaceholder)("ngModel", ctx_r1.filter)("disabled", ctx_r1.loading);
    i0.ɵɵattribute("aria-label", ctx_r1.filterPlaceholder);
} }
function MxGridComponent_div_1_div_2_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 12);
    i0.ɵɵprojection(1, 1);
    i0.ɵɵelementEnd();
} }
function MxGridComponent_div_1_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "div", 6);
    i0.ɵɵtemplate(1, MxGridComponent_div_1_label_1_Template, 4, 4, "label", 7)(2, MxGridComponent_div_1_div_2_Template, 2, 0, "div", 8);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r1.showFilter);
    i0.ɵɵadvance();
    i0.ɵɵproperty("ngIf", ctx_r1.hasToolbar);
} }
function MxGridComponent_mx_table_skeleton_3_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelement(0, "mx-table-skeleton", 13);
} if (rf & 2) {
    const ctx_r1 = i0.ɵɵnextContext();
    i0.ɵɵproperty("columns", ctx_r1.skeletonColumns)("rows", ctx_r1.skeletonRows)("columnWidths", ctx_r1.skeletonColumnWidths);
} }
function MxGridComponent_footer_6_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "footer", 14);
    i0.ɵɵprojection(1, 2);
    i0.ɵɵelementEnd();
} }
/**
 * Drive-style data grid shell.
 * Set `showFilter` to offer a search field that filters across projected table content
 * (consumers typically bind filterChange to MatTableDataSource.filter).
 * Set `loading` to show an in-grid table skeleton without destroying projected content.
 */
class MxGridComponent {
    /** Show Drive-style search box that filters grid text. */
    showFilter = false;
    filterPlaceholder = 'Search';
    filter = '';
    elevated = true;
    hasToolbar = false;
    hasFooter = false;
    /** When true, shows `mx-table-skeleton` and hides projected table content. */
    loading = false;
    skeletonColumns = 5;
    skeletonRows = 6;
    skeletonColumnWidths = null;
    filterChange = new EventEmitter();
    onFilter(value) {
        this.filter = value;
        this.filterChange.emit(value);
    }
    static ɵfac = function MxGridComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || MxGridComponent)(); };
    static ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: MxGridComponent, selectors: [["mx-grid"]], inputs: { showFilter: "showFilter", filterPlaceholder: "filterPlaceholder", filter: "filter", elevated: "elevated", hasToolbar: "hasToolbar", hasFooter: "hasFooter", loading: "loading", skeletonColumns: "skeletonColumns", skeletonRows: "skeletonRows", skeletonColumnWidths: "skeletonColumnWidths" }, outputs: { filterChange: "filterChange" }, ngContentSelectors: _c1, decls: 7, vars: 10, consts: [[1, "mx-grid"], ["class", "toolbar", 4, "ngIf"], [1, "body"], [3, "columns", "rows", "columnWidths", 4, "ngIf"], [1, "body-content"], ["class", "footer", 4, "ngIf"], [1, "toolbar"], ["class", "filter", 4, "ngIf"], ["class", "toolbar-actions", 4, "ngIf"], [1, "filter"], ["aria-hidden", "true", 1, "search-icon"], ["type", "search", 3, "ngModelChange", "placeholder", "ngModel", "disabled"], [1, "toolbar-actions"], [3, "columns", "rows", "columnWidths"], [1, "footer"]], template: function MxGridComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵprojectionDef(_c0);
            i0.ɵɵelementStart(0, "section", 0);
            i0.ɵɵtemplate(1, MxGridComponent_div_1_Template, 3, 2, "div", 1);
            i0.ɵɵelementStart(2, "div", 2);
            i0.ɵɵtemplate(3, MxGridComponent_mx_table_skeleton_3_Template, 1, 3, "mx-table-skeleton", 3);
            i0.ɵɵelementStart(4, "div", 4);
            i0.ɵɵprojection(5);
            i0.ɵɵelementEnd()();
            i0.ɵɵtemplate(6, MxGridComponent_footer_6_Template, 2, 0, "footer", 5);
            i0.ɵɵelementEnd();
        } if (rf & 2) {
            i0.ɵɵclassProp("elevated", ctx.elevated)("is-loading", ctx.loading);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.showFilter || ctx.hasToolbar);
            i0.ɵɵadvance(2);
            i0.ɵɵproperty("ngIf", ctx.loading);
            i0.ɵɵadvance();
            i0.ɵɵclassProp("is-loading", ctx.loading);
            i0.ɵɵattribute("aria-hidden", ctx.loading ? true : null);
            i0.ɵɵadvance(2);
            i0.ɵɵproperty("ngIf", ctx.hasFooter);
        } }, dependencies: [CommonModule, i1.NgIf, FormsModule, i2$1.DefaultValueAccessor, i2$1.NgControlStatus, i2$1.NgModel, MatIconModule, i2.MatIcon, MxTableSkeletonComponent], styles: ["mx-grid .mx-grid{display:flex;flex-direction:column;background:var(--mx-surface, #fff);border:1px solid var(--mx-border);border-radius:var(--mx-radius-lg, 12px);overflow:hidden;font-family:var(--mx-font, inherit)}mx-grid .mx-grid.elevated{border-color:transparent;box-shadow:var(--mx-shadow)}mx-grid .toolbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 16px;border-bottom:1px solid var(--mx-border);background:var(--mx-surface)}mx-grid .filter{display:flex;align-items:center;gap:10px;flex:1 1 220px;min-width:180px;max-width:420px;height:40px;padding:0 16px 0 14px;border-radius:24px;background:color-mix(in srgb,var(--mx-text) 6%,var(--mx-bg));border:1px solid transparent;transition:background var(--mx-motion-fast, .1s) var(--mx-ease, ease),border-color var(--mx-motion-fast, .1s) var(--mx-ease, ease),box-shadow var(--mx-motion-fast, .1s) var(--mx-ease, ease)}mx-grid .filter:focus-within{background:var(--mx-surface);border-color:var(--mx-primary);box-shadow:0 0 0 3px var(--mx-focus-ring)}mx-grid .search-icon{color:var(--mx-text-muted);font-size:20px;width:20px;height:20px}mx-grid .filter input{flex:1;min-width:0;border:0;outline:none;box-shadow:none;background:transparent;color:var(--mx-text);font:inherit;font-size:.875rem;-webkit-appearance:none;appearance:none}mx-grid .filter input:focus,mx-grid .filter input:focus-visible,mx-grid .filter input[type=search]:focus,mx-grid .filter input[type=search]:focus-visible{border:0!important;outline:none!important;box-shadow:none!important}mx-grid .filter input::placeholder{color:var(--mx-text-muted)}mx-grid .filter input:disabled{cursor:default;opacity:.7}mx-grid .toolbar-actions{display:flex;gap:8px;margin-left:auto;align-items:center}mx-grid .body{overflow:auto;position:relative;min-height:120px}mx-grid .body-content.is-loading{display:none}mx-grid .body table.mat-mdc-table,mx-grid .body table[mat-table]{width:100%;background:transparent}mx-grid .body .mat-mdc-header-row,mx-grid .body tr[mat-header-row]{background:color-mix(in srgb,var(--mx-primary) 16%,var(--mx-surface))!important}mx-grid .body .mat-mdc-row{background:transparent}mx-grid .body .mat-mdc-header-cell,mx-grid .body th[mat-header-cell]{background:color-mix(in srgb,var(--mx-primary) 16%,var(--mx-surface))!important;color:var(--mx-primary)!important;font-size:.875rem;font-weight:600;letter-spacing:.02em;border-bottom:1px solid color-mix(in srgb,var(--mx-primary) 28%,var(--mx-border))!important}mx-grid .body .mat-sort-header-arrow,mx-grid .body .mat-sort-header-arrow .mat-sort-header-stem,mx-grid .body .mat-sort-header-arrow .mat-sort-header-head{color:var(--mx-primary)!important}mx-grid .body .mat-mdc-cell{color:var(--mx-text);border-bottom-color:var(--mx-border)!important}mx-grid .body .mat-mdc-row:hover .mat-mdc-cell{background:color-mix(in srgb,var(--mx-primary) 6%,transparent)}mx-grid .footer{border-top:1px solid var(--mx-border);padding:4px 8px;background:var(--mx-surface)}mx-grid .footer .mat-mdc-paginator{background:transparent;color:var(--mx-text-muted)}\n"], encapsulation: 2 });
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(MxGridComponent, [{
        type: Component,
        args: [{ selector: 'mx-grid', standalone: true, imports: [CommonModule, FormsModule, MatIconModule, MxTableSkeletonComponent], encapsulation: ViewEncapsulation.None, template: `
    <section class="mx-grid" [class.elevated]="elevated" [class.is-loading]="loading">
      <div class="toolbar" *ngIf="showFilter || hasToolbar">
        <label class="filter" *ngIf="showFilter">
          <mat-icon class="search-icon" aria-hidden="true">search</mat-icon>
          <input
            type="search"
            [placeholder]="filterPlaceholder"
            [ngModel]="filter"
            (ngModelChange)="onFilter($event)"
            [attr.aria-label]="filterPlaceholder"
            [disabled]="loading"
          />
        </label>
        <div class="toolbar-actions" *ngIf="hasToolbar">
          <ng-content select="[mxGridActions]"></ng-content>
        </div>
      </div>
      <div class="body">
        <mx-table-skeleton
          *ngIf="loading"
          [columns]="skeletonColumns"
          [rows]="skeletonRows"
          [columnWidths]="skeletonColumnWidths"
        ></mx-table-skeleton>
        <div class="body-content" [class.is-loading]="loading" [attr.aria-hidden]="loading ? true : null">
          <ng-content></ng-content>
        </div>
      </div>
      <footer class="footer" *ngIf="hasFooter">
        <ng-content select="[mxGridFooter]"></ng-content>
      </footer>
    </section>
  `, styles: ["mx-grid .mx-grid{display:flex;flex-direction:column;background:var(--mx-surface, #fff);border:1px solid var(--mx-border);border-radius:var(--mx-radius-lg, 12px);overflow:hidden;font-family:var(--mx-font, inherit)}mx-grid .mx-grid.elevated{border-color:transparent;box-shadow:var(--mx-shadow)}mx-grid .toolbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 16px;border-bottom:1px solid var(--mx-border);background:var(--mx-surface)}mx-grid .filter{display:flex;align-items:center;gap:10px;flex:1 1 220px;min-width:180px;max-width:420px;height:40px;padding:0 16px 0 14px;border-radius:24px;background:color-mix(in srgb,var(--mx-text) 6%,var(--mx-bg));border:1px solid transparent;transition:background var(--mx-motion-fast, .1s) var(--mx-ease, ease),border-color var(--mx-motion-fast, .1s) var(--mx-ease, ease),box-shadow var(--mx-motion-fast, .1s) var(--mx-ease, ease)}mx-grid .filter:focus-within{background:var(--mx-surface);border-color:var(--mx-primary);box-shadow:0 0 0 3px var(--mx-focus-ring)}mx-grid .search-icon{color:var(--mx-text-muted);font-size:20px;width:20px;height:20px}mx-grid .filter input{flex:1;min-width:0;border:0;outline:none;box-shadow:none;background:transparent;color:var(--mx-text);font:inherit;font-size:.875rem;-webkit-appearance:none;appearance:none}mx-grid .filter input:focus,mx-grid .filter input:focus-visible,mx-grid .filter input[type=search]:focus,mx-grid .filter input[type=search]:focus-visible{border:0!important;outline:none!important;box-shadow:none!important}mx-grid .filter input::placeholder{color:var(--mx-text-muted)}mx-grid .filter input:disabled{cursor:default;opacity:.7}mx-grid .toolbar-actions{display:flex;gap:8px;margin-left:auto;align-items:center}mx-grid .body{overflow:auto;position:relative;min-height:120px}mx-grid .body-content.is-loading{display:none}mx-grid .body table.mat-mdc-table,mx-grid .body table[mat-table]{width:100%;background:transparent}mx-grid .body .mat-mdc-header-row,mx-grid .body tr[mat-header-row]{background:color-mix(in srgb,var(--mx-primary) 16%,var(--mx-surface))!important}mx-grid .body .mat-mdc-row{background:transparent}mx-grid .body .mat-mdc-header-cell,mx-grid .body th[mat-header-cell]{background:color-mix(in srgb,var(--mx-primary) 16%,var(--mx-surface))!important;color:var(--mx-primary)!important;font-size:.875rem;font-weight:600;letter-spacing:.02em;border-bottom:1px solid color-mix(in srgb,var(--mx-primary) 28%,var(--mx-border))!important}mx-grid .body .mat-sort-header-arrow,mx-grid .body .mat-sort-header-arrow .mat-sort-header-stem,mx-grid .body .mat-sort-header-arrow .mat-sort-header-head{color:var(--mx-primary)!important}mx-grid .body .mat-mdc-cell{color:var(--mx-text);border-bottom-color:var(--mx-border)!important}mx-grid .body .mat-mdc-row:hover .mat-mdc-cell{background:color-mix(in srgb,var(--mx-primary) 6%,transparent)}mx-grid .footer{border-top:1px solid var(--mx-border);padding:4px 8px;background:var(--mx-surface)}mx-grid .footer .mat-mdc-paginator{background:transparent;color:var(--mx-text-muted)}\n"] }]
    }], null, { showFilter: [{
            type: Input
        }], filterPlaceholder: [{
            type: Input
        }], filter: [{
            type: Input
        }], elevated: [{
            type: Input
        }], hasToolbar: [{
            type: Input
        }], hasFooter: [{
            type: Input
        }], loading: [{
            type: Input
        }], skeletonColumns: [{
            type: Input
        }], skeletonRows: [{
            type: Input
        }], skeletonColumnWidths: [{
            type: Input
        }], filterChange: [{
            type: Output
        }] }); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(MxGridComponent, { className: "MxGridComponent", filePath: "lib/grid/mx-grid.component.ts", lineNumber: 192 }); })();

function MxSelectComponent_span_1_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "span", 7);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r0.label);
} }
function MxSelectComponent_option_4_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "option", 8);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const ctx_r0 = i0.ɵɵnextContext();
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate(ctx_r0.placeholder);
} }
function MxSelectComponent_option_5_Template(rf, ctx) { if (rf & 1) {
    i0.ɵɵelementStart(0, "option", 9);
    i0.ɵɵtext(1);
    i0.ɵɵelementEnd();
} if (rf & 2) {
    const opt_r2 = ctx.$implicit;
    i0.ɵɵproperty("value", opt_r2.value)("disabled", !!opt_r2.disabled);
    i0.ɵɵadvance();
    i0.ɵɵtextInterpolate1(" ", opt_r2.label, " ");
} }
/** Drive-style filled dropdown (no floating outline label). */
class MxSelectComponent {
    label = '';
    placeholder = '';
    options = [];
    disabled = false;
    block = false;
    value = '';
    valueChange = new EventEmitter();
    onChangeFn = () => undefined;
    onTouchedFn = () => undefined;
    writeValue(value) {
        this.value = value ?? '';
    }
    registerOnChange(fn) {
        this.onChangeFn = fn;
    }
    registerOnTouched(fn) {
        this.onTouchedFn = fn;
    }
    setDisabledState(isDisabled) {
        this.disabled = isDisabled;
    }
    onChange(value) {
        this.value = value;
        this.onChangeFn(value);
        this.valueChange.emit(value);
    }
    onTouched() {
        this.onTouchedFn();
    }
    static ɵfac = function MxSelectComponent_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || MxSelectComponent)(); };
    static ɵcmp = /*@__PURE__*/ i0.ɵɵdefineComponent({ type: MxSelectComponent, selectors: [["mx-select"]], inputs: { label: "label", placeholder: "placeholder", options: "options", disabled: "disabled", block: "block", value: "value" }, outputs: { valueChange: "valueChange" }, features: [i0.ɵɵProvidersFeature([
                {
                    provide: NG_VALUE_ACCESSOR,
                    useExisting: forwardRef(() => MxSelectComponent),
                    multi: true,
                },
            ])], decls: 8, vars: 10, consts: [[1, "mx-select"], ["class", "label", 4, "ngIf"], [1, "control"], [3, "ngModelChange", "blur", "disabled", "ngModel"], ["value", "", "disabled", "", 4, "ngIf"], [3, "value", "disabled", 4, "ngFor", "ngForOf"], ["aria-hidden", "true", 1, "chevron"], [1, "label"], ["value", "", "disabled", ""], [3, "value", "disabled"]], template: function MxSelectComponent_Template(rf, ctx) { if (rf & 1) {
            i0.ɵɵelementStart(0, "label", 0);
            i0.ɵɵtemplate(1, MxSelectComponent_span_1_Template, 2, 1, "span", 1);
            i0.ɵɵelementStart(2, "div", 2)(3, "select", 3);
            i0.ɵɵlistener("ngModelChange", function MxSelectComponent_Template_select_ngModelChange_3_listener($event) { return ctx.onChange($event); })("blur", function MxSelectComponent_Template_select_blur_3_listener() { return ctx.onTouched(); });
            i0.ɵɵtemplate(4, MxSelectComponent_option_4_Template, 2, 1, "option", 4)(5, MxSelectComponent_option_5_Template, 2, 3, "option", 5);
            i0.ɵɵelementEnd();
            i0.ɵɵelementStart(6, "mat-icon", 6);
            i0.ɵɵtext(7, "expand_more");
            i0.ɵɵelementEnd()()();
        } if (rf & 2) {
            i0.ɵɵclassProp("disabled", ctx.disabled)("block", ctx.block);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.label);
            i0.ɵɵadvance(2);
            i0.ɵɵproperty("disabled", ctx.disabled)("ngModel", ctx.value);
            i0.ɵɵattribute("aria-label", ctx.label || ctx.placeholder);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngIf", ctx.placeholder);
            i0.ɵɵadvance();
            i0.ɵɵproperty("ngForOf", ctx.options);
        } }, dependencies: [CommonModule, i1.NgForOf, i1.NgIf, FormsModule, i2$1.NgSelectOption, i2$1.ɵNgSelectMultipleOption, i2$1.SelectControlValueAccessor, i2$1.NgControlStatus, i2$1.NgModel, MatIconModule, i2.MatIcon], styles: [".mx-select[_ngcontent-%COMP%]{display:inline-flex;flex-direction:column;gap:6px;font-family:var(--mx-font, inherit);min-width:160px}.mx-select.block[_ngcontent-%COMP%]{display:flex;width:100%}.label[_ngcontent-%COMP%]{font-size:.75rem;font-weight:500;color:var(--mx-text-muted);letter-spacing:.01em}.control[_ngcontent-%COMP%]{position:relative;display:flex;align-items:center}select[_ngcontent-%COMP%]{appearance:none;-webkit-appearance:none;width:100%;height:40px;padding:0 36px 0 14px;border:1px solid #9aa0a6;border-radius:8px;background:color-mix(in srgb,var(--mx-text) 4%,var(--mx-surface));color:var(--mx-text);font:inherit;font-size:.875rem;font-weight:500;cursor:pointer;transition:background var(--mx-motion-fast, .1s) var(--mx-ease, ease),border-color var(--mx-motion-fast, .1s) var(--mx-ease, ease),box-shadow var(--mx-motion-fast, .1s) var(--mx-ease, ease)}select[_ngcontent-%COMP%]:hover:not(:disabled){background:color-mix(in srgb,var(--mx-text) 7%,var(--mx-surface));border-color:#5f6368}select[_ngcontent-%COMP%]:focus{outline:none;background:var(--mx-surface);border-color:var(--mx-primary);box-shadow:0 0 0 3px var(--mx-focus-ring)}select[_ngcontent-%COMP%]:disabled{opacity:.55;cursor:default;border-color:var(--mx-border)}select[_ngcontent-%COMP%]   option[_ngcontent-%COMP%]{background:var(--mx-surface);color:var(--mx-text);font-weight:500;padding:10px 12px}.chevron[_ngcontent-%COMP%]{position:absolute;right:10px;pointer-events:none;color:var(--mx-text-muted);font-size:20px;width:20px;height:20px}select[_ngcontent-%COMP%]:focus + .chevron[_ngcontent-%COMP%]{color:var(--mx-primary)}.disabled[_ngcontent-%COMP%]{pointer-events:none}"] });
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(MxSelectComponent, [{
        type: Component,
        args: [{ selector: 'mx-select', standalone: true, imports: [CommonModule, FormsModule, MatIconModule], providers: [
                    {
                        provide: NG_VALUE_ACCESSOR,
                        useExisting: forwardRef(() => MxSelectComponent),
                        multi: true,
                    },
                ], template: `
    <label class="mx-select" [class.disabled]="disabled" [class.block]="block">
      <span class="label" *ngIf="label">{{ label }}</span>
      <div class="control">
        <select
          [disabled]="disabled"
          [ngModel]="value"
          (ngModelChange)="onChange($event)"
          (blur)="onTouched()"
          [attr.aria-label]="label || placeholder"
        >
          <option *ngIf="placeholder" value="" disabled>{{ placeholder }}</option>
          <option
            *ngFor="let opt of options"
            [value]="opt.value"
            [disabled]="!!opt.disabled"
          >
            {{ opt.label }}
          </option>
        </select>
        <mat-icon class="chevron" aria-hidden="true">expand_more</mat-icon>
      </div>
    </label>
  `, styles: [".mx-select{display:inline-flex;flex-direction:column;gap:6px;font-family:var(--mx-font, inherit);min-width:160px}.mx-select.block{display:flex;width:100%}.label{font-size:.75rem;font-weight:500;color:var(--mx-text-muted);letter-spacing:.01em}.control{position:relative;display:flex;align-items:center}select{appearance:none;-webkit-appearance:none;width:100%;height:40px;padding:0 36px 0 14px;border:1px solid #9aa0a6;border-radius:8px;background:color-mix(in srgb,var(--mx-text) 4%,var(--mx-surface));color:var(--mx-text);font:inherit;font-size:.875rem;font-weight:500;cursor:pointer;transition:background var(--mx-motion-fast, .1s) var(--mx-ease, ease),border-color var(--mx-motion-fast, .1s) var(--mx-ease, ease),box-shadow var(--mx-motion-fast, .1s) var(--mx-ease, ease)}select:hover:not(:disabled){background:color-mix(in srgb,var(--mx-text) 7%,var(--mx-surface));border-color:#5f6368}select:focus{outline:none;background:var(--mx-surface);border-color:var(--mx-primary);box-shadow:0 0 0 3px var(--mx-focus-ring)}select:disabled{opacity:.55;cursor:default;border-color:var(--mx-border)}select option{background:var(--mx-surface);color:var(--mx-text);font-weight:500;padding:10px 12px}.chevron{position:absolute;right:10px;pointer-events:none;color:var(--mx-text-muted);font-size:20px;width:20px;height:20px}select:focus+.chevron{color:var(--mx-primary)}.disabled{pointer-events:none}\n"] }]
    }], null, { label: [{
            type: Input
        }], placeholder: [{
            type: Input
        }], options: [{
            type: Input
        }], disabled: [{
            type: Input
        }], block: [{
            type: Input
        }], value: [{
            type: Input
        }], valueChange: [{
            type: Output
        }] }); })();
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassDebugInfo(MxSelectComponent, { className: "MxSelectComponent", filePath: "lib/select/mx-select.component.ts", lineNumber: 130 }); })();

/*
 * Public API Surface of @mesix/custom-control
 */
// Local CustomPackages / partial Ivy consumers need the JIT compiler available.

/**
 * Generated bundle index. Do not edit.
 */

export { MX_DIALOG_DATA, MxAlertComponent, MxBadgeComponent, MxButtonComponent, MxCardComponent, MxDialogHostComponent, MxDialogRef, MxEmptyStateComponent, MxGridComponent, MxLoadingService, MxNoticeService, MxPageHeaderComponent, MxSelectComponent, MxSpinnerComponent, MxTableSkeletonComponent, MxToastHostComponent };
//# sourceMappingURL=mesix-custom-control.mjs.map
