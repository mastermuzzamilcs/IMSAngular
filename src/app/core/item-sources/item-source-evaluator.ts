import { Injectable } from '@angular/core';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../firebase-config';
import { ItemSourceService } from '../services/item-source.service';
import { WorkflowFunctionContext } from '../workflow/workflow-action';
import { ItemSource, ItemSourceStep, resolveWorkflowValue } from './item-source.model';
import {
  canonicalEntity,
  compareValues,
  entityCollection,
  entityIdField,
  FieldRef,
  normalizeField,
  parseItemSourceLogic,
  ParsedItemSourceQuery,
  QueryCondition,
} from './item-source-query';

type Row = Record<string, string>;
type Combined = Record<string, Row>;

@Injectable({ providedIn: 'root' })
export class ItemSourceEvaluator {
  private readonly cache = new Map<string, Row[]>();

  constructor(private itemSourceService: ItemSourceService) {}

  async valuesFor(
    texts: string[],
    context: WorkflowFunctionContext,
  ): Promise<Record<string, string>> {
    this.cache.clear();
    const codes = new Set<string>();
    texts.forEach((text) => {
      for (const match of text.matchAll(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g)) {
        codes.add(match[1]);
      }
    });
    if (!codes.size) {
      return {};
    }
    const sources = await this.itemSourceService.getSources();
    const byCode = new Map(sources.map((source) => [source.code, source]));
    const values: Record<string, string> = {};
    for (const code of codes) {
      const source = byCode.get(code);
      if (!source) {
        continue;
      }
      values[code] = await this.evaluate(source, context);
    }
    return values;
  }

  private async evaluate(source: ItemSource, context: WorkflowFunctionContext): Promise<string> {
    try {
      if (source.steps?.length) {
        return await this.evaluateSteps(source, context);
      }
      if (!source.logic.trim()) {
        return '';
      }
      const query = parseItemSourceLogic(source.logic);
      const parameters = new Map<string, string>();
      source.parameters.forEach((parameter) => {
        const name = parameter.variableName.trim().replace(/^#/, '');
        if (!name) {
          return;
        }
        parameters.set(name, resolveWorkflowValue(parameter.variableValue, context));
      });
      const rows = await this.combine(query);
      const match = rows.find((row) => this.matches(row, query.where, parameters));
      return match ? this.outputValue(match, query) : '';
    } catch (error) {
      console.error(`Item source ${source.code} failed`, error);
      return '';
    }
  }

  private async evaluateSteps(
    source: ItemSource,
    context: WorkflowFunctionContext,
  ): Promise<string> {
    const parameters = new Map<string, string>();
    source.parameters.forEach((parameter) => {
      const name = parameter.variableName.trim().replace(/^#/, '');
      if (!name) {
        return;
      }
      parameters.set(name, resolveWorkflowValue(parameter.variableValue, context));
    });
    const locals = new Map<string, string>();
    let result = '';
    for (const step of source.steps) {
      const selected = await this.readStep(step, parameters, locals);
      if (step.into.trim().toLowerCase() === 'result') {
        result = selected;
        continue;
      }
      const name = step.into
        .trim()
        .replace(/^context\./i, '')
        .toLowerCase();
      if (name) {
        locals.set(name, selected);
      }
    }
    return result;
  }

  private async readStep(
    step: ItemSourceStep,
    parameters: Map<string, string>,
    locals: Map<string, string>,
  ): Promise<string> {
    const expected = this.stepValue(step.whereValue, parameters, locals);
    const whereText = step.whereValue.trim();
    const bound = whereText.startsWith('#') || whereText.toLowerCase().startsWith('context.');
    if (bound && expected === '') {
      return '';
    }
    const rows = await this.load(canonicalEntity(step.table));
    const whereKey = normalizeField(step.whereField);
    const selectKey = normalizeField(step.selectField);
    const match = rows.find((row) => compareValues(row[whereKey] || '', step.operator, expected));
    return match ? match[selectKey] || '' : '';
  }

  private stepValue(
    raw: string,
    parameters: Map<string, string>,
    locals: Map<string, string>,
  ): string {
    const text = raw.trim();
    if (text.startsWith('#')) {
      return this.parameter(parameters, text.slice(1));
    }
    if (text.toLowerCase().startsWith('context.')) {
      return locals.get(text.slice('context.'.length).toLowerCase()) || '';
    }
    return text;
  }

  private async combine(query: ParsedItemSourceQuery): Promise<Combined[]> {
    const fromRows = await this.load(query.from);
    if (!query.join) {
      return fromRows.map((row) => ({ [query.from]: row }));
    }
    const joinRows = await this.load(query.join.entity);
    const combined: Combined[] = [];
    fromRows.forEach((left) => {
      joinRows.forEach((right) => {
        const row: Combined = { [query.from]: left, [query.join!.entity]: right };
        const leftValue = this.read(row, query.join!.left);
        const rightValue = this.read(row, query.join!.right);
        if (leftValue !== '' && leftValue === rightValue) {
          combined.push(row);
        }
      });
    });
    return combined;
  }

  private matches(
    row: Combined,
    conditions: QueryCondition[],
    parameters: Map<string, string>,
  ): boolean {
    return conditions.every((condition) => {
      const actual = this.read(row, condition.field);
      const expected = condition.parameter
        ? this.parameter(parameters, condition.parameter)
        : condition.literal;
      if (condition.parameter && expected === '') {
        return false;
      }
      return compareValues(actual, condition.operator, expected);
    });
  }

  private parameter(parameters: Map<string, string>, name: string): string {
    if (parameters.has(name)) {
      return parameters.get(name) || '';
    }
    const lower = name.toLowerCase();
    for (const [key, value] of parameters) {
      if (key.toLowerCase() === lower) {
        return value;
      }
    }
    return '';
  }

  private outputValue(row: Combined, query: ParsedItemSourceQuery): string {
    const key = normalizeField(query.outputField);
    const fromRow = row[query.from];
    if (fromRow && key in fromRow) {
      return fromRow[key];
    }
    return this.read(row, { field: query.outputField });
  }

  private read(row: Combined, field: FieldRef): string {
    const key = normalizeField(field.field);
    if (field.entity) {
      return row[field.entity]?.[key] || '';
    }
    for (const side of Object.values(row)) {
      if (key in side) {
        return side[key];
      }
    }
    return '';
  }

  private async load(entity: string): Promise<Row[]> {
    const cached = this.cache.get(entity);
    if (cached) {
      return cached;
    }
    const snapshot = await getDocs(collection(firestore, entityCollection(entity)));
    const idField = entityIdField(entity);
    const rows = snapshot.docs.map((item) => this.mapRow(idField, item.id, item.data()));
    this.cache.set(entity, rows);
    return rows;
  }

  private mapRow(idField: string, id: string, data: Record<string, unknown>): Row {
    const row: Row = {};
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'passwordHash' || key === 'password') {
        return;
      }
      row[normalizeField(key)] = this.formatValue(value);
    });
    row['id'] = id;
    row[idField] = id;
    return row;
  }

  private formatValue(value: unknown): string {
    if (value == null) {
      return '';
    }
    if (typeof value === 'object' && value && 'toDate' in value) {
      const toDate = (value as { toDate?: () => Date }).toDate;
      if (typeof toDate === 'function') {
        return toDate.call(value).toISOString();
      }
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'object') {
      return '';
    }
    const text = String(value);
    if (text.startsWith('data:') || text.length > 500) {
      return '';
    }
    return text;
  }
}
