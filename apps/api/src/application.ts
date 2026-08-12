import type { ValidatedWriterOptions, IngestionInput, IngestionResult } from "@project-index/validation";
import type { UnifiedQueryService } from "@project-index/storage";
import type { PersistenceService } from "./persistence";
import type { CommandService } from "./commands";
import { createCommandService } from "./commands";
import { IngestionService } from "@project-index/validation";
import { toApplicationError } from "./errors";
import { createIngestionReadWorkflow, type IngestionReadWorkflowResult } from "./ingestion-read.workflow";

/**
 * Application-facing composition boundary for Phase 2.7/2.8 and Phase 2.9 workflows.
 *
 * Application services receive capabilities rather than persistence adapters.
 * The raw PostgresStorage and UnitOfWork remain behind PersistenceService.
 */
export interface ApplicationServices {
  readonly query: UnifiedQueryService;
  readonly commands: CommandService;
  readonly ingestion: Pick<IngestionService, "ingest">;
  readonly workflow: {
    execute(input: IngestionInput): Promise<IngestionReadWorkflowResult>;
  };
  createWriter(options?: Omit<ValidatedWriterOptions, "unitOfWork">): ReturnType<PersistenceService["createWriter"]>;
  close(): Promise<void>;
}

const mapQueryErrors = <T>(operation: () => T): T | Promise<T> => {
  try {
    const result = operation();
    if (result instanceof Promise) {
      return result.catch((error) => {
        throw toApplicationError(error);
      });
    }
    return result;
  } catch (error) {
    throw toApplicationError(error);
  }
};

const protectQueryCapability = <T extends object>(capability: T): T =>
  new Proxy(capability, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== "function") return value;
      return (...args: unknown[]) => mapQueryErrors(() => value.apply(target, args));
    },
  });

const protectQueryService = (query: UnifiedQueryService): UnifiedQueryService =>
  new Proxy(query, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value === "function") return (...args: unknown[]) => mapQueryErrors(() => value.apply(target, args));
      if (value && typeof value === "object") return protectQueryCapability(value);
      return value;
    },
  }) as UnifiedQueryService;

const protectIngestion = (ingestion: IngestionService): Pick<IngestionService, "ingest"> => ({
  ingest: (input: IngestionInput): Promise<IngestionResult> =>
    mapQueryErrors(() => ingestion.ingest(input)) as Promise<IngestionResult>,
});

export const createApplicationServices = (persistence: PersistenceService): ApplicationServices => {
  const ingestion = protectIngestion(new IngestionService(async () => {
    try {
      return await persistence.createWriter();
    } catch (error) {
      throw toApplicationError(error);
    }
  }));
  const query = protectQueryService(persistence.query);
  const workflow = createIngestionReadWorkflow({ ingestion, query });

  return {
    query,
    commands: createCommandService(async () => {
      try {
        return await persistence.createWriter();
      } catch (error) {
        throw toApplicationError(error);
      }
    }),
    ingestion,
    workflow: {
      execute: (input) => mapQueryErrors(() => workflow.execute(input)) as Promise<IngestionReadWorkflowResult>,
    },
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
  };
};
