import { Injectable } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { firestore } from '../../firebase-config';
import { ItemSource, ItemSourceParameter, ItemSourceStep } from '../item-sources/item-source.model';
import { CompareOperator } from '../item-sources/item-source-query';

@Injectable({ providedIn: 'root' })
export class ItemSourceService {
  private readonly topicName = 'ItemSources';

  async getSources(): Promise<ItemSource[]> {
    const snapshot = await getDocs(collection(firestore, this.topicName));
    return snapshot.docs
      .map((item) => this.mapSource(item.id, item.data()))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async addSource(source: ItemSource): Promise<void> {
    await this.assertCode(source);
    await addDoc(collection(firestore, this.topicName), this.payload(source));
  }

  async updateSource(source: ItemSource): Promise<void> {
    if (!source.id) {
      return;
    }
    await this.assertCode(source);
    await setDoc(doc(firestore, this.topicName, source.id), this.payload(source));
  }

  async deleteSource(id: string): Promise<void> {
    await deleteDoc(doc(firestore, this.topicName, id));
  }

  private async assertCode(source: ItemSource): Promise<void> {
    const code = source.code.trim();
    const sources = await this.getSources();
    if (sources.some((item) => item.code === code && item.id !== source.id)) {
      throw new Error(`Item source code "${code}" already exists.`);
    }
  }

  private payload(source: ItemSource) {
    return {
      code: source.code.trim(),
      name: source.name.trim(),
      parameters: source.parameters.map((parameter) => ({
        variableName: this.variableName(parameter.variableName),
        variableValue: parameter.variableValue.trim(),
      })),
      steps: (source.steps || []).map((step) => ({
        table: step.table.trim(),
        selectField: step.selectField.trim(),
        into: step.into.trim(),
        whereField: step.whereField.trim(),
        operator: step.operator,
        whereValue: step.whereValue.trim(),
      })),
      logic: source.logic.trim(),
      output: source.output.trim(),
    };
  }

  private variableName(value: string): string {
    const trimmed = value.trim();
    return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  }

  private mapSource(id: string, data: Record<string, unknown>): ItemSource {
    const parameters = Array.isArray(data['parameters']) ? data['parameters'] : [];
    const steps = Array.isArray(data['steps']) ? data['steps'] : [];
    return {
      id,
      code: String(data['code'] || ''),
      name: String(data['name'] || ''),
      parameters: parameters.map((parameter) => this.mapParameter(parameter)),
      steps: steps.map((step) => this.mapStep(step)),
      logic: String(data['logic'] || ''),
      output: String(data['output'] || ''),
    };
  }

  private mapStep(value: unknown): ItemSourceStep {
    const step = (value || {}) as Record<string, unknown>;
    return {
      table: String(step['table'] || ''),
      selectField: String(step['selectField'] || ''),
      into: String(step['into'] || ''),
      whereField: String(step['whereField'] || ''),
      operator: this.operator(step['operator']),
      whereValue: String(step['whereValue'] || ''),
    };
  }

  private operator(value: unknown): CompareOperator {
    const operator = String(value || '==');
    if (
      operator === '>' ||
      operator === '<' ||
      operator === '<>' ||
      operator === '>=' ||
      operator === '<='
    ) {
      return operator;
    }
    return '==';
  }

  private mapParameter(value: unknown): ItemSourceParameter {
    const parameter = (value || {}) as Record<string, unknown>;
    return {
      variableName: String(parameter['variableName'] || ''),
      variableValue: String(parameter['variableValue'] || ''),
    };
  }
}
