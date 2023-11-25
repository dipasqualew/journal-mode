import { Firestore } from '@google-cloud/firestore';

import { formatDate } from './utils';


export interface JournalRow {
    id: string;
    date: string;
    summary: string;
    transcription: string;
}

export class JournalRepo {
    firestore: Firestore;
    collectionName: string;

    constructor(
        projectId: string,
        collectionName: string,
    ) {
        this.firestore = new Firestore({
            projectId: projectId,

        });
        this.collectionName = collectionName;
    }

    async getEntriesFromLast7Days(date: Date): Promise<JournalRow[]> {
        const sevenDaysEarlier = new Date();
        sevenDaysEarlier.setDate(date.getDate() - 7);

        const querySnapshot = await this.firestore.collection(this.collectionName)
            .where('date', '>=', sevenDaysEarlier)
            .orderBy('date', 'desc')
            .get();

        return querySnapshot.docs.map(doc => doc.data() as JournalRow);
    }

    async insertRow(date: Date, summary: string, transcription: string): Promise<void> {
        await this.firestore.collection(this.collectionName).doc(formatDate(date)).set({
            date,
            summary,
            transcription,
        });
    }

    async deleteRowByDate(date: Date): Promise<void> {
        await this.firestore.collection(this.collectionName).doc(formatDate(date)).delete();
    }
}
