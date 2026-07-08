import Dexie, { type Table } from "dexie";

export interface LocalNote {
  localId: string;
  title: string;
  content: string;
  tags: string[];
  /** ms epoch of last local edit */
  updatedAt: number;
  createdAt: number;
  deleted: 0 | 1;
  /** 1 = has local changes not yet pushed to the cloud */
  dirty: 0 | 1;
}

class DevPulseDB extends Dexie {
  notes!: Table<LocalNote, string>;

  constructor() {
    super("devpulse");
    this.version(1).stores({
      notes: "localId, updatedAt, deleted, dirty",
    });
  }
}

export const db = new DevPulseDB();

export function newLocalId() {
  return crypto.randomUUID();
}
