import { Injectable } from '@angular/core';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../firebase-config';
import { RequestType, RequestTypeSetting } from '../Models/WorkflowModel';

@Injectable({ providedIn: 'root' })
export class RequestTypeService {
  private readonly topicName = 'RequestTypes';
  private defaultsReady: Promise<void> | null = null;
  private readonly settingsCache = new Map<RequestType, RequestTypeSetting>();
  private readonly settingsCachedAt = new Map<RequestType, number>();
  private readonly cacheDurationMs = 30_000;

  async getSettings(): Promise<RequestTypeSetting[]> {
    await this.ensureDefaults();
    const settings = await Promise.all(
      Object.values(RequestType).map(async (requestType) => this.readSetting(requestType)),
    );
    return settings;
  }

  async getSetting(requestType: RequestType): Promise<RequestTypeSetting> {
    await this.ensureDefaults();
    return this.readSetting(requestType);
  }

  async isAutoApprove(requestType: RequestType): Promise<boolean> {
    const setting = await this.getSetting(requestType);
    return setting.IS_Auto_Approve;
  }

  async setAutoApprove(requestType: RequestType, IS_Auto_Approve: boolean): Promise<void> {
    await this.ensureDefaults();
    await updateDoc(doc(firestore, this.topicName, requestType), { IS_Auto_Approve });
    const cached = this.settingsCache.get(requestType);
    if (cached) this.settingsCache.set(requestType, { ...cached, IS_Auto_Approve });
  }

  async setAssignedToSource(requestType: RequestType, assignedToSource: string): Promise<void> {
    await this.ensureDefaults();
    await updateDoc(doc(firestore, this.topicName, requestType), {
      assignedToSource: (assignedToSource || '').trim(),
    });
    const cached = this.settingsCache.get(requestType);
    if (cached)
      this.settingsCache.set(requestType, { ...cached, assignedToSource: assignedToSource.trim() });
  }

  ensureDefaults(): Promise<void> {
    if (!this.defaultsReady) {
      this.defaultsReady = this.writeDefaults().catch((error) => {
        this.defaultsReady = null;
        throw error;
      });
    }
    return this.defaultsReady;
  }

  private async readSetting(requestType: RequestType): Promise<RequestTypeSetting> {
    const cached = this.settingsCache.get(requestType);
    if (
      cached &&
      Date.now() - (this.settingsCachedAt.get(requestType) || 0) < this.cacheDurationMs
    ) {
      return cached;
    }
    const snap = await getDoc(doc(firestore, this.topicName, requestType));
    const data = snap.data() || {};
    const setting = {
      requestType,
      IS_Auto_Approve: data['IS_Auto_Approve'] === true,
      assignedToSource: String(data['assignedToSource'] || ''),
    };
    this.settingsCache.set(requestType, setting);
    this.settingsCachedAt.set(requestType, Date.now());
    return setting;
  }

  private async writeDefaults(): Promise<void> {
    const requestTypes = Object.values(RequestType);
    const snapshots = await Promise.all(
      requestTypes.map((requestType) => getDoc(doc(firestore, this.topicName, requestType))),
    );
    await Promise.all(
      requestTypes.map(async (requestType, index) => {
        if (snapshots[index].exists()) return;
        const ref = doc(firestore, this.topicName, requestType);
        await setDoc(ref, {
          requestType,
          IS_Auto_Approve: false,
          assignedToSource: '',
        });
      }),
    );
  }
}
