import { User, Status, UserDto } from "tweeter-shared";

export interface FollowDAO {
  followUser(followerAlias: string, followeeAlias: string): Promise<void>;
  unfollowUser(followerAlias: string, followeeAlias: string): Promise<void>;
  getFollowers(
    userAlias: string,
    pageSize: number,
    lastItem?: UserDto
  ): Promise<{ followers: UserDto[]; hasMore: boolean }>;
  getFollowees(
    userAlias: string,
    pageSize: number,
    lastItem?: UserDto
  ): Promise<{ followees: UserDto[]; hasMore: boolean }>;
  isUserFollowing(
    followerAlias: string,
    followeeAlias: string
  ): Promise<boolean>;
  getFollowerCount(userAlias: string): Promise<number>;
  getFolloweeCount(userAlias: string): Promise<number>;
}
