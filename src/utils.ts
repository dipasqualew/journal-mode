import * as functions from 'firebase-functions';

import { APIError } from './errors';

export function formatDate(date: Date): string {
    const year = date.getFullYear().toString();
    let month = (date.getMonth() + 1).toString(); // getMonth() is zero-indexed
    let day = date.getDate().toString();

    if (month.length < 2) {
        month = '0' + month;
    }
    if (day.length < 2) {
        day = '0' + day;
    }

    return `${year}-${month}-${day}`;
}

export const getEnvVar = (key: string): string => {
    const value = process.env[key];

    if (value === undefined) {
        throw new Error(`Env var: '${key}' must be defined.`);
    }

    return value;
}


export const lambda = (func: (request: functions.https.Request, response: functions.Response) => Promise<void>): functions.HttpsFunction => {
    return functions.https.onRequest(async (request, response) => {
        try {
            const apiKey = getEnvVar("GCP_FUNCTION_API_KEY");

            if (apiKey !== `Bearer ${request.headers.authorization}`) {
                throw new APIError(403, "Invalid Authorization Header", "Invalid Authorization Header")
            }

            return await func(request, response);
        } catch (err) {
            let detail = "Internal Server Error";
            let errorCode = 500;
            let log = err;

            if (err instanceof APIError) {
                detail = err.userMessage;
                errorCode = err.errorCode;
                log = err.internalMessage;
            }

            console.log(log);

            response.status(errorCode).send({ detail });
        }
    });
};
