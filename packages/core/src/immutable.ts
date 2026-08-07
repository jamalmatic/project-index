export const deepFreeze = <T>(value: T): Readonly<T> => {
  if (value === null || typeof value !== "object") return value as Readonly<T>;

  const object = value as Record<PropertyKey, unknown>;
  for (const key of Reflect.ownKeys(object)) {
    const child = object[key];
    if (child !== null && typeof child === "object" && !Object.isFrozen(child)) {
      deepFreeze(child);
    }
  }

  return Object.freeze(value) as Readonly<T>;
};
