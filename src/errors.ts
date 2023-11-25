export class APIError extends Error {
    errorCode: number;
    internalMessage: string;
    userMessage: string;

    constructor(errorCode: number, internalMessage: string, userMessage?: string) {
        super(internalMessage);

        this.errorCode = errorCode;
        this.internalMessage = internalMessage;
        this.userMessage = userMessage || "Internal Server Error";
    }
}

