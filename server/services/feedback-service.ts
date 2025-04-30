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
      createdAt: new Date(),
      read: false,
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
    .set({ read: true })
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
      createdAt: new Date(),
    })
    .returning();
  
  // Then get the full user badge with related data
  const [result] = await db
    .select({
      userBadge: userBadges,
      badge: badges,
      user: users,
      awardedBy: users.as("awarder"),
    })
    .from(userBadges)
    .where(eq(userBadges.id, newUserBadge.id))
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .innerJoin(users, eq(userBadges.userId, users.id))
    .innerJoin(users.as("awarder"), eq(userBadges.awardedById, users.as("awarder").id));

  return {
    ...result.userBadge,
    badge: result.badge,
    user: result.user,
    awardedBy: result.awardedBy,
  };
}

export async function getUserBadges(userId: number): Promise<(UserBadge & { badge: Badge; user: any; awardedBy: any })[]> {
  const results = await db
    .select({
      userBadge: userBadges,
      badge: badges,
      user: users,
      awardedBy: users.as("awarder"),
    })
    .from(userBadges)
    .where(eq(userBadges.userId, userId))
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .innerJoin(users, eq(userBadges.userId, users.id))
    .innerJoin(users.as("awarder"), eq(userBadges.awardedById, users.as("awarder").id))
    .orderBy(desc(userBadges.createdAt));

  return results.map(({ userBadge, badge, user, awardedBy }) => ({
    ...userBadge,
    badge,
    user,
    awardedBy,
  }));
}

export async function getPublicUserBadges(limit: number = 10): Promise<(UserBadge & { badge: Badge; user: any; awardedBy: any })[]> {
  const results = await db
    .select({
      userBadge: userBadges,
      badge: badges,
      user: users,
      awardedBy: users.as("awarder"),
    })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .innerJoin(users, eq(userBadges.userId, users.id))
    .innerJoin(users.as("awarder"), eq(userBadges.awardedById, users.as("awarder").id))
    .orderBy(desc(userBadges.createdAt))
    .limit(limit);

  return results.map(({ userBadge, badge, user, awardedBy }) => ({
    ...userBadge,
    badge,
    user,
    awardedBy,
  }));
}