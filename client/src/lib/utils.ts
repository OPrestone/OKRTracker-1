import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with tailwind-merge
 * @param inputs - Class names to combine
 * @returns Combined class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates initials from a name
 * @param name - Full name to generate initials from
 * @returns Up to 2 characters of initials
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  
  const parts = name.split(' ').filter(Boolean);
  
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Formats a timestamp into a readable time string
 * @param timestamp - The timestamp to format
 * @returns Formatted time string
 */
export function formatTime(timestamp: string | number | Date): string {
  const date = new Date(timestamp);
  
  // Format for time display (e.g., "3:45 PM")
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  
  return `${formattedHours}:${formattedMinutes} ${ampm}`;
}

/**
 * Formats a date for meetings relative to today
 * @param date - The date to format
 * @returns Relative date string (Today, Tomorrow, or formatted date)
 */
export function getRelativeMeetingDate(date: Date | string | number): string {
  const meetingDate = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Check if it's today
  if (
    meetingDate.getDate() === today.getDate() &&
    meetingDate.getMonth() === today.getMonth() &&
    meetingDate.getFullYear() === today.getFullYear()
  ) {
    return 'Today';
  }
  
  // Check if it's tomorrow
  if (
    meetingDate.getDate() === tomorrow.getDate() &&
    meetingDate.getMonth() === tomorrow.getMonth() &&
    meetingDate.getFullYear() === tomorrow.getFullYear()
  ) {
    return 'Tomorrow';
  }
  
  // Return formatted date for other days
  return meetingDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}