
import { JournalRepo, JournalRow } from './src/repos';

import { APIError } from './src/errors';
import { getEnvVar, lambda } from './src/utils';


export const getRecentJournals = async (
    projectId: string,
): Promise<JournalRow[]> => {
    const repo = new JournalRepo(projectId, "journals")
    const entries = await repo.getEntriesFromLast7Days(new Date());

    return entries;
}


export interface GetJournalsResponse {
    journals: JournalRow[]
}


export const httpRequestFunction = lambda(async (request, response) => {
    const projectId = getEnvVar('GCP_PROJECT_ID');

    const journals = await getRecentJournals(projectId);
    const responseBody: GetJournalsResponse = { journals };

    response.status(200).send(responseBody);
});

export const writeJournalEntry = lambda(async (request, response) => {
    const projectId = getEnvVar('GCP_PROJECT_ID');
    const repo = new JournalRepo(projectId, "journals");

    const { date, summary, transcription } = request.body;

    if (!date || !summary || !transcription) {
        throw new APIError(400, 'Validation Error', 'Missing required fields');
    }

    // Parse the date string to a Date object
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
        throw new APIError(400, 'Validation Error', 'Invalid date format');
    }

    // Insert the row
    await repo.insertRow(parsedDate, summary, transcription);

    response.status(200).send({});
});
