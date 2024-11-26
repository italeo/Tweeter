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
        safeLastItem = status || undefined; // Convert null to undefined
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
        userAlias,
        pageSize,
        safeLastItem
      );
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
    const safeLastItem = lastItem
      ? Status.fromDto(lastItem) || undefined
      : undefined;

    try {
      const { statuses, hasMore } = await this.feedDAO.getFeedForUser(
        userAlias,
        pageSize,
        safeLastItem
      );

      console.log(`Successfully loaded feed items for ${userAlias}.`);

      const dtos = statuses.map((status) => status.toDto());
      return [dtos, hasMore];
    } catch (error) {
      console.error(`Error loading feed items for ${userAlias}:`, error);
      throw error;
    }
  }

  public async postStatus(token: string, newStatus: StatusDto): Promise<void> {
    // Pause so we can see the logging out message. Remove when connected to the server
    // await new Promise((f) => setTimeout(f, 2000));
    // Will need the actual server call in the future
    const status = Status.fromDto(newStatus);

    // Validate the conversion
    if (!status) {
      throw new Error("Invalid StatusDto: Unable to convert to Status.");
    }

    // Save the status to the user's story
    try {
      await this.statusDAO.createStatus(status);

      const followerAliases = await this.getFollowerAliases(status.user.alias);
      await this.feedDAO.addStatusToFeed(followerAliases, status);
    } catch (err) {
      throw new Error("Error posting status.");
    }
  }

  // ------------ Helper function --------------------------------
  private async getFollowerAliases(userAlias: string): Promise<string[]> {
    try {
      const followers = await this.followDAO.getFollowers(userAlias, 10000);
      return followers.followers.map((follower) => follower.alias);
    } catch (err) {
      throw new Error("Error retrieving follower aliases.");
    }
  }
  // ---------------------------------------------------------------
}
