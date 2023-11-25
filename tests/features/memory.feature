Feature: Keep a memory of the journal entries

    Scenario: Write a new journal entry
        Given I have had a conversation today, with summary and transcription
        When the conversation is supplied to the cloud function
        Then the journal entry is stored into Firestore

    Scenario: Retrieves the entries for the last 3 days
        Given I had conversations for the last 3 days, with a summary and transcription
        When I query for the conversations of the last 7 days
        Then I receive the entries for the last 3 days
