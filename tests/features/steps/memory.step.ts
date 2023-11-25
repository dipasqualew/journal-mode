import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { test } from '../fixtures';

const { Given, When, Then } = createBdd(test);

Given('I have had a conversation today, with summary and transcription', async ({ addJournalEntry }) => {
});

When('the conversation is supplied to the cloud function', async ({ addJournalEntry }) => {
    await addJournalEntry(new Date(), 'Test Summary String', 'Test Transcription');
});

Then('the journal entry is stored into Firestore', async ({ journalRepo }) => {
    const entries = await journalRepo.getEntriesFromLast7Days(new Date());

    await expect(entries).not.toHaveLength(0);
});


Given('I had conversations for the last 3 days, with a summary and transcription', async ({ addJournalEntry }) => {
    for await (let day of [1, 2, 3]) {
        const date = new Date();
        date.setDate(date.getDate() - day);

        await addJournalEntry(date, 'Test Summary String', 'Test Transcription');
    }

});


When('I query for the conversations of the last 7 days', async ({ getJournalEntries }) => {
    const entries = await getJournalEntries(new Date());
});


Then('I receive the entries for the last 3 days', async ({ getJournalEntries }) => {
    const entries = await getJournalEntries(new Date());
});
