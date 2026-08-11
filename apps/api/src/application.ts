import type { ValidatedWriterOptions } from "@project-index/validation";
import type { UnifiedQueryService } from "@project-index/storage";
import type { PersistenceService } from "./persistence";

/**
 * Application-facing composition boundary for Phase 2.7.
 *
 * Application services receive capabilities rather than persistence adapters.
 * The raw PostgresStorage and UnitOfWork remain behind PersistenceService.
 */
export interface ApplicationServices {
  readonly query: UnifiedQueryService;
  createWriter(options?: Omit<ValidatedWriterOptions, "unitOfWork">): ReturnType<PersistenceService["createWriter"]>;
}

export const createApplicationServices = (persistence: PersistenceService): ApplicationServices => ({
  query: persistence.query,
  createWriter: (options) => persistence.createWriter(options),
});
