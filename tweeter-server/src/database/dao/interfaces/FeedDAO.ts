import { Status } from "tweeter-shared";

export interface FeedDAO {
  addStatusToFeed(followerAliases: string[], status: Status): Promise<void>;
  removeStatusFromFeed(
    followerAliases: string[],
    statusId: string
  ): Promise<void>;
  getFeedForUser(
    userAlias: string,
    pageSize: number,
    lastItem?: Status
  ): Promise<{ statuses: Status[]; hasMore: boolean }>;
}
