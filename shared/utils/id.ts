import { ulid } from 'ulid';

/**
 * Generates a ULID (Universally Unique Lexicographically Sortable Identifier)
 * 
 * @returns A new ULID string
 */
export function generateId(): string {
  return ulid();
}

/**
 * Checks if a string is a valid ULID
 * 
 * @param id - The ID to validate
 * @returns True if the ID is a valid ULID
 */
export function isValidId(id: string): boolean {
  // ULIDs are 26 characters long and consist of uppercase letters and numbers
  return /^[0-9A-Z]{26}$/.test(id);
}

/**
 * Extracts the timestamp from a ULID
 * 
 * @param id - The ULID to extract the timestamp from
 * @returns The timestamp in milliseconds
 */
export function getTimestampFromId(id: string): number {
  // The first 10 characters of a ULID represent the timestamp
  const timeString = id.substring(0, 10);
  // Convert base32 encoded timestamp to a number
  return parseInt(timeString, 32);
}

/**
 * Compares two ULIDs
 * 
 * @param id1 - The first ULID
 * @param id2 - The second ULID
 * @returns Negative if id1 < id2, 0 if id1 === id2, positive if id1 > id2
 */
export function compareIds(id1: string, id2: string): number {
  return id1.localeCompare(id2);
}