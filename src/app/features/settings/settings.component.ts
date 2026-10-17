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
  private pendingLogo: string | null = null;

  constructor(
    private fb: FormBuilder,
    private settings: AppSettingsService,
    private sound: NotificationSoundService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving = true;
    try {
      await this.settings.setCurrency(value.currencyName, value.currencyCode);
      this.settings.setTitle(value.title);
      this.settings.setPageSize(Number(value.pageSize));
      if (this.pendingLogo !== null) {
        if (this.pendingLogo === DEFAULT_APP_LOGO) {
          this.settings.clearLogo();
        } else {
          this.settings.setLogoDataUrl(this.pendingLogo);
        }
        this.pendingLogo = null;
      }
      this.sound.setEnabled(!!value.soundEnabled);
      this.sound.setSound(value.soundId as NotificationSoundId, false);
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
