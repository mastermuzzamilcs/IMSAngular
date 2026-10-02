import { Injectable } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { firestore } from '../../firebase-config';
import {
  WorkflowStatusTransition,
  WorkflowTransitionOption,
} from '../Models/WorkflowStatusTransition';
import { RequestStatus, RequestType } from '../Models/WorkflowModel';

@Injectable({ providedIn: 'root' })
export class WorkflowTransitionService {
  private readonly topicName = 'workflow_status_transitions';
  private defaultsReady: Promise<void> | null = null;

  async getTransitions(): Promise<WorkflowStatusTransition[]> {
    await this.ensureDefaults();
    const snap = await getDocs(collection(firestore, this.topicName));
    return snap.docs.map((item) => this.map(item.id, item.data()));
  }

  async getNext(
    requestType: RequestType,
    fromStatus: RequestStatus,
  ): Promise<WorkflowTransitionOption[]> {
    const transitions = await this.getTransitions();
    const own = transitions.filter((item) => item.requestType === requestType);
    const source = own.length > 0 ? own : transitions.filter((item) => item.requestType === '');
    return source
      .filter((item) => item.fromStatus === fromStatus)
      .map((item) => ({ status: item.toStatus, label: item.label }));
  }

  async addTransition(transition: WorkflowStatusTransition): Promise<void> {
    await this.assertSingle(transition);
    await addDoc(collection(firestore, this.topicName), this.payload(transition));
  }

  async updateTransition(transition: WorkflowStatusTransition): Promise<void> {
    if (!transition.id) {
      return;
    }
    await this.assertSingle(transition);
    await setDoc(doc(firestore, this.topicName, transition.id), this.payload(transition));
  }

  async deleteTransition(id: string): Promise<void> {
    await deleteDoc(doc(firestore, this.topicName, id));
  }

  private payload(transition: WorkflowStatusTransition) {
    return {
      requestType: transition.requestType || '',
      fromStatus: transition.fromStatus,
      toStatus: transition.toStatus,
      label: transition.label,
    };
  }

  private map(id: string, data: Record<string, unknown>): WorkflowStatusTransition {
    return {
      id,
      requestType: (data['requestType'] || '') as RequestType | '',
      fromStatus: data['fromStatus'] as RequestStatus,
      toStatus: data['toStatus'] as RequestStatus,
      label: String(data['label'] || data['toStatus'] || ''),
    };
  }

  private async assertSingle(transition: WorkflowStatusTransition): Promise<void> {
    const snap = await getDocs(collection(firestore, this.topicName));
    const requestType = transition.requestType || '';
    const duplicate = snap.docs.find((item) => {
      const data = item.data();
      return (
        item.id !== transition.id &&
        (data['requestType'] || '') === requestType &&
        data['fromStatus'] === transition.fromStatus &&
        data['toStatus'] === transition.toStatus
      );
    });
    if (duplicate) {
      throw new Error('This status transition is already defined');
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
    for (const item of this.defaultTransitions()) {
      const existing = snap.docs.find((entry) => this.sameTransition(entry.data(), item));
      if (!existing) {
        await addDoc(collection(firestore, this.topicName), this.payload(item));
      }
    }
    for (const item of this.retiredTransferTransitions()) {
      const existing = snap.docs.find((entry) => this.sameTransition(entry.data(), item));
      if (existing) {
        await deleteDoc(existing.ref);
      }
    }
  }

  private sameTransition(data: Record<string, unknown>, item: WorkflowStatusTransition): boolean {
    return (
      (data['requestType'] || '') === (item.requestType || '') &&
      data['fromStatus'] === item.fromStatus &&
      data['toStatus'] === item.toStatus
    );
  }

  private defaultTransitions(): WorkflowStatusTransition[] {
    const generic: WorkflowStatusTransition[] = [
      {
        requestType: '',
        fromStatus: RequestStatus.Pending,
        toStatus: RequestStatus.Approved,
        label: 'Approve',
      },
      {
        requestType: '',
        fromStatus: RequestStatus.Pending,
        toStatus: RequestStatus.Rejected,
        label: 'Reject',
      },
    ];
    const transfer: WorkflowStatusTransition[] = [
      {
        requestType: RequestType.Transfer,
        fromStatus: RequestStatus.Pending,
        toStatus: RequestStatus.Approved,
        label: 'Approve',
      },
      {
        requestType: RequestType.Transfer,
        fromStatus: RequestStatus.Pending,
        toStatus: RequestStatus.Rejected,
        label: 'Reject',
      },
      {
        requestType: RequestType.Transfer,
        fromStatus: RequestStatus.Approved,
        toStatus: RequestStatus.Dispatched,
        label: 'Dispatched',
      },
      {
        requestType: RequestType.Transfer,
        fromStatus: RequestStatus.Approved,
        toStatus: RequestStatus.Rejected,
        label: 'Reject',
      },
      {
        requestType: RequestType.Transfer,
        fromStatus: RequestStatus.InProcess,
        toStatus: RequestStatus.Dispatched,
        label: 'Dispatched',
      },
      {
        requestType: RequestType.Transfer,
        fromStatus: RequestStatus.InProcess,
        toStatus: RequestStatus.Rejected,
        label: 'Reject',
      },
      {
        requestType: RequestType.Transfer,
        fromStatus: RequestStatus.Dispatched,
        toStatus: RequestStatus.InTransit,
        label: 'In Transit',
      },
      {
        requestType: RequestType.Transfer,
        fromStatus: RequestStatus.Dispatched,
        toStatus: RequestStatus.CourierReturned,
        label: 'Courier Returned',
      },
      {
        requestType: RequestType.Transfer,
        fromStatus: RequestStatus.InTransit,
        toStatus: RequestStatus.ArrivedAtStation,
        label: 'Arrived at Station',
      },
      {
        requestType: RequestType.Transfer,
        fromStatus: RequestStatus.InTransit,
        toStatus: RequestStatus.CourierReturned,
        label: 'Courier Returned',
      },
      {
        requestType: RequestType.Transfer,
        fromStatus: RequestStatus.ArrivedAtStation,
        toStatus: RequestStatus.Received,
        label: 'Received',
      },
    ];
    return [...generic, ...transfer];
  }

  private retiredTransferTransitions(): WorkflowStatusTransition[] {
    return [
      {
        requestType: RequestType.Transfer,
        fromStatus: RequestStatus.Approved,
        toStatus: RequestStatus.InProcess,
        label: 'In Process',
      },
      {
        requestType: RequestType.Transfer,
        fromStatus: RequestStatus.InTransit,
        toStatus: RequestStatus.Received,
        label: 'Received',
      },
    ];
  }
}
