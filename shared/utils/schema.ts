import { pgTable, text } from "drizzle-orm/pg-core";
import { ulid } from 'ulid';

/**
 * Creates a PostgreSQL table with ULID as the primary key
 * 
 * @param name - The name of the table
 * @param additionalColumns - Additional columns for the table
 * @returns pgTable instance with ULID as primary key
 */
export function pgTableWithUlid(name: string, additionalColumns: Record<string, any>) {
  return pgTable(name, {
    id: text("id").primaryKey().$defaultFn(() => ulid()),
    ...additionalColumns,
  });
}