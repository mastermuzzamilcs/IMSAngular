import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const SOUND_KEY = 'ims.notificationSound';

@Injectable({ providedIn: 'root' })
export class NotificationSoundService {
  private readonly enabledSubject = new BehaviorSubject(this.readEnabled());
  readonly enabled$ = this.enabledSubject.asObservable();
  private context?: AudioContext;

  get enabled(): boolean {
    return this.enabledSubject.value;
  }

  setEnabled(enabled: boolean): void {
    localStorage.setItem(SOUND_KEY, enabled ? '1' : '0');
    this.enabledSubject.next(enabled);
  }

  prime(): void {
    const context = this.audioContext();
    if (context?.state === 'suspended') {
      void context.resume();
    }
  }

  play(): void {
    if (!this.enabled) {
      return;
    }
    const context = this.audioContext();
    if (!context) {
      return;
    }
    if (context.state === 'suspended') {
      void context.resume();
    }
    const now = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    gain.connect(context.destination);
    [880, 1175].forEach((frequency, index) => {
      const tone = context.createOscillator();
      tone.type = 'sine';
      tone.frequency.value = frequency;
      tone.connect(gain);
      const start = now + index * 0.12;
      tone.start(start);
      tone.stop(start + 0.11);
    });
  }

  private audioContext(): AudioContext | undefined {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) {
      return undefined;
    }
    if (!this.context) {
      this.context = new Ctx();
    }
    return this.context;
  }

  private readEnabled(): boolean {
    return localStorage.getItem(SOUND_KEY) !== '0';
  }
}
