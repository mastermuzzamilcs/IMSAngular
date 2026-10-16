import { CompareOperator } from './item-source-query';
import { WorkflowFunctionContext } from '../workflow/workflow-action';

export interface ItemSourceParameter {
  variableName: string;
  variableValue: string;
}

export interface ItemSourceStep {
  table: string;
  selectField: string;
  into: string;
  whereField: string;
  operator: CompareOperator;
  whereValue: string;
}

export interface ItemSource {
  id?: string;
  code: string;
  name: string;
  parameters: ItemSourceParameter[];
  steps: ItemSourceStep[];
  logic: string;
  output: string;
}

export interface ParameterField {
  field: string;
  label: string;
}

export interface ParameterTable {
  table: string;
  label: string;
  fields: ParameterField[];
}

export const parameterTables: ParameterTable[] = [
  {
    table: 'request',
    label: 'Request',
    fields: [
      { field: 'requestId', label: 'Request id' },
      { field: 'requestedBy', label: 'Requested by' },
      { field: 'moduleId', label: 'Module id' },
      { field: 'requestType', label: 'Request type' },
      { field: 'status', label: 'Status' },
      { field: 'remarks', label: 'Remarks' },
      { field: 'assignedTo', label: 'Assigned to' },
      { field: 'branchId', label: 'Branch id' },
      { field: 'toBranchId', label: 'To branch id' },
      { field: 'approvedBy', label: 'Approved by' },
      { field: 'requestedOn', label: 'Requested on' },
      { field: 'approvedOn', label: 'Approved on' },
    ],
  },
  {
    table: 'workflow',
    label: 'Workflow',
    fields: [
      { field: 'status', label: 'Status' },
      { field: 'remarks', label: 'Remarks' },
      { field: 'approver', label: 'Approver' },
    ],
  },
];

const legacyParameterValues = [
  'request.requestId',
  'request.requestedBy',
  'request.moduleId',
  'request.requestType',
  'request.status',
  'workflow.status',
  'workflow.remarks',
  'workflow.approver',
];

export const sourceTables: ParameterTable[] = [
  {
    table: 'requests',
    label: 'Requests',
    fields: [
      { field: 'requestid', label: 'Request id' },
      { field: 'requestedby', label: 'Requested by' },
      { field: 'moduleid', label: 'Module id' },
      { field: 'requesttype', label: 'Request type' },
      { field: 'status', label: 'Status' },
      { field: 'remarks', label: 'Remarks' },
      { field: 'assignedto', label: 'Assigned to' },
      { field: 'branchid', label: 'Branch id' },
      { field: 'tobranchid', label: 'To branch id' },
      { field: 'approvedby', label: 'Approved by' },
    ],
  },
  {
    table: 'users',
    label: 'Users',
    fields: [
      { field: 'userid', label: 'User id' },
      { field: 'name', label: 'Name' },
      { field: 'email', label: 'Email' },
      { field: 'manager', label: 'Manager' },
      { field: 'branch', label: 'Branch' },
      { field: 'status', label: 'Status' },
    ],
  },
  {
    table: 'teamhierarchy',
    label: 'Team hierarchy',
    fields: [
      { field: 'userid', label: 'User id' },
      { field: 'reportingto', label: 'Reporting to' },
    ],
  },
  {
    table: 'branches',
    label: 'Branches',
    fields: [
      { field: 'branchid', label: 'Branch id' },
      { field: 'name', label: 'Name' },
      { field: 'manager', label: 'Manager' },
      { field: 'location', label: 'Location' },
      { field: 'email', label: 'Email' },
      { field: 'status', label: 'Status' },
    ],
  },
  {
    table: 'customers',
    label: 'Customers',
    fields: [
      { field: 'customerid', label: 'Customer id' },
      { field: 'name', label: 'Name' },
      { field: 'phone', label: 'Phone' },
      { field: 'email', label: 'Email' },
      { field: 'address', label: 'Address' },
      { field: 'status', label: 'Status' },
    ],
  },
  {
    table: 'products',
    label: 'Products',
    fields: [
      { field: 'productid', label: 'Product id' },
      { field: 'name', label: 'Name' },
      { field: 'brandid', label: 'Brand id' },
      { field: 'price', label: 'Price' },
      { field: 'status', label: 'Status' },
    ],
  },
  {
    table: 'vendors',
    label: 'Vendors',
    fields: [
      { field: 'vendorid', label: 'Vendor id' },
      { field: 'name', label: 'Name' },
      { field: 'location', label: 'Location' },
      { field: 'status', label: 'Status' },
    ],
  },
  {
    table: 'brands',
    label: 'Brands',
    fields: [
      { field: 'brandid', label: 'Brand id' },
      { field: 'name', label: 'Name' },
      { field: 'alias', label: 'Alias' },
      { field: 'country', label: 'Country' },
      { field: 'status', label: 'Status' },
    ],
  },
  {
    table: 'transfers',
    label: 'Transfers',
    fields: [
      { field: 'transferid', label: 'Transfer id' },
      { field: 'frombranch', label: 'From branch' },
      { field: 'tobranch', label: 'To branch' },
      { field: 'userid', label: 'User id' },
      { field: 'branchid', label: 'Branch id' },
      { field: 'status', label: 'Status' },
    ],
  },
];

const noFields: ParameterField[] = [];

export function parameterFields(table: string): ParameterField[] {
  return parameterTables.find((item) => item.table === table)?.fields ?? noFields;
}

export function sourceFields(table: string): ParameterField[] {
  return sourceTables.find((item) => item.table === table)?.fields ?? noFields;
}

export function splitParameterValue(variableValue: string): { table: string; field: string } {
  const trimmed = variableValue.trim();
  const index = Number(trimmed);
  const path =
    Number.isInteger(index) &&
    String(index) === trimmed &&
    index >= 1 &&
    index <= legacyParameterValues.length
      ? legacyParameterValues[index - 1]
      : trimmed;
  if (path === 'status' || path === 'remarks' || path === 'approver') {
    return { table: 'workflow', field: path };
  }
  const dot = path.indexOf('.');
  if (dot > 0) {
    return { table: path.slice(0, dot), field: path.slice(dot + 1) };
  }
  return { table: '', field: '' };
}

export function resolveWorkflowValue(
  variableValue: string,
  context: WorkflowFunctionContext,
): string {
  const selected = splitParameterValue(variableValue);
  const path = selected.table && selected.field ? `${selected.table}.${selected.field}` : '';
  const request = context.request;
  switch (path) {
    case 'request.requestId':
      return request.requestId || '';
    case 'request.requestedBy':
      return request.requestedBy || '';
    case 'request.moduleId':
      return request.moduleId || '';
    case 'request.requestType':
      return String(request.requestType || '');
    case 'request.status':
      return String(request.status || '');
    case 'request.remarks':
      return request.remarks || '';
    case 'request.assignedTo':
      return request.assignedTo || '';
    case 'request.branchId':
      return request.branchId || '';
    case 'request.toBranchId':
      return request.toBranchId || '';
    case 'request.approvedBy':
      return request.approvedBy || '';
    case 'request.requestedOn':
      return dateText(request.requestedOn);
    case 'request.approvedOn':
      return dateText(request.approvedOn);
    case 'workflow.status':
      return String(context.status || '');
    case 'workflow.remarks':
      return context.remarks || '';
    case 'workflow.approver':
      return context.approver || '';
    default:
      return '';
  }
}

function dateText(value: Date | undefined): string {
  if (!value) {
    return '';
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}
