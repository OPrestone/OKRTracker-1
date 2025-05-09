import { User as UserType } from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      tenantId?: number;
    }
    
    interface User extends UserType {}
  }
}

export {};