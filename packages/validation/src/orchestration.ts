import { deepFreeze } from "@project-index/core";
import type { AnalyzerContract, AnalyzerFailure, AnalyzerResult, AnalysisObservation } from "./analyzer";
import { runAnalyzer } from "./analyzer";
import type { DiscoveryResource } from "./discovery";
import type { DetectionMatch } from "./detection";
import type { PluginRegistry } from "./registry";

export interface AnalysisRunInput {
  readonly resource: DiscoveryResource;
  readonly matches: readonly DetectionMatch[];
  readonly analyzers?: readonly AnalyzerContract[];
}

export interface AnalysisRunResult {
  readonly resource: DiscoveryResource;
  readonly observations: readonly AnalysisObservation[];
  readonly failures: readonly AnalyzerFailure[];
}

const compareAnalyzer = (left: AnalyzerContract, right: AnalyzerContract): number =>
  left.id.localeCompare(right.id) || left.version.localeCompare(right.version);

const sortObservations = (observations: readonly AnalysisObservation[]): readonly AnalysisObservation[] =>
  [...observations].sort(
    (left, right) =>
      left.analyzerId.localeCompare(right.analyzerId) ||
      left.analyzerVersion.localeCompare(right.analyzerVersion) ||
      left.kind.localeCompare(right.kind),
  );

const sortFailures = (failures: readonly AnalyzerFailure[]): readonly AnalyzerFailure[] =>
  [...failures].sort(
    (left, right) => left.analyzerId.localeCompare(right.analyzerId) || left.message.localeCompare(right.message),
  );

export const selectAnalyzers = (
  registry: PluginRegistry,
  capabilities?: readonly string[],
): readonly AnalyzerContract[] => {
  const analyzers = registry
    .findByKind("analyzer")
    .map((plugin) => plugin.implementation as AnalyzerContract);

  const selected = capabilities?.length
    ? analyzers.filter((analyzer) => capabilities.some((capability) => analyzer.capabilities.includes(capability as never)))
    : analyzers;

  return deepFreeze([...selected].sort(compareAnalyzer));
};

export const runAnalysis = async (input: AnalysisRunInput): Promise<AnalysisRunResult> => {
  const analyzers = [...(input.analyzers ?? [])].sort(compareAnalyzer);
  const results: AnalyzerResult[] = await Promise.all(
    analyzers.map((analyzer) => runAnalyzer(analyzer, { resource: input.resource, matches: input.matches })),
  );

  return deepFreeze({
    resource: input.resource,
    observations: sortObservations(results.flatMap((result) => result.observations)),
    failures: sortFailures(results.flatMap((result) => result.failures)),
  });
};

export const runAnalysisWithRegistry = async (
  input: Omit<AnalysisRunInput, "analyzers"> & { registry: PluginRegistry; capabilities?: readonly string[] },
): Promise<AnalysisRunResult> =>
  runAnalysis({
    resource: input.resource,
    matches: input.matches,
    analyzers: selectAnalyzers(input.registry, input.capabilities),
  });

export const runAnalysisBatch = async (
  inputs: readonly AnalysisRunInput[],
): Promise<readonly AnalysisRunResult[]> => {
  const results = await Promise.all(inputs.map(runAnalysis));
  return deepFreeze([...results].sort((left, right) => left.resource.uri.localeCompare(right.resource.uri)));
};
