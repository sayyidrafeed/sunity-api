export abstract class DomainError extends Error {
  abstract readonly statusCode: number;
  readonly userMessage: string;

  constructor(userMessage: string, internalDetail?: string) {
    super(internalDetail ? `${userMessage}: ${internalDetail}` : userMessage);
    this.name = this.constructor.name;
    this.userMessage = userMessage;
  }
}

/** 404 — entity not found. */
export class NotFoundError extends DomainError {
  readonly statusCode = 404 as const;
}

/** 400 — invalid input or business rule violation. */
export class ValidationError extends DomainError {
  readonly statusCode = 400 as const;
}

/** 403 — action not allowed. */
export class ForbiddenError extends DomainError {
  readonly statusCode = 403 as const;
}

/** 409 — resource conflict (duplicate, stale update, etc.). */
export class ConflictError extends DomainError {
  readonly statusCode = 409 as const;
}
