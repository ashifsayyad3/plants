// Global Express Request augmentation
// No imports allowed — must be a pure ambient module
declare namespace Express {
  interface Request {
    user?: {
      id:          number;
      uuid:        string;
      email:       string;
      role:        string;
      roles:       string[];
      permissions: string[];
      emailVerifiedAt?: Date | null;
    };
    requestId?: string;
  }
}
