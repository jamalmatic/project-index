export const APPLICATION_ERROR_CODES = ["STORAGE_ERROR"] as const;

export type ApplicationErrorCode = (typeof APPLICATION_ERROR_CODES)[number];

export class ApplicationError extends Error {
  readonly code: ApplicationErrorCode;

  constructor(code: ApplicationErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ApplicationError";
    this.code = code;
  }
}

export const toApplicationError = (error: unknown): ApplicationError => {
  if (error instanceof ApplicationError) return error;

  const message = error instanceof Error ? error.message : "Application storage operation failed";
  return new ApplicationError("STORAGE_ERROR", message, { cause: error });
};
