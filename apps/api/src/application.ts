import type { ValidatedWriterOptions } from "@project-index/validation";
import type { UnifiedQueryService } from "@project-index/storage";
import type { PersistenceService } from "./persistence";
import { toApplicationError } from "./errors";

/**
 * Application-facing composition boundary for Phase 2.7.
 *
 * Application services receive capabilities rather than persistence adapters.
 * The raw PostgresStorage and UnitOfWork remain behind PersistenceService.
 */
export interface ApplicationServices {
  readonly query: UnifiedQueryService;
  createWriter(options?: Omit<ValidatedWriterOptions, "unitOfWork">): ReturnType<PersistenceService["createWriter"]>;
  close(): Promise<void>;
}

const mapQueryErrors = <T>(operation: () => T): T => {
  try {
    return operation();
  } catch (error) {
    throw toApplicationError(error);
  }
};

export const createApplicationServices = (persistence: PersistenceService): ApplicationServices => ({
  query: new Proxy(persistence.query, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== "function") return value;
      return (...args: unknown[]) => mapQueryErrors(() => value.apply(target, args));
    },
  }) as UnifiedQueryService,
  createWriter: async (options) => {
    try {
      return await persistence.createWriter(options);
    } catch (error) {
      throw toApplicationError(error);
    }
  },
  close: async () => {
    try {
      await persistence.close();
    } catch (error) {
      throw toApplicationError(error);
    }
  },
});
