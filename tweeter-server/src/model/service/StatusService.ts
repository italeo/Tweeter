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
    console.log("Posting new status:", newStatus);

    const status = Status.fromDto(newStatus);

    // Validate the conversion
    if (!status) {
      throw new Error("Invalid StatusDto: Unable to convert to Status.");
    }

    // Save the status to the user's story
    try {
      await this.statusDAO.createStatus(status);
      console.log("Status saved to story.");

      const followerAliases = await this.getFollowerAliases(status.user.alias);
      console.log(`Adding status to ${followerAliases.length} feeds.`);
      await this.feedDAO.addStatusToFeed(followerAliases, status);
    } catch (error) {
      console.error("Error posting status:", error);
      throw new Error(
        `Error posting status: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
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
