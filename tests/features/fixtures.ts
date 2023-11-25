import { test as base } from 'playwright-bdd';
import * as dotenv from 'dotenv';

import { JournalRepo } from '../../src/repos';
import { formatDate, getEnvVar } from '../../src/utils';
import { GetJournalsResponse } from '../../function';

dotenv.config({ path: '../../.env' });


export interface TestInterface {
    config: {
        googleProjectId: string;
        collectionName: string;
        endpoints: {
            retrieve: string;
            write: string;
        };
    };
    journalRepo: JournalRepo;
    cleanDate: (date: Date) => void,
    addJournalEntry: (date: Date, summary: string, transcription: string) => Promise<void>,
    getJournalEntries: (date: Date) => Promise<GetJournalsResponse>,
}

// export custom test function
export const test = base.extend<TestInterface>({
    config: async ({ page }, use) => {
        await use({
            googleProjectId: getEnvVar('GCP_PROJECT_ID'),
            collectionName: "journals",
            endpoints: {
                retrieve: getEnvVar('GCP_FUNCTION_RETRIEVE_URL'),
                write: getEnvVar('GCP_FUNCTION_WRITE_URL'),
            },
        });
    },

    journalRepo: async ({ config }, use) => {
        const repo = new JournalRepo(config.googleProjectId, config.collectionName);
        await use(repo);
    },

    cleanDate: async ({ journalRepo }, use) => {
        const datesToWipe: Date[] = [];

        const cleanDate = (date: Date): void => {
            datesToWipe.push(date);
        }

        await use(cleanDate);

        for await (let date of datesToWipe) {
            await journalRepo.deleteRowByDate(date);
        }
    },

    getJournalEntries: async ({ config }, use) => {
        const func = async (date: Date): Promise<GetJournalsResponse> => {
            const response = await fetch(config.endpoints.retrieve, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const body = await response.json();

            return body as GetJournalsResponse;
        }

        await use(func);
    },

    addJournalEntry: async ({ config, cleanDate }, use) => {

        const add = async (date: Date, summary: string, transcription: string): Promise<void> => {
            await fetch(config.endpoints.write, {
                method: "POST",
                body: JSON.stringify({
                    date: formatDate(date),
                    summary,
                    transcription,
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            cleanDate(date);
        };

        await use(add);
    },
});
