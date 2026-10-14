import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const SOUND_KEY = 'ims.notificationSound';
const SOUND_ID_KEY = 'ims.notificationSoundId';

export type NotificationSoundId = 'bell' | 'chime' | 'pop' | 'alert';

export const notificationSounds: { id: NotificationSoundId; label: string }[] = [
  { id: 'bell', label: 'Bell' },
  { id: 'chime', label: 'Chime' },
  { id: 'pop', label: 'Pop' },
  { id: 'alert', label: 'Alert' },
];

@Injectable({ providedIn: 'root' })
export class NotificationSoundService {
  private readonly enabledSubject = new BehaviorSubject(this.readEnabled());
  private readonly soundSubject = new BehaviorSubject<NotificationSoundId>(this.readSound());
  readonly enabled$ = this.enabledSubject.asObservable();
  readonly soundId$ = this.soundSubject.asObservable();
  private context?: AudioContext;

  get enabled(): boolean {
    return this.enabledSubject.value;
  }

  get soundId(): NotificationSoundId {
    return this.soundSubject.value;
  }

  setEnabled(enabled: boolean): void {
    localStorage.setItem(SOUND_KEY, enabled ? '1' : '0');
    this.enabledSubject.next(enabled);
  }

  setSound(id: NotificationSoundId, preview = false): void {
    localStorage.setItem(SOUND_ID_KEY, id);
    this.soundSubject.next(id);
    if (preview) {
      this.play(true);
    }
  }

  prime(): void {
    const context = this.audioContext();
    if (context?.state === 'suspended') {
      void context.resume();
    }
  }

  play(force = false): void {
    if (!force && !this.enabled) {
      return;
    }
    const context = this.audioContext();
    if (!context) {
      return;
    }
    void this.start(context);
  }

  private async start(context: AudioContext): Promise<void> {
    if (context.state === 'suspended') {
      await context.resume();
    }
    const sound = this.soundSubject.value;
    if (sound === 'chime') {
      this.playChime(context);
      return;
    }
    if (sound === 'pop') {
      this.playPop(context);
      return;
    }
    if (sound === 'alert') {
      this.playAlert(context);
      return;
    }
    this.playBell(context);
  }

  private playBell(context: AudioContext): void {
    const now = context.currentTime;
    const master = this.envelope(context, now, 0.18, 1.2);
    [523.25, 784, 1046.5].forEach((frequency, index) => {
      const tone = context.createOscillator();
      tone.type = 'sine';
      tone.frequency.value = frequency;
      const level = context.createGain();
      level.gain.value = index === 0 ? 0.7 : 0.22;
      tone.connect(level);
      level.connect(master);
      tone.start(now);
      tone.stop(now + 1.2);
    });
  }

  private playChime(context: AudioContext): void {
    const now = context.currentTime;
    const master = this.envelope(context, now, 0.12, 0.28);
    [880, 1175].forEach((frequency, index) => {
      const tone = context.createOscillator();
      tone.type = 'sine';
      tone.frequency.value = frequency;
      tone.connect(master);
      const start = now + index * 0.12;
      tone.start(start);
      tone.stop(start + 0.11);
    });
  }

  private playPop(context: AudioContext): void {
    const now = context.currentTime;
    const master = this.envelope(context, now, 0.2, 0.16);
    const tone = context.createOscillator();
    tone.type = 'triangle';
    tone.frequency.setValueAtTime(320, now);
    tone.frequency.exponentialRampToValueAtTime(140, now + 0.12);
    tone.connect(master);
    tone.start(now);
    tone.stop(now + 0.16);
  }

  private playAlert(context: AudioContext): void {
    const now = context.currentTime;
    const master = this.envelope(context, now, 0.14, 0.55);
    [660, 880, 990].forEach((frequency, index) => {
      const tone = context.createOscillator();
      tone.type = 'triangle';
      tone.frequency.value = frequency;
      tone.connect(master);
      const start = now + index * 0.14;
      tone.start(start);
      tone.stop(start + 0.12);
    });
  }

  private envelope(context: AudioContext, now: number, peak: number, duration: number): GainNode {
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    gain.connect(context.destination);
    return gain;
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

  private readSound(): NotificationSoundId {
    const stored = localStorage.getItem(SOUND_ID_KEY);
    return notificationSounds.some((sound) => sound.id === stored)
      ? (stored as NotificationSoundId)
      : 'bell';
  }
}
