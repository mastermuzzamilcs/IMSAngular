export interface FieldRef {
  entity?: string;
  field: string;
}

export type CompareOperator = '==' | '>' | '<' | '<>' | '>=' | '<=';

export const compareOperators: CompareOperator[] = ['==', '>', '<', '<>', '>=', '<='];

export interface QueryCondition {
  field: FieldRef;
  operator: CompareOperator;
  parameter?: string;
  literal: string;
}

export interface ParsedItemSourceQuery {
  outputField: string;
  from: string;
  join?: { entity: string; left: FieldRef; right: FieldRef };
  where: QueryCondition[];
}

interface EntityDef {
  collection: string;
  aliases: string[];
  idField: string;
}

const entities: Record<string, EntityDef> = {
  users: { collection: 'Users', aliases: ['user', 'users'], idField: 'userid' },
  requests: {
    collection: 'workflow_requests',
    aliases: ['request', 'requests'],
    idField: 'requestid',
  },
  customers: {
    collection: 'Sys_Customers',
    aliases: ['customer', 'customers'],
    idField: 'customerid',
  },
  products: { collection: 'Sys_Products', aliases: ['product', 'products'], idField: 'productid' },
  branches: { collection: 'Branches', aliases: ['branch', 'branches'], idField: 'branchid' },
  vendors: { collection: 'Sys_Vendors', aliases: ['vendor', 'vendors'], idField: 'vendorid' },
  brands: { collection: 'Sys_Brands', aliases: ['brand', 'brands'], idField: 'brandid' },
  transfers: { collection: 'Transfers', aliases: ['transfer', 'transfers'], idField: 'transferid' },
};

const fieldAliases: Record<string, string> = {
  username: 'name',
  requestedby: 'requestedby',
};

const logicPattern =
  /^fetch (.+?) from ([a-zA-Z_]+)(?: join ([a-zA-Z_]+)(?: on (.+?) (?:==|=) (.+?))?)?(?: where (.+))?$/i;
const conditionPattern = /^(.+?)\s*(<>|>=|<=|==|>|<|=)\s*(.+)$/;

export function entityCollection(entity: string): string {
  return entities[entity].collection;
}

export function entityIdField(entity: string): string {
  return entities[entity].idField;
}

export function normalizeField(raw: string): string {
  const compact = raw
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '');
  return fieldAliases[compact] || compact;
}

export function canonicalEntity(name: string): string {
  const key = name.trim().toLowerCase();
  const found = Object.entries(entities).find(
    ([entity, def]) => entity === key || def.aliases.includes(key),
  );
  if (!found) {
    throw new Error(`Unknown source "${name.trim()}".`);
  }
  return found[0];
}

export function parseItemSourceLogic(logic: string): ParsedItemSourceQuery {
  const text = logic.trim().replace(/\s+/g, ' ');
  const match = logicPattern.exec(text);
  if (!match) {
    throw new Error(
      'Logic must look like: fetch <field> from <source> [join <source> [on <field> == <field>]] [where <field> == <value>].',
    );
  }
  const outputField = normalizeField(match[1]);
  if (!outputField) {
    throw new Error('Logic must name the field to fetch.');
  }
  const from = canonicalEntity(match[2]);
  let join: ParsedItemSourceQuery['join'];
  if (match[3]) {
    const entity = canonicalEntity(match[3]);
    if (entity === from) {
      throw new Error('Join must use a different source.');
    }
    const on =
      match[4] && match[5]
        ? { left: parseField(match[4]), right: parseField(match[5]) }
        : defaultJoin(from, entity);
    if (!on) {
      throw new Error(`Join ${entity} needs on <field> == <field>.`);
    }
    join = { entity, left: on.left, right: on.right };
  }
  const where = match[6] ? match[6].split(/ and /i).map(parseCondition) : [];
  return { outputField, from, join, where };
}

function parseField(raw: string): FieldRef {
  const text = raw.trim();
  const dot = text.indexOf('.');
  if (dot > 0) {
    return {
      entity: canonicalEntity(text.slice(0, dot)),
      field: normalizeField(text.slice(dot + 1)),
    };
  }
  return { field: normalizeField(text) };
}

function parseCondition(raw: string): QueryCondition {
  const match = conditionPattern.exec(raw.trim());
  if (!match) {
    throw new Error(
      `Condition "${raw.trim()}" must be <field> <operator> <value>. Operators are ==, >, <, <>, >=, <=.`,
    );
  }
  const operator = normalizeOperator(match[2]);
  const value = match[3].trim();
  if (value.startsWith('#')) {
    const parameter = value.slice(1);
    if (!parameter) {
      throw new Error('A parameter name is required after #.');
    }
    return { field: parseField(match[1]), operator, parameter, literal: '' };
  }
  const quoted = /^(['"])(.*)\1$/.exec(value);
  return {
    field: parseField(match[1]),
    operator,
    literal: quoted ? quoted[2] : value,
  };
}

function normalizeOperator(operator: string): CompareOperator {
  if (operator === '=') {
    return '==';
  }
  return operator as CompareOperator;
}

export function compareValues(
  actual: string,
  operator: CompareOperator,
  expected: string,
): boolean {
  const leftNumber = Number(actual);
  const rightNumber = Number(expected);
  const numeric =
    actual.trim() !== '' &&
    expected.trim() !== '' &&
    Number.isFinite(leftNumber) &&
    Number.isFinite(rightNumber);
  const left: string | number = numeric ? leftNumber : actual;
  const right: string | number = numeric ? rightNumber : expected;
  switch (operator) {
    case '>':
      return left > right;
    case '<':
      return left < right;
    case '<>':
      return left !== right;
    case '>=':
      return left >= right;
    case '<=':
      return left <= right;
    case '==':
      return left === right;
  }
}

function defaultJoin(
  leftEntity: string,
  rightEntity: string,
): { left: FieldRef; right: FieldRef } | undefined {
  const usersRequests =
    (leftEntity === 'users' && rightEntity === 'requests') ||
    (leftEntity === 'requests' && rightEntity === 'users');
  if (!usersRequests) {
    return undefined;
  }
  return {
    left: { entity: 'users', field: 'userid' },
    right: { entity: 'requests', field: 'requestedby' },
  };
}
