import type { ClickAggregate, ClickStore } from "./types";

export function createDisabledClickStore(reason: string): ClickStore {
  return {
    kind: "disabled",
    persistent: false,
    disabledReason: reason,

    async record(): Promise<void> {},

    async aggregate(): Promise<ClickAggregate[]> {
      return [];
    },
  };
}
