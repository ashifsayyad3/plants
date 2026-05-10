declare namespace Express {
  interface Request {
    user?: {
      id:          number;
      uuid:        string;
      email:       string;
      role:        string;        // primary role slug (first)
      roles:       string[];      // all role slugs
      permissions: string[];      // all permission names
      emailVerifiedAt?: Date | null;
    };
    requestId?: string;
  }
}
