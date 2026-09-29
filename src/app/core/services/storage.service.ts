import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  constructor() {}
  setItem(key: string, value: any): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Read
  getItem<T>(key: string): T | null {
    const data = localStorage.getItem(key);
    return data ? (JSON.parse(data) as T) : null;
  }

  // Delete
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  // Clear All
  clear(): void {
    localStorage.clear();
  }
}
