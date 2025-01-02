import { VideoData } from "./video-data.model";

export interface Metadata {
    creationDate: string;   // ISO 8601 format (e.g., "2024-12-30T12:00:00Z")
    startAfterDays: number; // Number of days after creationDate to start
    validityDays: number;   // Number of days the data is valid after startAfterDays start
}

export interface EncryptedPayload {
    metadata: Metadata;     // Metadata for validity and creation details
    data?: VideoData | null; // Actual data payload (e.g., video or other)
}

export interface ValidatedPayload {
    valid: boolean;         // Indicates if the data is valid based on metadata
    data?: EncryptedPayload | null; // Decrypted payload if valid, otherwise null
}
