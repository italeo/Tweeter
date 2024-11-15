import { Status } from "tweeter-shared";

export interface StatusDAO {
  createStatus(status: Status): Promise<void>;
  getStatusesByUser(
    userAlias: string,
    limit: number,
    lastKey?: any
  ): Promise<{ statuses: Status[]; lastKey?: any }>;
  getFeedForUser(
    userAlias: string,
    limit: number,
    lastKey?: any
  ): Promise<{ statuses: Status[]; lastKey?: any }>;
  deleteStatus(statusId: string): Promise<void>;
}
