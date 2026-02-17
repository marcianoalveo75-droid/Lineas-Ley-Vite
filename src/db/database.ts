import Dexie from "dexie";
import type { Table } from "dexie";

export interface MarkerData {
  lat: number;
  lng: number;
  name: string;
  description: string;
  image?: string;
}

export interface LeyLine {
  id?: number;
  markers: MarkerData[];
}

export class LeyLineDB extends Dexie {
  leyLines!: Table<LeyLine>;

  constructor() {
    super("LeyLineDB");
    this.version(2).stores({
      leyLines: "++id",
    });
  }
}

export const db = new LeyLineDB();
