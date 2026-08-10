import { deepFreeze } from "@project-index/core";

export type DiscoveryResourceId = string & { readonly __brand: "DiscoveryResourceId" };

const requiredText = (value: string, name: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${name} must not be empty`);
  return normalized;
};

export const discoveryResourceId = (value: string): DiscoveryResourceId =>
  requiredText(value, "Discovery resource ID") as DiscoveryResourceId;

export type DiscoveryResourceKind = "file" | "directory" | "url" | "other";

export interface DiscoveryResource {
  readonly id: DiscoveryResourceId;
  readonly uri: string;
  readonly kind: DiscoveryResourceKind;
}

export interface DiscoveryInput {
  readonly id: string | DiscoveryResourceId;
  readonly uri: string;
  readonly kind: DiscoveryResourceKind;
}

/**
 * Discovery evidence is intentionally a discovery-layer record rather than a
 * domain Evidence object. The current Evidence model requires an assertion or
 * entity target; discovery resources do not become domain entities merely by
 * being observed. Conversion to domain Evidence happens when a discovery
 * finding produces a canonical knowledge object.
 */
export interface DiscoveryEvidence {
  readonly id: string;
  readonly resourceId: DiscoveryResourceId;
  readonly sourceId?: string;
  readonly path?: string;
  readonly excerpt?: string;
  readonly properties: Readonly<Record<string, unknown>>;
}

export interface DiscoveryEvidenceInput {
  readonly id: string;
  readonly resourceId: string | DiscoveryResourceId;
  readonly sourceId?: string;
  readonly path?: string;
  readonly excerpt?: string;
  readonly properties?: Readonly<Record<string, unknown>>;
}

export interface DiscoveryResult {
  readonly resource: DiscoveryResource;
  readonly evidence: DiscoveryEvidence;
}

export const createDiscoveryResource = (input: DiscoveryInput): DiscoveryResource =>
  deepFreeze({
    id: discoveryResourceId(input.id),
    uri: requiredText(input.uri, "Discovery resource URI"),
    kind: input.kind,
  });

export const createDiscoveryEvidence = (input: DiscoveryEvidenceInput): DiscoveryEvidence =>
  deepFreeze({
    id: requiredText(input.id, "Discovery evidence ID"),
    resourceId: discoveryResourceId(input.resourceId),
    properties: { ...(input.properties ?? {}) },
    ...(input.sourceId?.trim() ? { sourceId: input.sourceId.trim() } : {}),
    ...(input.path?.trim() ? { path: input.path.trim() } : {}),
    ...(input.excerpt?.trim() ? { excerpt: input.excerpt.trim() } : {}),
  });

export interface DiscoveryProvider {
  discover(): Promise<readonly DiscoveryResource[]>;
}

export const discover = async (provider: DiscoveryProvider): Promise<readonly DiscoveryResource[]> => {
  const resources = [...(await provider.discover())];
  resources.sort((left, right) => left.uri.localeCompare(right.uri));
  return deepFreeze(resources);
};
