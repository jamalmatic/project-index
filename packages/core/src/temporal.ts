export interface TemporalContext {
  readonly validFrom?: string;
  readonly validTo?: string;
}

export const createTemporalContext = (
  context: TemporalContext = {},
): TemporalContext => {
  if (context.validFrom && context.validTo && context.validFrom > context.validTo) {
    throw new Error("validFrom must not be later than validTo");
  }

  return Object.freeze({ ...context });
};
