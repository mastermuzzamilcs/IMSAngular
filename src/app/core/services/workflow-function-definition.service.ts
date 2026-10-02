import { Injectable } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../firebase-config';
import { WorkflowFunctionRecord } from '../Models/WorkflowFunctionRecord';
import { businessFunctions, retiredFunctionCodes } from '../workflow/business-workflow';

@Injectable({ providedIn: 'root' })
export class WorkflowFunctionDefinitionService {
  private readonly topicName = 'workflow_function_definitions';
  private defaultsReady: Promise<void> | null = null;

  async getFunctions(): Promise<WorkflowFunctionRecord[]> {
    await this.ensureDefaults();
    const snap = await getDocs(collection(firestore, this.topicName));
    return snap.docs.map((item) => this.map(item.id, item.data()));
  }

  async getByCode(code: string): Promise<WorkflowFunctionRecord | null> {
    const functions = await this.getFunctions();
    return functions.find((item) => item.code === code) || null;
  }

  async addFunction(record: WorkflowFunctionRecord): Promise<void> {
    await this.assertCode(record);
    await addDoc(collection(firestore, this.topicName), this.payload(record));
  }

  async updateFunction(record: WorkflowFunctionRecord): Promise<void> {
    if (!record.id) {
      return;
    }
    await this.assertCode(record);
    await setDoc(doc(firestore, this.topicName, record.id), this.payload(record));
  }

  async deleteFunction(id: string): Promise<void> {
    await deleteDoc(doc(firestore, this.topicName, id));
  }

  private payload(record: WorkflowFunctionRecord) {
    return {
      code: record.code,
      name: record.name,
      className: record.className,
    };
  }

  private map(id: string, data: Record<string, unknown>): WorkflowFunctionRecord {
    return {
      id,
      code: String(data['code'] || ''),
      name: String(data['name'] || ''),
      className: String(data['className'] || ''),
    };
  }

  private async assertCode(record: WorkflowFunctionRecord): Promise<void> {
    const snap = await getDocs(collection(firestore, this.topicName));
    const duplicate = snap.docs.find(
      (item) => item.id !== record.id && item.data()['code'] === record.code,
    );
    if (duplicate) {
      throw new Error('A workflow function with this code already exists');
    }
  }

  private ensureDefaults(): Promise<void> {
    if (!this.defaultsReady) {
      this.defaultsReady = this.writeDefaults().catch((error) => {
        this.defaultsReady = null;
        throw error;
      });
    }
    return this.defaultsReady;
  }

  private async writeDefaults(): Promise<void> {
    const snap = await getDocs(collection(firestore, this.topicName));
    for (const item of businessFunctions) {
      const existing = snap.docs.find((entry) => entry.data()['code'] === item.code);
      if (!existing) {
        await addDoc(collection(firestore, this.topicName), this.payload(item));
        continue;
      }
      const data = existing.data();
      if (data['name'] !== item.name || data['className'] !== item.className) {
        await updateDoc(existing.ref, { name: item.name, className: item.className });
      }
    }
    for (const code of retiredFunctionCodes) {
      const existing = snap.docs.find((entry) => entry.data()['code'] === code);
      if (existing) {
        await deleteDoc(existing.ref);
      }
    }
  }
}
