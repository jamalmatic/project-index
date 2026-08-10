import { deepFreeze } from "@project-index/core";
import type { DiscoveryResource } from "./discovery";
import type { DetectionMatch } from "./detection";

export type AnalyzerId = string & { readonly __brand: "AnalyzerId" };
export type AnalyzerCapability = "syntax" | "structure" | "semantics" | "metadata";

const requiredText = (value: string, name: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${name} must not be empty`);
  return normalized;
};

export const analyzerId = (value: string): AnalyzerId =>
  requiredText(value, "Analyzer ID") as AnalyzerId;

export interface AnalyzerContext {
  readonly resource: DiscoveryResource;
  readonly matches: readonly DetectionMatch[];
}

export interface AnalysisObservation {
  readonly analyzerId: AnalyzerId;
  readonly analyzerVersion: string;
  readonly kind: string;
  readonly value?: unknown;
  readonly properties: Readonly<Record<string, unknown>>;
}

export interface AnalyzerFailure {
  readonly analyzerId: AnalyzerId;
  readonly message: string;
}

export interface AnalyzerResult {
  readonly observations: readonly AnalysisObservation[];
  readonly failures: readonly AnalyzerFailure[];
}

export interface AnalyzerDefinition {
  readonly id: AnalyzerId;
  readonly version: string;
  readonly name: string;
  readonly description?: string;
  readonly capabilities: readonly AnalyzerCapability[];
}

export interface AnalyzerContract extends AnalyzerDefinition {
  analyze(context: AnalyzerContext): Promise<AnalyzerResult>;
}

export interface AnalyzerInput {
  readonly id: string | AnalyzerId;
  readonly version: string;
  readonly name: string;
  readonly description?: string;
  readonly capabilities?: readonly AnalyzerCapability[];
  readonly analyze: (context: AnalyzerContext) => Promise<AnalyzerResult>;
}

export const createAnalyzer = (input: AnalyzerInput): AnalyzerContract => {
  const id = analyzerId(input.id);
  const version = requiredText(input.version, "Analyzer version");
  const name = requiredText(input.name, "Analyzer name");
  const capabilities = [...(input.capabilities ?? ["metadata"])];

  if (capabilities.length === 0) throw new Error("Analyzer must declare at least one capability");
  if (new Set(capabilities).size !== capabilities.length) throw new Error("Analyzer capabilities must be unique");

  return deepFreeze({
    id,
    version,
    name,
    ...(input.description?.trim() ? { description: input.description.trim() } : {}),
    capabilities,
    analyze: input.analyze,
  });
};

export const createAnalysisObservation = (
  input: Omit<AnalysisObservation, "properties"> & { properties?: Readonly<Record<string, unknown>> },
): AnalysisObservation =>
  deepFreeze({
    ...input,
    properties: { ...(input.properties ?? {}) },
  });

export const createAnalyzerFailure = (input: AnalyzerFailure): AnalyzerFailure =>
  deepFreeze({
    analyzerId: analyzerId(input.analyzerId),
    message: requiredText(input.message, "Analyzer failure message"),
  });

export const runAnalyzer = async (
  analyzer: AnalyzerContract,
  context: AnalyzerContext,
): Promise<AnalyzerResult> => {
  try {
    const result = await analyzer.analyze(context);
    return deepFreeze({
      observations: [...result.observations],
      failures: [...result.failures],
    });
  } catch (error) {
    return deepFreeze({
      observations: [],
      failures: [
        createAnalyzerFailure({
          analyzerId: analyzer.id,
          message: error instanceof Error ? error.message : String(error),
        }),
      ],
    });
  }
};
