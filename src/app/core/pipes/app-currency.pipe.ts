import { CurrencyPipe } from '@angular/common';
import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';
import { AppSettingsService } from '../services/app-settings.service';

@Pipe({ name: 'appCurrency', standalone: true, pure: false })
export class AppCurrencyPipe implements PipeTransform {
  private readonly settings = inject(AppSettingsService);
  private readonly currencyPipe = new CurrencyPipe(inject(LOCALE_ID));

  transform(value: number | string | null | undefined, digitsInfo = '1.2-2'): string | null {
    if (value === null || value === undefined || value === '') return null;
    return this.currencyPipe.transform(Number(value), this.settings.currencyCode, 'symbol', digitsInfo);
  }
}
