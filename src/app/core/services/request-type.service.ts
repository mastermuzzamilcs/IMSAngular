import { Injectable } from '@angular/core';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../firebase-config';
import { RequestType, RequestTypeSetting } from '../Models/WorkflowModel';

@Injectable({ providedIn: 'root' })
export class RequestTypeService {
  private readonly topicName = 'RequestTypes';
  private defaultsReady: Promise<void> | null = null;

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
  }

  async setAssignedToSource(requestType: RequestType, assignedToSource: string): Promise<void> {
    await this.ensureDefaults();
    await updateDoc(doc(firestore, this.topicName, requestType), {
      assignedToSource: (assignedToSource || '').trim(),
    });
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
    const snap = await getDoc(doc(firestore, this.topicName, requestType));
    const data = snap.data() || {};
    return {
      requestType,
      IS_Auto_Approve: data['IS_Auto_Approve'] === true,
      assignedToSource: String(data['assignedToSource'] || ''),
    };
  }

  private async writeDefaults(): Promise<void> {
    for (const requestType of Object.values(RequestType)) {
      const ref = doc(firestore, this.topicName, requestType);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, {
          requestType,
          IS_Auto_Approve: false,
          assignedToSource: '',
        });
      }
    }
  }
}
