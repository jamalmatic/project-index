import { describe, expect, it } from "vitest";
import { ApplicationError, toApplicationError } from "./errors";

describe("Phase 2.7 application errors", () => {
  it("wraps unknown failures as storage errors and preserves cause", () => {
    const cause = new Error("connection refused");
    const error = toApplicationError(cause);

    expect(error).toBeInstanceOf(ApplicationError);
    expect(error.code).toBe("STORAGE_ERROR");
    expect(error.message).toBe("connection refused");
    expect(error.cause).toBe(cause);
  });

  it("preserves existing application errors", () => {
    const error = new ApplicationError("STORAGE_ERROR", "already mapped");
    expect(toApplicationError(error)).toBe(error);
  });
});
