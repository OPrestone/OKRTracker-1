import { Express } from "express";
import { setupTestAuth } from "../test-auth";

export function registerTestAuthRoutes(app: Express) {
  // Set up simplified test authentication system
  setupTestAuth(app);
}