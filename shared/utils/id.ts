import { ulid } from 'ulid';

/**
 * Generate a new ULID
 * ULIDs are lexicographically sortable and contain a timestamp
 * Format: 26 characters, crockford base32 encoded
 * 
 * @returns A new ULID string
 */
export function generateId(): string {
  return ulid();
}

/**
 * Extract the timestamp from a ULID
 * 
 * @param id - The ULID to extract timestamp from
 * @returns Date object representing the timestamp in the ULID
 */
export function getTimestampFromId(id: string): Date {
  return new Date(parseInt(id.substring(0, 10), 32));
}