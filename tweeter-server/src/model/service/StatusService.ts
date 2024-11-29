import { Status, StatusDto } from "tweeter-shared";
import { StatusDAO } from "../../database/dao/interfaces/StatusDAO";
import { FeedDAO } from "../../database/dao/interfaces/FeedDAO";
import { FollowDAO } from "../../database/dao/interfaces/FollowDAO";

export class StatusService {
  private statusDAO: StatusDAO;
  private feedDAO: FeedDAO;
  private followDAO: FollowDAO;

  public constructor(
    statusDAO: StatusDAO,
    feedDAO: FeedDAO,
    followDAO: FollowDAO
  ) {
    this.statusDAO = statusDAO;
    this.feedDAO = feedDAO;
    this.followDAO = followDAO;
  }

  public async loadMoreStoryItems(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: StatusDto | null
  ): Promise<[StatusDto[], boolean]> {
    console.log(
      `Loading story items for user: ${userAlias}, pageSize: ${pageSize}, lastItem:`,
      lastItem
    );

    let safeLastItem: Status | undefined;
    if (lastItem) {
      try {
        const status = Status.fromDto(lastItem);
        safeLastItem = status || undefined;
      } catch (error) {
        console.error("Error converting lastItem to Status:", error);
        throw new Error(
          `Error converting lastItem: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    try {
      const { statuses, lastKey } = await this.statusDAO.getStatusesByUser(
        userAlias.toLowerCase(), // Normalize alias
        pageSize,
        safeLastItem
      );
      console.log("Statuses retrieved:", statuses);

      const dtos = statuses.map((status) => status.toDto());
      return [dtos, !!lastKey];
    } catch (error) {
      console.error("Error loading story items:", error);
      throw new Error(
        `Error loading story items: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  public async loadMoreFeedItems(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: StatusDto | null
  ): Promise<[StatusDto[], boolean]> {
    console.log(
      `Loading feed items for user: ${userAlias}, pageSize: ${pageSize}, lastItem:`,
      lastItem
    );

    let safeLastItem: Status | undefined;
    if (lastItem) {
      try {
        safeLastItem = Status.fromDto(lastItem) || undefined;
      } catch (error) {
        console.error("Error converting lastItem to Status:", error);
        throw new Error(
          `Error converting lastItem: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    try {
      const { statuses, hasMore } = await this.feedDAO.getFeedForUser(
        userAlias.toLowerCase(), // Normalize alias
        pageSize,
        safeLastItem
      );
      console.log("Feed statuses retrieved:", statuses);

      const dtos = statuses.map((status) => status.toDto());
      return [dtos, hasMore];
    } catch (error) {
      console.error(`Error loading feed items for ${userAlias}:`, error);
      throw error;
    }
  }

  public async postStatus(token: string, newStatus: StatusDto): Promise<void> {
    console.log("Received request to post status:", JSON.stringify(newStatus));

    const status = Status.fromDto(newStatus);
    if (!status) {
      throw new Error("Invalid StatusDto: Unable to convert to Status.");
    }

    try {
      // Save the status to the user's story
      console.log("Saving status to Story for user:", status.user.alias);
      await this.statusDAO.createStatus(status);
      console.log("Status saved successfully for user:", status.user.alias);

      // Fetch the followers of the user
      const followerAliases = await this.getFollowerAliases(status.user.alias);

      // Only add the status to feeds if there are followers
      if (followerAliases.length > 0) {
        console.log(`Adding status to ${followerAliases.length} feeds.`);
        await this.feedDAO.addStatusToFeed(followerAliases, status);
      } else {
        console.log(
          `No followers found for user ${status.user.alias}. Skipping feed update.`
        );
      }
    } catch (error) {
      console.error("Error posting status:", error);
      throw error;
    }
  }

  private async getFollowerAliases(userAlias: string): Promise<string[]> {
    console.log(`Fetching followers for user: ${userAlias}`);
    try {
      const followers = await this.followDAO.getFollowers(
        userAlias.toLowerCase(), // Normalize alias
        10000
      );
      return followers.followers.map((follower) => follower.alias);
    } catch (error) {
      console.error("Error retrieving follower aliases:", error);
      throw new Error(
        `Error retrieving follower aliases: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
