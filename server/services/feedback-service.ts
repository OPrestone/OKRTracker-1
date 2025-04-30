import { db } from "../db";
import { and, eq, desc, asc } from "drizzle-orm";
import {
  feedback,
  badges,
  userBadges,
  users,
  type Feedback,
  type InsertFeedback,
  type Badge,
  type InsertBadge,
  type UserBadge,
  type InsertUserBadge,
} from "@shared/schema";

export async function createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
  const [newFeedback] = await db
    .insert(feedback)
    .values({
      ...feedbackData,
      isRead: false, // Use isRead instead of read to match schema
      // Don't manually set createdAt as it's handled by the DB
    })
    .returning();

  return newFeedback;
}

export async function getFeedbackById(id: number): Promise<(Feedback & { sender: any; receiver: any }) | undefined> {
  const result = await db
    .select()
    .from(feedback)
    .where(eq(feedback.id, id));

  if (result.length === 0) {
    return undefined;
  }

  // Get feedback item
  const feedbackItem = result[0];
  
  // Fetch sender
  const [sender] = await db
    .select()
    .from(users)
    .where(eq(users.id, feedbackItem.senderId));
    
  // Fetch receiver
  const [receiver] = await db
    .select()
    .from(users)
    .where(eq(users.id, feedbackItem.receiverId));

  return {
    ...feedbackItem,
    sender,
    receiver,
  };
}

export async function getPublicFeedback(limit: number = 10): Promise<(Feedback & { sender: any; receiver: any })[]> {
  // Get public feedback items
  const feedbackItems = await db
    .select()
    .from(feedback)
    .where(eq(feedback.visibility, "public"))
    .orderBy(desc(feedback.createdAt))
    .limit(limit);
    
  // Prepare result
  const results = [];
  
  // For each feedback, get sender and receiver
  for (const feedbackItem of feedbackItems) {
    // Get sender
    const [sender] = await db
      .select()
      .from(users)
      .where(eq(users.id, feedbackItem.senderId));
      
    // Get receiver
    const [receiver] = await db
      .select()
      .from(users)
      .where(eq(users.id, feedbackItem.receiverId));
      
    results.push({
      ...feedbackItem,
      sender,
      receiver
    });
  }

  return results;
}

export async function getReceivedFeedback(userId: number): Promise<(Feedback & { sender: any; receiver: any })[]> {
  // Get feedback received by the user
  const feedbackItems = await db
    .select()
    .from(feedback)
    .where(eq(feedback.receiverId, userId))
    .orderBy(desc(feedback.createdAt));
    
  // Prepare result
  const results = [];
  
  // For each feedback, get sender and receiver
  for (const feedbackItem of feedbackItems) {
    // Get sender
    const [sender] = await db
      .select()
      .from(users)
      .where(eq(users.id, feedbackItem.senderId));
      
    // Get receiver
    const [receiver] = await db
      .select()
      .from(users)
      .where(eq(users.id, feedbackItem.receiverId));
      
    results.push({
      ...feedbackItem,
      sender,
      receiver
    });
  }

  return results;
}

export async function getGivenFeedback(userId: number): Promise<(Feedback & { sender: any; receiver: any })[]> {
  // Get feedback given by the user
  const feedbackItems = await db
    .select()
    .from(feedback)
    .where(eq(feedback.senderId, userId))
    .orderBy(desc(feedback.createdAt));
    
  // Prepare result
  const results = [];
  
  // For each feedback, get sender and receiver
  for (const feedbackItem of feedbackItems) {
    // Get sender
    const [sender] = await db
      .select()
      .from(users)
      .where(eq(users.id, feedbackItem.senderId));
      
    // Get receiver
    const [receiver] = await db
      .select()
      .from(users)
      .where(eq(users.id, feedbackItem.receiverId));
      
    results.push({
      ...feedbackItem,
      sender,
      receiver
    });
  }

  return results;
}

export async function markFeedbackAsRead(id: number): Promise<Feedback> {
  const [updatedFeedback] = await db
    .update(feedback)
    .set({ isRead: true }) // Use isRead instead of read to match schema
    .where(eq(feedback.id, id))
    .returning();

  return updatedFeedback;
}

// Badge-related functions
export async function createBadge(badgeData: InsertBadge): Promise<Badge> {
  const [newBadge] = await db
    .insert(badges)
    .values(badgeData)
    .returning();

  return newBadge;
}

export async function getAllBadges(): Promise<Badge[]> {
  return await db.select().from(badges);
}

export async function getBadgeById(id: number): Promise<Badge | undefined> {
  const [badge] = await db
    .select()
    .from(badges)
    .where(eq(badges.id, id));

  return badge || undefined;
}

export async function awardBadge(userBadgeData: InsertUserBadge): Promise<UserBadge & { badge: Badge; user: any; awardedBy: any }> {
  // First insert the user badge
  const [newUserBadge] = await db
    .insert(userBadges)
    .values({
      ...userBadgeData,
      // Don't manually set createdAt as it's handled by the DB
    })
    .returning();
  
  // Fetch badge info
  const [badge] = await db
    .select()
    .from(badges)
    .where(eq(badges.id, newUserBadge.badgeId));
    
  // Fetch user info
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, newUserBadge.userId));
    
  // Fetch awarder info
  const [awardedBy] = await db
    .select()
    .from(users)
    .where(eq(users.id, newUserBadge.awardedById));

  return {
    ...newUserBadge,
    badge,
    user,
    awardedBy,
  };
}

export async function getUserBadges(userId: number): Promise<(UserBadge & { badge: Badge; user: any; awardedBy: any })[]> {
  // Get all user badges for this user
  const userBadgeItems = await db
    .select()
    .from(userBadges)
    .where(eq(userBadges.userId, userId))
    .orderBy(desc(userBadges.createdAt));
    
  // Prepare result array
  const results = [];
  
  // For each user badge, get related data
  for (const userBadgeItem of userBadgeItems) {
    // Get badge
    const [badge] = await db
      .select()
      .from(badges)
      .where(eq(badges.id, userBadgeItem.badgeId));
      
    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userBadgeItem.userId));
      
    // Get awarder
    const [awardedBy] = await db
      .select()
      .from(users)
      .where(eq(users.id, userBadgeItem.awardedById));
      
    results.push({
      ...userBadgeItem,
      badge,
      user,
      awardedBy
    });
  }
  
  return results;
}

export async function getPublicUserBadges(limit: number = 10): Promise<(UserBadge & { badge: Badge; user: any; awardedBy: any })[]> {
  // Get public user badges
  const userBadgeItems = await db
    .select()
    .from(userBadges)
    .where(eq(userBadges.isPublic, true))
    .orderBy(desc(userBadges.createdAt))
    .limit(limit);
    
  // Prepare result array
  const results = [];
  
  // For each user badge, get related data
  for (const userBadgeItem of userBadgeItems) {
    // Get badge
    const [badge] = await db
      .select()
      .from(badges)
      .where(eq(badges.id, userBadgeItem.badgeId));
      
    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userBadgeItem.userId));
      
    // Get awarder
    const [awardedBy] = await db
      .select()
      .from(users)
      .where(eq(users.id, userBadgeItem.awardedById));
      
    results.push({
      ...userBadgeItem,
      badge,
      user,
      awardedBy
    });
  }
  
  return results;
}