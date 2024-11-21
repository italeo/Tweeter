import { Status } from "tweeter-shared";

export interface StatusDAO {
  createStatus(status: Status): Promise<void>;
  getStatusesByUser(
    userAlias: string,
    limit: number,
    lastKey?: any
  ): Promise<{ statuses: Status[]; lastKey?: any }>;
  deleteStatus(userAlias: string, timestamp: number): Promise<void>;
}
