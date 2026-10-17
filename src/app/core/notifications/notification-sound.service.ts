import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const SOUND_KEY = 'ims.notificationSound';
const SOUND_ID_KEY = 'ims.notificationSoundId';

export type NotificationSoundId =
  | 'bell'
  | 'chime'
  | 'pop'
  | 'alert'
  | 'tritone'
  | 'note'
  | 'glass'
  | 'ping'
  | 'sosumi'
  | 'bloom'
  | 'chord'
  | 'message'
  | 'message-soft'
  | 'message-double';

export const notificationSounds: { id: NotificationSoundId; label: string }[] = [
  { id: 'bell', label: 'Bell' },
  { id: 'chime', label: 'Chime' },
  { id: 'pop', label: 'Pop' },
  { id: 'alert', label: 'Alert' },
  { id: 'tritone', label: 'Tri-tone (iPhone)' },
  { id: 'note', label: 'Note (iPhone)' },
  { id: 'glass', label: 'Glass (Mac)' },
  { id: 'ping', label: 'Ping (Mac)' },
  { id: 'sosumi', label: 'Sosumi (Mac)' },
  { id: 'bloom', label: 'Bloom (iPhone)' },
  { id: 'chord', label: 'Chord (iPhone)' },
  { id: 'message', label: 'Message (WhatsApp-style)' },
  { id: 'message-soft', label: 'Soft message (WhatsApp-style)' },
  { id: 'message-double', label: 'Double message (WhatsApp-style)' },
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
    switch (this.soundSubject.value) {
      case 'chime':
        this.playChime(context);
        return;
      case 'pop':
        this.playPop(context);
        return;
      case 'alert':
        this.playAlert(context);
        return;
      case 'tritone':
        this.playTriTone(context);
        return;
      case 'note':
        this.playNote(context);
        return;
      case 'glass':
        this.playGlass(context);
        return;
      case 'ping':
        this.playPing(context);
        return;
      case 'sosumi':
        this.playSosumi(context);
        return;
      case 'bloom':
        this.playBloom(context);
        return;
      case 'chord':
        this.playChord(context);
        return;
      case 'message':
        this.playMessage(context, false, false);
        return;
      case 'message-soft':
        this.playMessage(context, true, false);
        return;
      case 'message-double':
        this.playMessage(context, false, true);
        return;
      default:
        this.playBell(context);
    }
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

  /** Classic iPhone Tri-tone style ascending beeps. */
  private playTriTone(context: AudioContext): void {
    const now = context.currentTime;
    const notes = [987.77, 1318.51, 1567.98];
    notes.forEach((frequency, index) => {
      const start = now + index * 0.18;
      const master = this.envelope(context, start, 0.16, 0.16);
      const tone = context.createOscillator();
      tone.type = 'sine';
      tone.frequency.value = frequency;
      tone.connect(master);
      tone.start(start);
      tone.stop(start + 0.16);
    });
  }

  /** Soft two-note iPhone Note style. */
  private playNote(context: AudioContext): void {
    const now = context.currentTime;
    const master = this.envelope(context, now, 0.14, 0.55);
    [783.99, 1046.5].forEach((frequency, index) => {
      const tone = context.createOscillator();
      tone.type = 'triangle';
      tone.frequency.value = frequency;
      const level = context.createGain();
      level.gain.value = index === 0 ? 0.85 : 0.55;
      tone.connect(level);
      level.connect(master);
      const start = now + index * 0.16;
      tone.start(start);
      tone.stop(start + 0.28);
    });
  }

  /** Mac Glass / crystal ping with quick shimmer. */
  private playGlass(context: AudioContext): void {
    const now = context.currentTime;
    const master = this.envelope(context, now, 0.2, 0.9);
    [2093, 3135.96, 4186].forEach((frequency, index) => {
      const tone = context.createOscillator();
      tone.type = 'sine';
      tone.frequency.value = frequency;
      const level = context.createGain();
      level.gain.value = index === 0 ? 0.55 : 0.18;
      tone.connect(level);
      level.connect(master);
      tone.start(now);
      tone.stop(now + 0.9);
    });
  }

  /** Mac Ping — short bright blip. */
  private playPing(context: AudioContext): void {
    const now = context.currentTime;
    const master = this.envelope(context, now, 0.22, 0.35);
    const tone = context.createOscillator();
    tone.type = 'sine';
    tone.frequency.setValueAtTime(1480, now);
    tone.frequency.exponentialRampToValueAtTime(1180, now + 0.2);
    tone.connect(master);
    tone.start(now);
    tone.stop(now + 0.35);
  }

  /** Classic Mac Sosumi-style two-hit alert. */
  private playSosumi(context: AudioContext): void {
    const now = context.currentTime;
    [0, 0.14].forEach((offset, hit) => {
      const start = now + offset;
      const master = this.envelope(context, start, hit === 0 ? 0.18 : 0.14, 0.22);
      [392, 523.25, 659.25].forEach((frequency, index) => {
        const tone = context.createOscillator();
        tone.type = 'square';
        tone.frequency.value = frequency;
        const level = context.createGain();
        level.gain.value = 0.12 / (index + 1);
        tone.connect(level);
        level.connect(master);
        tone.start(start);
        tone.stop(start + 0.2);
      });
    });
  }

  /** Soft rising iPhone Bloom-like pad. */
  private playBloom(context: AudioContext): void {
    const now = context.currentTime;
    const master = this.envelope(context, now, 0.15, 0.85);
    [523.25, 659.25, 783.99, 987.77].forEach((frequency, index) => {
      const tone = context.createOscillator();
      tone.type = 'sine';
      tone.frequency.value = frequency;
      const level = context.createGain();
      level.gain.setValueAtTime(0.0001, now);
      level.gain.exponentialRampToValueAtTime(0.35, now + 0.05 + index * 0.05);
      level.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);
      tone.connect(level);
      level.connect(master);
      tone.start(now + index * 0.04);
      tone.stop(now + 0.85);
    });
  }

  /** Gentle major chord, iPhone Chord style. */
  private playChord(context: AudioContext): void {
    const now = context.currentTime;
    const master = this.envelope(context, now, 0.16, 0.7);
    [523.25, 659.25, 783.99].forEach((frequency) => {
      const tone = context.createOscillator();
      tone.type = 'triangle';
      tone.frequency.value = frequency;
      tone.connect(master);
      tone.start(now);
      tone.stop(now + 0.7);
    });
  }

  /** Original, synthesized short chat-message tones with a bright two-note cadence. */
  private playMessage(context: AudioContext, soft: boolean, double: boolean): void {
    const now = context.currentTime;
    const hits = double ? [0, 0.24] : [0];
    hits.forEach((offset, hitIndex) => {
      const start = now + offset;
      const duration = soft ? 0.23 : 0.18;
      const gain = soft ? 0.11 : 0.16;
      const master = this.envelope(context, start, gain, duration);
      const base = soft ? [659.25, 880] : [783.99, 1046.5];
      const frequencies = base.map((frequency) => double && hitIndex === 1 ? frequency * 0.9 : frequency);
      frequencies.forEach((frequency, index) => {
        const tone = context.createOscillator();
        tone.type = soft ? 'sine' : 'triangle';
        tone.frequency.setValueAtTime(frequency, start + index * (soft ? 0.055 : 0.045));
        const level = context.createGain();
        level.gain.value = index === 0 ? 0.8 : 0.55;
        tone.connect(level);
        level.connect(master);
        tone.start(start + index * (soft ? 0.055 : 0.045));
        tone.stop(start + duration);
      });
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
