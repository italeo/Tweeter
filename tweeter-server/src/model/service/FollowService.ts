import { UserDto } from "tweeter-shared";
import { FollowDAO } from "../../database/dao/interfaces/FollowDAO";

export class FollowService {
  private followDAO: FollowDAO;

  // Inject DAOs into the service class
  public constructor(followDAO: FollowDAO) {
    this.followDAO = followDAO;
  }

  public async loadMoreFollowers(
    userAlias: string,
    pageSize: number,
    lastItem: UserDto | null
  ): Promise<[UserDto[], boolean]> {
    const safeLastItem = lastItem ?? undefined;

    try {
      const { followers, hasMore } = await this.followDAO.getFollowers(
        userAlias,
        pageSize,
        safeLastItem
      );
      return [followers, hasMore];
    } catch (err) {
      console.error("Error loading followers:", err);
      throw new Error("Error loading followers.");
    }
  }

  public async loadMoreFollowees(
    userAlias: string,
    pageSize: number,
    lastItem: UserDto | null
  ): Promise<[UserDto[], boolean]> {
    const safeLastItem = lastItem ?? undefined;

    try {
      const { followees, hasMore } = await this.followDAO.getFollowees(
        userAlias,
        pageSize,
        safeLastItem
      );
      return [followees, hasMore];
    } catch (err) {
      console.error("Error loading followees:", err);
      throw new Error("Error loading followees.");
    }
  }

  public async getIsFollowerStatus(
    user: UserDto,
    selectedUser: UserDto
  ): Promise<boolean> {
    try {
      return await this.followDAO.isUserFollowing(
        user.alias,
        selectedUser.alias
      );
    } catch (err) {
      console.error("Error checking follower status:", err);
      throw new Error("Error checking follower status.");
    }
  }

  public async getFolloweeCount(userDto: UserDto): Promise<number> {
    try {
      return await this.followDAO.getFolloweeCount(userDto.alias);
    } catch (err) {
      console.error("Error retrieving followee count:", err);
      throw new Error("Error retrieving followee count.");
    }
  }

  public async getFollowerCount(userDto: UserDto): Promise<number> {
    try {
      return await this.followDAO.getFollowerCount(userDto.alias);
    } catch (err) {
      console.error("Error retrieving follower count:", err);
      throw new Error("Error retrieving follower count.");
    }
  }

  public async follow(
    followerAlias: string,
    userToFollowDto: UserDto
  ): Promise<[followerCount: number, followeeCount: number]> {
    try {
      // Perform the follow operation
      await this.followDAO.followUser(followerAlias, userToFollowDto.alias);

      // Fetch the current counts
      const followerCount = await this.getFollowerCount(userToFollowDto);
      const followeeCount = await this.getFolloweeCount(userToFollowDto);

      return [followerCount, followeeCount];
    } catch (err) {
      console.error("Error following user:", err);
      throw new Error("Error following user.");
    }
  }

  public async unfollow(
    followerAlias: string,
    userToUnfollowDto: UserDto
  ): Promise<[followerCount: number, followeeCount: number]> {
    console.log(`Unfollow request received with:`);
    console.log(`followerAlias: ${followerAlias}`);
    console.log(`userToUnfollow: ${JSON.stringify(userToUnfollowDto)}`);

    try {
      // Perform the unfollow operation
      await this.followDAO.unfollowUser(followerAlias, userToUnfollowDto.alias);

      // Fetch the current counts
      const followerCount = await this.getFollowerCount(userToUnfollowDto);
      const followeeCount = await this.getFolloweeCount(userToUnfollowDto);

      return [followerCount, followeeCount];
    } catch (err) {
      console.error("Error unfollowing user:", err);
      throw new Error("Error unfollowing user.");
    }
  }
}
