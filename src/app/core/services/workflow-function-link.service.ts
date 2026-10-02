import { Injectable } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../firebase-config';
import { WorkflowFunctionLink } from '../Models/WorkflowFunctionLink';
import { RequestStatus, RequestType } from '../Models/WorkflowModel';
import { businessLinks, retiredLinks } from '../workflow/business-workflow';

@Injectable({ providedIn: 'root' })
export class WorkflowFunctionLinkService {
  private readonly topicName = 'workflow_function_links';

  async getLinks(): Promise<WorkflowFunctionLink[]> {
    await this.ensureDefaults();
    const snap = await getDocs(collection(firestore, this.topicName));
    return snap.docs.map((item) => {
      const data = item.data();
      return {
        id: item.id,
        requestType: data['requestType'] as RequestType,
        status: data['status'] as RequestStatus,
        functionKey: data['functionKey'] || '',
        priority: Number(data['priority']) || 1,
      };
    });
  }

  async getForEvent(
    requestType: RequestType,
    status: RequestStatus,
  ): Promise<WorkflowFunctionLink[]> {
    const links = await this.getLinks();
    return links
      .filter((link) => link.requestType === requestType && link.status === status)
      .sort((left, right) => left.priority - right.priority);
  }

  async addLink(link: WorkflowFunctionLink): Promise<void> {
    await this.assertSingle(link);
    await addDoc(collection(firestore, this.topicName), this.payload(link));
  }

  async updateLink(link: WorkflowFunctionLink): Promise<void> {
    if (!link.id) {
      return;
    }
    await this.assertSingle(link);
    await setDoc(doc(firestore, this.topicName, link.id), this.payload(link));
  }

  async deleteLink(id: string): Promise<void> {
    await deleteDoc(doc(firestore, this.topicName, id));
  }

  private async assertSingle(link: WorkflowFunctionLink): Promise<void> {
    const snap = await getDocs(collection(firestore, this.topicName));
    const duplicate = snap.docs.find((item) => {
      const data = item.data();
      return (
        item.id !== link.id &&
        data['requestType'] === link.requestType &&
        data['status'] === link.status &&
        data['functionKey'] === link.functionKey
      );
    });
    if (duplicate) {
      throw new Error('This function is already associated with this request type and status');
    }
  }

  private payload(link: WorkflowFunctionLink) {
    return {
      requestType: link.requestType,
      status: link.status,
      functionKey: link.functionKey,
      priority: Number(link.priority) || 1,
    };
  }

  private defaultsReady: Promise<void> | null = null;

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
    for (const link of businessLinks) {
      const existing = snap.docs.find((item) => {
        const data = item.data();
        return (
          data['requestType'] === link.requestType &&
          data['status'] === link.status &&
          data['functionKey'] === link.functionKey
        );
      });
      if (!existing) {
        await addDoc(collection(firestore, this.topicName), this.payload(link));
        continue;
      }
      if (Number(existing.data()['priority']) !== link.priority) {
        await updateDoc(existing.ref, { priority: link.priority });
      }
    }
    for (const link of retiredLinks) {
      const existing = snap.docs.find((item) => {
        const data = item.data();
        return (
          data['requestType'] === link.requestType &&
          data['status'] === link.status &&
          data['functionKey'] === link.functionKey
        );
      });
      if (existing) {
        await deleteDoc(existing.ref);
      }
    }
  }
}
