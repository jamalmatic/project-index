import { ValidatedWriter, type ValidatedWriterOptions } from "@project-index/validation";
import { createPostgresStorage, type PostgresStorage, type QueryService, type UnitOfWork } from "@project-index/storage";

export interface PersistenceConfig {
  readonly databaseUrl: string;
}

export const requireDatabaseUrl = (value: string | undefined): string => {
  if (!value?.trim()) throw new Error("DATABASE_URL must be configured");
  return value.trim();
};

export interface PersistenceService {
  readonly query: QueryService;
  createWriter(options?: Omit<ValidatedWriterOptions, "unitOfWork">): Promise<ValidatedWriter>;
  close(): Promise<void>;
}

export const createPersistenceService = (config: PersistenceConfig): PersistenceService => {
  const storage: PostgresStorage = createPostgresStorage(requireDatabaseUrl(config.databaseUrl));
  return {
    query: storage.createQueryService(),
    async createWriter(options = {}) {
      const unitOfWork: UnitOfWork = await storage.createUnitOfWork();
      return new ValidatedWriter({ ...options, unitOfWork });
    },
    close: () => storage.close(),
  };
};
