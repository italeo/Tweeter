import { User } from "tweeter-shared";

export interface UserDAO {
  createUser(user: User): Promise<void>;
  getUserByAlias(alias: string): Promise<User | null>;
  updateUser(user: User): Promise<void>;
  deleteUser(alias: string): Promise<void>;
  incrementFollowersCount(alias: string): Promise<void>;
  decrementFollowersCount(alias: string): Promise<void>;
  incrementFollowingCount(alias: string): Promise<void>;
  decrementFollowingCount(alias: string): Promise<void>;

  // Methods for password management
  createUserWithPassword(user: User, hashedPassword: string): Promise<void>;
  getPasswordHash(alias: string): Promise<string>;
}
