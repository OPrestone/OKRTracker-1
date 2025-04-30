import { db } from "../db";
import { feedback, users, badges, userBadges } from "@shared/schema";
import { eq, and, or, desc } from "drizzle-orm";

export async function createFeedback(feedbackData: {
  senderId: number;
  receiverId: number;
  type: "positive" | "constructive" | "general" | "recognition";
  title: string;
  message: string;
  visibility: "public" | "private";
  objectiveId?: number;
  keyResultId?: number;
}) {
  try {
    const [newFeedback] = await db
      .insert(feedback)
      .values({
        ...feedbackData,
        isRead: false,
        createdAt: new Date(),
      })
      .returning();
    
    return newFeedback;
  } catch (error) {
    console.error("Error creating feedback:", error);
    throw new Error("Failed to create feedback");
  }
}

export async function getFeedbackById(id: number) {
  try {
    const result = await db.query.feedback.findFirst({
      where: eq(feedback.id, id),
      with: {
        sender: true,
        receiver: true,
      },
    });
    
    return result;
  } catch (error) {
    console.error("Error fetching feedback by ID:", error);
    throw new Error("Failed to fetch feedback");
  }
}

export async function getReceivedFeedback(userId: number) {
  try {
    const result = await db.query.feedback.findMany({
      where: eq(feedback.receiverId, userId),
      with: {
        sender: true,
        receiver: true,
      },
      orderBy: [desc(feedback.createdAt)],
    });
    
    return result;
  } catch (error) {
    console.error("Error fetching received feedback:", error);
    throw new Error("Failed to fetch received feedback");
  }
}

export async function getGivenFeedback(userId: number) {
  try {
    const result = await db.query.feedback.findMany({
      where: eq(feedback.senderId, userId),
      with: {
        sender: true,
        receiver: true,
      },
      orderBy: [desc(feedback.createdAt)],
    });
    
    return result;
  } catch (error) {
    console.error("Error fetching given feedback:", error);
    throw new Error("Failed to fetch given feedback");
  }
}

export async function getPublicFeedback() {
  try {
    const result = await db.query.feedback.findMany({
      where: eq(feedback.visibility, "public"),
      with: {
        sender: true,
        receiver: true,
      },
      orderBy: [desc(feedback.createdAt)],
    });
    
    return result;
  } catch (error) {
    console.error("Error fetching public feedback:", error);
    throw new Error("Failed to fetch public feedback");
  }
}

export async function markFeedbackAsRead(id: number) {
  try {
    const [updatedFeedback] = await db
      .update(feedback)
      .set({ isRead: true })
      .where(eq(feedback.id, id))
      .returning();
    
    return updatedFeedback;
  } catch (error) {
    console.error("Error marking feedback as read:", error);
    throw new Error("Failed to mark feedback as read");
  }
}

// Badge related functions
export async function getAllBadges() {
  try {
    const result = await db.query.badges.findMany();
    return result;
  } catch (error) {
    console.error("Error fetching badges:", error);
    throw new Error("Failed to fetch badges");
  }
}

export async function getBadgeById(id: number) {
  try {
    const result = await db.query.badges.findFirst({
      where: eq(badges.id, id),
    });
    
    return result;
  } catch (error) {
    console.error("Error fetching badge by ID:", error);
    throw new Error("Failed to fetch badge");
  }
}

export async function createBadge(badgeData: {
  name: string;
  description: string;
  icon: string;
  color: string;
}) {
  try {
    const [newBadge] = await db
      .insert(badges)
      .values({
        ...badgeData,
        createdAt: new Date(),
      })
      .returning();
    
    return newBadge;
  } catch (error) {
    console.error("Error creating badge:", error);
    throw new Error("Failed to create badge");
  }
}

export async function awardBadge(awardData: {
  userId: number;
  badgeId: number;
  awardedById: number;
  message?: string;
  isPublic: boolean;
}) {
  try {
    // Check if the badge exists
    const badge = await getBadgeById(awardData.badgeId);
    if (!badge) {
      throw new Error("Badge not found");
    }
    
    // Check if the user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, awardData.userId),
    });
    if (!user) {
      throw new Error("User not found");
    }
    
    // Award the badge
    const [userBadge] = await db
      .insert(userBadges)
      .values({
        userId: awardData.userId,
        badgeId: awardData.badgeId,
        awardedById: awardData.awardedById,
        message: awardData.message || null,
        isPublic: awardData.isPublic,
        createdAt: new Date(),
      })
      .returning();
    
    return userBadge;
  } catch (error) {
    console.error("Error awarding badge:", error);
    throw new Error("Failed to award badge");
  }
}

export async function getUserBadges(userId: number) {
  try {
    const result = await db.query.userBadges.findMany({
      where: eq(userBadges.userId, userId),
      with: {
        badge: true,
        user: true,
        awardedBy: true,
      },
      orderBy: [desc(userBadges.createdAt)],
    });
    
    return result;
  } catch (error) {
    console.error("Error fetching user badges:", error);
    throw new Error("Failed to fetch user badges");
  }
}

export async function getPublicUserBadges() {
  try {
    const result = await db.query.userBadges.findMany({
      where: eq(userBadges.isPublic, true),
      with: {
        badge: true,
        user: true,
        awardedBy: true,
      },
      orderBy: [desc(userBadges.createdAt)],
    });
    
    return result;
  } catch (error) {
    console.error("Error fetching public user badges:", error);
    throw new Error("Failed to fetch public user badges");
  }
}