import { deepFreeze } from "@project-index/core";
import { evidenceId, sourceId, createEvidence, type Evidence } from "@project-index/evidence";

export type DiscoveryResourceId = string & { readonly __brand: "DiscoveryResourceId" };

const requiredText = (value: string, name: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${name} must not be empty`);
  return normalized;
};

export const discoveryResourceId = (value: string): DiscoveryResourceId =>
  requiredText(value, "Discovery resource ID") as DiscoveryResourceId;

export interface DiscoveryResource {
  readonly id: DiscoveryResourceId;
  readonly uri: string;
  readonly kind: "file" | "directory" | "url" | "other";
}

export interface DiscoveryInput {
  readonly id: string | DiscoveryResourceId;
  readonly uri: string;
  readonly kind: DiscoveryResource["kind"];
  readonly sourceId?: string;
}

export interface DiscoveryEvidenceInput {
  readonly id: string;
  readonly sourceId: string;
  readonly resourceId: string | DiscoveryResourceId;
  readonly path?: string;
  readonly excerpt?: string;
  readonly properties?: Readonly<Record<string, unknown>>;
}

export interface DiscoveryResult {
  readonly resource: DiscoveryResource;
  readonly evidence: Evidence;
}

export const createDiscoveryResource = (input: DiscoveryInput): DiscoveryResource =>
  deepFreeze({
    id: discoveryResourceId(input.id),
    uri: requiredText(input.uri, "Discovery resource URI"),
    kind: input.kind,
  });

export const createDiscoveryEvidence = (input: DiscoveryEvidenceInput): Evidence =>
  createEvidence({
    id: evidenceId(input.id),
    sourceId: sourceId(input.sourceId),
    entityId: discoveryResourceId(input.resourceId) as never,
    ...(input.path || input.excerpt || input.properties
      ? {
          locator: input.path ? { path: requiredText(input.path, "Discovery evidence path") } : undefined,
          excerpt: input.excerpt,
          properties: input.properties,
        }
      : {}),
  });

export interface DiscoveryProvider {
  discover(): Promise<readonly DiscoveryResource[]>;
}

export const discover = async (provider: DiscoveryProvider): Promise<readonly DiscoveryResource[]> => {
  const resources = [...(await provider.discover())];
  resources.sort((left, right) => left.uri.localeCompare(right.uri));
  return deepFreeze(resources);
};
