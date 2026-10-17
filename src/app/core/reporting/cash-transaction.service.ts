import { Injectable } from '@angular/core';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { firestore } from '../../firebase-config';
import { AuthService } from '../services/auth.service';

export type CashTransactionType =
  'Receipt' | 'Payment' | 'Other income' | 'Expense' | 'Owner contribution' | 'Owner withdrawal';
export interface CashTransactionInput {
  branchId: string;
  branchName: string;
  transactionDate: Date | string;
  type: CashTransactionType;
  amount: number;
  category: string;
  party?: string;
  reference?: string;
  notes?: string;
}

/** Explicit cash movements; sales/purchases alone are not treated as cash receipts/payments. */
@Injectable({ providedIn: 'root' })
export class CashTransactionService {
  private readonly collectionName = 'financial_cash_transactions';
  constructor(private auth: AuthService) {}

  async record(input: CashTransactionInput): Promise<void> {
    if (
      !input.branchId ||
      input.branchId === '0' ||
      !Number.isFinite(input.amount) ||
      input.amount <= 0
    )
      throw new Error('Choose a specific branch and enter an amount greater than zero.');
    const session = this.auth.currentSession();
    const allowed = session?.branches || [];
    if (!allowed.some((branch) => branch.branchid === '0' || branch.branchid === input.branchId))
      throw new Error('You do not have access to the selected branch.');
    await addDoc(collection(firestore, this.collectionName), {
      ...input,
      transactionDate: Timestamp.fromDate(new Date(input.transactionDate)),
      amount: Number(input.amount),
      category: input.category.trim(),
      party: input.party?.trim() || '',
      reference: input.reference?.trim() || '',
      notes: input.notes?.trim() || '',
      createdAt: Timestamp.now(),
      createdBy: session?.userid || '',
    });
  }
}
