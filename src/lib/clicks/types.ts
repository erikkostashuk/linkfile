export type ClickStoreKind = "file" | "postgres" | "disabled";

export type ClickEvent = {
  slug: string;

  clickedAt: string;
};

export type ClickAggregate = {
  slug: string;
  total: number;
  last7Days: number;
  last30Days: number;

  lastClickedAt: string | null;
};

export interface ClickStore {
  readonly kind: ClickStoreKind;

  readonly persistent: boolean;

  readonly disabledReason: string | null;

  record(event: ClickEvent): Promise<void>;

  aggregate(now?: Date): Promise<ClickAggregate[]>;
}

export class ClickStoreConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClickStoreConfigError";
  }
}
