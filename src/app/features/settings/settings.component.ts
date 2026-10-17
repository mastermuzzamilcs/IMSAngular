import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MxPageHeaderComponent } from '@mesix/custom-control';
import {
  notificationSounds,
  NotificationSoundId,
  NotificationSoundService,
} from '../../core/notifications/notification-sound.service';
import {
  AppSettingsService,
  DEFAULT_APP_LOGO,
  PAGE_SIZE_OPTIONS,
} from '../../core/services/app-settings.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { privileges } from '../../core/auth/privilege-catalog';
import { PrivilegeFunction } from '../../core/enums/privilege.enum';
import { PrivilegeDirective } from '../../core/auth/privilege.directive';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MxPageHeaderComponent,
    PrivilegeDirective,
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  readonly sounds = notificationSounds;
  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  form!: FormGroup;
  logoPreview = DEFAULT_APP_LOGO;
  saving = false;
  readonly privileges = privileges;
  canEdit = false;
  private pendingLogo: string | null = null;

  constructor(
    private fb: FormBuilder,
    private settings: AppSettingsService,
    private sound: NotificationSoundService,
    private toast: ToastService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.canEdit = this.auth.hasPrivilege(
      privileges.settings.edit.moduleId,
      PrivilegeFunction.Edit,
    );
    this.logoPreview = this.settings.logo;
    this.form = this.fb.group({
      title: [this.settings.title, [Validators.required, Validators.maxLength(60)]],
      pageSize: [this.settings.pageSize, Validators.required],
      soundEnabled: [this.sound.enabled],
      soundId: [this.sound.soundId],
      currencyName: [this.settings.currencyName, [Validators.required, Validators.maxLength(60)]],
      currencyCode: [
        this.settings.currencyCode,
        [Validators.required, Validators.pattern(/^[A-Za-z]{3}$/)],
      ],
    });
    if (!this.canEdit) this.form.disable();
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.toast.warning('Choose an image file', 3000);
      return;
    }
    if (file.size > 200 * 1024) {
      this.toast.warning(
        'Choose a logo smaller than 200 KB so it can be shared with everyone.',
        4000,
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      this.pendingLogo = dataUrl;
      this.logoPreview = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  clearLogo(): void {
    this.pendingLogo = DEFAULT_APP_LOGO;
    this.logoPreview = DEFAULT_APP_LOGO;
  }

  previewSound(): void {
    const id = this.form.get('soundId')?.value as NotificationSoundId;
    this.sound.setSound(id, true);
  }

  async save(): Promise<void> {
    if (!this.canEdit) {
      this.toast.error('You do not have permission to change application settings.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving = true;
    try {
      await this.settings.saveSharedSettings({
        title: value.title,
        logo: this.pendingLogo ?? this.settings.logo,
        pageSize: Number(value.pageSize),
        currencyName: value.currencyName,
        currencyCode: value.currencyCode,
        soundEnabled: !!value.soundEnabled,
        soundId: value.soundId as NotificationSoundId,
      });
      this.pendingLogo = null;
      this.toast.success('Settings saved', 2500);
    } catch (error) {
      this.toast.error(
        error instanceof Error
          ? `Settings could not be saved: ${error.message}`
          : 'Settings could not be saved.',
      );
    } finally {
      this.saving = false;
    }
  }
}
