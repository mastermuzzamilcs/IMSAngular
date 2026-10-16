export enum Status {
  Active = 'Active',
  Inactive = 'Inactive',
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
  InProcess = 'In Process',
  Dispatched = 'Dispatched',
  InTransit = 'In Transit',
  ArrivedAtStation = 'Arrived at Station',
  Received = 'Received',
  CourierReturned = 'Courier Returned',
  Completed = 'Completed',
}

export function isStatus(value: unknown, status: Status): boolean {
  return (
    String(value ?? '')
      .trim()
      .toLowerCase() === status.toLowerCase()
  );
}

export function asStatus(value: unknown, fallback: Status = Status.Active): Status {
  const text = String(value ?? '')
    .trim()
    .toLowerCase();
  const match = (Object.values(Status) as string[]).find((item) => item.toLowerCase() === text);
  return (match as Status) ?? fallback;
}
