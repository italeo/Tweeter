import { AuthToken } from "tweeter-shared";

export interface AuthTokenDAO {
  createAuthToken(authToken: AuthToken): Promise<void>;
  getAuthToken(token: string): Promise<AuthToken | null>;
  deleteAuthToken(token: string): Promise<void>;
  deleteExpiredTokens(expirationTime: number): Promise<void>;
}
