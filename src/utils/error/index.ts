export class AppError extends Error {
    constructor(public message: string, public statusCode: number) {
        super(message);
    };
};

export class BadRequestError extends AppError {
    constructor(public message: string) {
        super(message, 400);
    };
};

export class UnauthorizedError extends AppError {
    constructor(public message: string) {
        super(message, 401);
    };
};


export class ForbiddenError extends AppError {
    constructor(public message: string) {
        super(message, 403);
    };
};

export class NotFoundError extends AppError {
    constructor(public message: string) {
        super(message, 404);
    };
};

export class ConflictError extends AppError {
    constructor(public message: string) {
        super(message, 409);
    };
};

export class InternalServerError extends AppError {
    constructor(public message: string) {
        super(message, 500);
    };
};

export class ServiceUnavailableError extends AppError {
    constructor(public message: string) {
        super(message, 503);
    };
};

export class GatewayTimeoutError extends AppError {
    constructor(public message: string) {
        super(message, 504);
    };
};
