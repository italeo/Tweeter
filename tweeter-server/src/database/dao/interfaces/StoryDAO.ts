import { Status } from "tweeter-shared";

export interface StoryDAO {
  addStatusToStory(userAlias: string, status: Status): Promise<void>;
  getStoryByUser(
    userAlias: string,
    pageSize: number,
    lastItem?: Status
  ): Promise<{ statuses: Status[]; hasMore: boolean }>;
  deleteStatusFromStory(userAlias: string, statusId: string): Promise<void>;
}
