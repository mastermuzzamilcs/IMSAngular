import { DestroyRef, Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PrivilegeRef } from './privilege-catalog';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[appPrivilege]',
  standalone: true,
})
export class PrivilegeDirective {
  private readonly template = inject(TemplateRef<unknown>);
  private readonly view = inject(ViewContainerRef);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private required: PrivilegeRef | null = null;

  constructor() {
    this.auth.session$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.render());
  }

  @Input() set appPrivilege(value: PrivilegeRef | null) {
    this.required = value;
    this.render();
  }

  private render(): void {
    this.view.clear();
    if (
      this.required &&
      this.auth.hasPrivilege(this.required.moduleId, this.required.functionId)
    ) {
      this.view.createEmbeddedView(this.template);
    }
  }
}
