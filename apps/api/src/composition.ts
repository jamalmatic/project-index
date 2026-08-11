import { createApplicationServices, type ApplicationServices } from "./application";
import { createPersistenceService, type PersistenceConfig } from "./persistence";

/** The application-owned composition root for Phase 2.7. */
export const createApplication = (config: PersistenceConfig): ApplicationServices =>
  createApplicationServices(createPersistenceService(config));
