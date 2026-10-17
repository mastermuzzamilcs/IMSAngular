import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../../firebase-config';

const TITLE_KEY = 'ims.appTitle';
const LOGO_KEY = 'ims.appLogo';
const PAGE_SIZE_KEY = 'ims.pageSize';
const CURRENCY_NAME_KEY = 'ims.currencyName';
const CURRENCY_CODE_KEY = 'ims.currencyCode';

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 5;
export const DEFAULT_APP_TITLE = 'IMS';
export const DEFAULT_APP_LOGO = 'assets/logo.png';
export const DEFAULT_CURRENCY_NAME = 'Pakistani Rupee';
export const DEFAULT_CURRENCY_CODE = 'PKR';

@Injectable({ providedIn: 'root' })
export class AppSettingsService {
  private readonly titleSubject = new BehaviorSubject<string>(this.readTitle());
  private readonly logoSubject = new BehaviorSubject<string>(this.readLogo());
  private readonly pageSizeSubject = new BehaviorSubject<number>(this.readPageSize());
  private readonly currencyNameSubject = new BehaviorSubject<string>(this.readCurrencyName());
  private readonly currencyCodeSubject = new BehaviorSubject<string>(this.readCurrencyCode());

  readonly title$ = this.titleSubject.asObservable();
  readonly logo$ = this.logoSubject.asObservable();
  readonly pageSize$ = this.pageSizeSubject.asObservable();
  readonly currencyName$ = this.currencyNameSubject.asObservable();
  readonly currencyCode$ = this.currencyCodeSubject.asObservable();

  get title(): string {
    return this.titleSubject.value;
  }

  get logo(): string {
    return this.logoSubject.value;
  }

  get pageSize(): number {
    return this.pageSizeSubject.value;
  }

  get currencyName(): string {
    return this.currencyNameSubject.value;
  }
  get currencyCode(): string {
    return this.currencyCodeSubject.value;
  }

  async loadSharedCurrency(): Promise<void> {
    try {
      const snapshot = await getDoc(doc(firestore, 'SystemSettings', 'currency'));
      if (!snapshot.exists()) return;
      const value = snapshot.data();
      const name = typeof value['name'] === 'string' ? value['name'].trim() : '';
      const code = typeof value['code'] === 'string' ? value['code'].trim().toUpperCase() : '';
      if (name && /^[A-Z]{3}$/.test(code)) this.applyCurrency(name, code);
    } catch {
      /* Continue with the saved local/default currency if shared settings are unavailable. */
    }
  }

  async setCurrency(name: string, code: string): Promise<void> {
    const nextName = name.trim();
    const nextCode = code.trim().toUpperCase();
    await setDoc(
      doc(firestore, 'SystemSettings', 'currency'),
      { name: nextName, code: nextCode, updatedAt: new Date() },
      { merge: true },
    );
    this.applyCurrency(nextName, nextCode);
  }

  private applyCurrency(nextName: string, nextCode: string): void {
    localStorage.setItem(CURRENCY_NAME_KEY, nextName);
    localStorage.setItem(CURRENCY_CODE_KEY, nextCode);
    this.currencyNameSubject.next(nextName);
    this.currencyCodeSubject.next(nextCode);
  }

  formatCurrency(value: number, locale?: string): string {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: this.currencyCode,
      }).format(value);
    } catch {
      return `${this.currencyCode} ${value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }

  setTitle(title: string): void {
    const next = title.trim() || DEFAULT_APP_TITLE;
    localStorage.setItem(TITLE_KEY, next);
    this.titleSubject.next(next);
  }

  /** Stores the uploaded image as a data URL (bitmap bytes encoded for the browser). */
  setLogoDataUrl(dataUrl: string): void {
    const next = (dataUrl || '').trim() || DEFAULT_APP_LOGO;
    if (next === DEFAULT_APP_LOGO) {
      localStorage.removeItem(LOGO_KEY);
    } else {
      localStorage.setItem(LOGO_KEY, next);
    }
    this.logoSubject.next(next);
  }

  clearLogo(): void {
    localStorage.removeItem(LOGO_KEY);
    this.logoSubject.next(DEFAULT_APP_LOGO);
  }

  setPageSize(size: number): void {
    const next = PAGE_SIZE_OPTIONS.includes(size as (typeof PAGE_SIZE_OPTIONS)[number])
      ? size
      : DEFAULT_PAGE_SIZE;
    localStorage.setItem(PAGE_SIZE_KEY, String(next));
    this.pageSizeSubject.next(next);
  }

  private readTitle(): string {
    const stored = localStorage.getItem(TITLE_KEY);
    return stored?.trim() || DEFAULT_APP_TITLE;
  }

  private readLogo(): string {
    const stored = localStorage.getItem(LOGO_KEY);
    return stored?.trim() || DEFAULT_APP_LOGO;
  }

  private readPageSize(): number {
    const stored = Number(localStorage.getItem(PAGE_SIZE_KEY));
    return PAGE_SIZE_OPTIONS.includes(stored as (typeof PAGE_SIZE_OPTIONS)[number])
      ? stored
      : DEFAULT_PAGE_SIZE;
  }

  private readCurrencyName(): string {
    return localStorage.getItem(CURRENCY_NAME_KEY)?.trim() || DEFAULT_CURRENCY_NAME;
  }
  private readCurrencyCode(): string {
    const code = localStorage.getItem(CURRENCY_CODE_KEY)?.trim().toUpperCase();
    return code && /^[A-Z]{3}$/.test(code) ? code : DEFAULT_CURRENCY_CODE;
  }
}
