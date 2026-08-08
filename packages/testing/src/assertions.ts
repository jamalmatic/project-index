import { expect } from "vitest";

/** Assert that a value and its immediate object graph are immutable. */
export const expectDeeplyFrozen = (value: object): void => {
  expect(Object.isFrozen(value)).toBe(true);
  for (const nested of Object.values(value)) {
    if (nested && typeof nested === "object") expectDeeplyFrozen(nested as object);
  }
};

/** Assert the common domain contract for immutable records. */
export const expectImmutableRecord = <T extends object>(value: T): void => {
  expectDeeplyFrozen(value);
  expect(Object.isFrozen(value)).toBe(true);
};
