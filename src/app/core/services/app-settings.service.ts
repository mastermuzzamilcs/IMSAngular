import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { doc, getDoc, onSnapshot, setDoc, Unsubscribe } from 'firebase/firestore';
import { firestore } from '../../firebase-config';

const TITLE_KEY = 'ims.appTitle';
const LOGO_KEY = 'ims.appLogo';
const PAGE_SIZE_KEY = 'ims.pageSize';
const CURRENCY_NAME_KEY = 'ims.currencyName';
const CURRENCY_CODE_KEY = 'ims.currencyCode';
const SHARED_SETTINGS_PATH = ['SystemSettings', 'application'] as const;

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
  private sharedSettingsSubscription?: Unsubscribe;

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
      const reference = doc(firestore, ...SHARED_SETTINGS_PATH);
      const snapshot = await getDoc(reference);
      if (snapshot.exists()) {
        this.applySharedSettings(snapshot.data());
      } else {
        // Retain existing deployments' shared currency while the complete settings document is
        // first created by an authorized settings editor.
        const legacyCurrency = await getDoc(doc(firestore, 'SystemSettings', 'currency'));
        let currencyName = DEFAULT_CURRENCY_NAME;
        let currencyCode = DEFAULT_CURRENCY_CODE;
        if (legacyCurrency.exists()) {
          const value = legacyCurrency.data();
          const name = typeof value['name'] === 'string' ? value['name'].trim() : '';
          const code = typeof value['code'] === 'string' ? value['code'].trim().toUpperCase() : '';
          if (name && /^[A-Z]{3}$/.test(code)) {
            currencyName = name;
            currencyCode = code;
          }
        }
        this.applySharedSettings({
          title: DEFAULT_APP_TITLE,
          logo: DEFAULT_APP_LOGO,
          pageSize: DEFAULT_PAGE_SIZE,
          currencyName,
          currencyCode,
          soundEnabled: true,
          soundId: 'bell',
        });
      }
      this.sharedSettingsSubscription?.();
      this.sharedSettingsSubscription = onSnapshot(
        reference,
        (current) => {
          if (current.exists()) this.applySharedSettings(current.data());
        },
        (error) => console.error('Shared application settings could not be watched.', error),
      );
    } catch {
      /* Continue with saved local/default settings if shared settings are unavailable. */
    }
  }

  async saveSharedSettings(settings: {
    title: string;
    logo: string;
    pageSize: number;
    currencyName: string;
    currencyCode: string;
    soundEnabled: boolean;
    soundId: string;
  }): Promise<void> {
    const normalized = {
      title: settings.title.trim() || DEFAULT_APP_TITLE,
      logo: settings.logo || DEFAULT_APP_LOGO,
      pageSize: PAGE_SIZE_OPTIONS.includes(settings.pageSize as (typeof PAGE_SIZE_OPTIONS)[number])
        ? settings.pageSize
        : DEFAULT_PAGE_SIZE,
      currencyName: settings.currencyName.trim() || DEFAULT_CURRENCY_NAME,
      currencyCode: settings.currencyCode.trim().toUpperCase(),
      soundEnabled: settings.soundEnabled,
      soundId: settings.soundId,
      updatedAt: new Date(),
    };
    if (!/^[A-Z]{3}$/.test(normalized.currencyCode)) {
      throw new Error('Currency code must contain three letters.');
    }
    if (normalized.logo.length > 280_000) {
      throw new Error('The selected logo is too large to share. Choose an image under 200 KB.');
    }
    await setDoc(doc(firestore, ...SHARED_SETTINGS_PATH), normalized);
    this.applySharedSettings(normalized);
  }

  private applySharedSettings(data: Record<string, unknown>): void {
    const title = typeof data['title'] === 'string' ? data['title'].trim() : '';
    const logo = typeof data['logo'] === 'string' ? data['logo'].trim() : '';
    const pageSize = Number(data['pageSize']);
    const currencyName =
      typeof data['currencyName'] === 'string' ? data['currencyName'].trim() : '';
    const currencyCode =
      typeof data['currencyCode'] === 'string' ? data['currencyCode'].trim().toUpperCase() : '';
    if (title) {
      writeLocal(TITLE_KEY, title);
      this.titleSubject.next(title);
    }
    if (logo && logo.length <= 280_000) {
      localStorage.removeItem(LOGO_KEY);
      this.logoSubject.next(logo);
    }
    if (PAGE_SIZE_OPTIONS.includes(pageSize as (typeof PAGE_SIZE_OPTIONS)[number])) {
      writeLocal(PAGE_SIZE_KEY, String(pageSize));
      this.pageSizeSubject.next(pageSize);
    }
    if (currencyName && /^[A-Z]{3}$/.test(currencyCode)) {
      this.applyCurrency(currencyName, currencyCode);
    }
  }

  private applyCurrency(nextName: string, nextCode: string): void {
    writeLocal(CURRENCY_NAME_KEY, nextName);
    writeLocal(CURRENCY_CODE_KEY, nextCode);
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

function writeLocal(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    if (isQuotaError(error)) {
      localStorage.removeItem(LOGO_KEY);
      try {
        if (key !== LOGO_KEY) localStorage.setItem(key, value);
      } catch {
        /* Browser storage is full; keep the in-memory setting. */
      }
      return;
    }
    throw error;
  }
}

function isQuotaError(error: unknown): boolean {
  return (
    (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.code === 22)) ||
    (error instanceof Error && /quota/i.test(error.message))
  );
}
