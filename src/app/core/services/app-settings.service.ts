import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const TITLE_KEY = 'ims.appTitle';
const LOGO_KEY = 'ims.appLogo';
const PAGE_SIZE_KEY = 'ims.pageSize';

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 5;
export const DEFAULT_APP_TITLE = 'IMS';
export const DEFAULT_APP_LOGO = 'assets/logo.png';

@Injectable({ providedIn: 'root' })
export class AppSettingsService {
  private readonly titleSubject = new BehaviorSubject<string>(this.readTitle());
  private readonly logoSubject = new BehaviorSubject<string>(this.readLogo());
  private readonly pageSizeSubject = new BehaviorSubject<number>(this.readPageSize());

  readonly title$ = this.titleSubject.asObservable();
  readonly logo$ = this.logoSubject.asObservable();
  readonly pageSize$ = this.pageSizeSubject.asObservable();

  get title(): string {
    return this.titleSubject.value;
  }

  get logo(): string {
    return this.logoSubject.value;
  }

  get pageSize(): number {
    return this.pageSizeSubject.value;
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
}
