import { AuthToken, FakeData, User, UserDto } from "tweeter-shared";
import { UserDAO } from "../../database/dao/interfaces/UserDAO";
import { FollowDAO } from "../../database/dao/interfaces/FollowDAO";

export class FollowService {
  private followDAO: FollowDAO;
  private userDAO: UserDAO;

  // Inject DAOs into the service class
  public constructor(followDAO: FollowDAO, userDAO: UserDAO) {
    this.followDAO = followDAO;
    this.userDAO = userDAO;
  }

  public async loadMoreFollowers(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: UserDto | null
  ): Promise<[UserDto[], boolean]> {
    // TODO: Replace with the result of calling server
    const safeLastItem = lastItem ?? undefined;

    const { followers, hasMore } = await this.followDAO.getFollowers(
      userAlias,
      pageSize,
      safeLastItem
    );
    return [followers, hasMore];
    // return this.getFakeData(lastItem, pageSize, userAlias);
  }

  public async loadMoreFollowees(
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: UserDto | null
  ): Promise<[UserDto[], boolean]> {
    // TODO: Replace with the result of calling server
    const safeLastItem = lastItem ?? undefined;

    const { followees, hasMore } = await this.followDAO.getFollowees(
      userAlias,
      pageSize,
      safeLastItem
    );
    return [followees, hasMore];

    // return this.getFakeData(lastItem, pageSize, userAlias);
  }
  // ---- working on this --------
  public async getIsFollowerStatus(
    token: string,
    user: UserDto,
    selectedUser: UserDto
  ): Promise<boolean> {
    // TODO: Replace with the result of calling server
    const isFollower = await this.followDAO.isUserFollowing(
      user.alias,
      selectedUser.alias
    );
    return isFollower;
    // return FakeData.instance.isFollower();
  }

  public async getFolloweeCount(
    token: string,
    userDto: UserDto
  ): Promise<number> {
    // TODO: Replace with the result of calling server
    const followeeCount = await this.followDAO.getFolloweeCount(userDto.alias);
    return followeeCount;
    // return FakeData.instance.getFolloweeCount(userDto.alias);
  }

  public async getFollowerCount(
    token: string,
    userDto: UserDto
  ): Promise<number> {
    // TODO: Replace with the result of calling server
    const followerCount = await this.followDAO.getFollowerCount(userDto.alias);
    return followerCount;
    // return FakeData.instance.getFollowerCount(userDto.alias);
  }

  public async follow(
    token: string,
    userToFollowDto: UserDto
  ): Promise<[followerCount: number, followeeCount: number]> {
    // Pause so we can see the follow message. Remove when connected to the server
    await this.followDAO.followUser(token, userToFollowDto.alias);

    // await new Promise((f) => setTimeout(f, 2000));

    // Retrieve updated counts
    const followerCount = await this.getFollowerCount(token, userToFollowDto);
    const followeeCount = await this.getFolloweeCount(token, userToFollowDto);

    return [followerCount, followeeCount];
  }

  public async unfollow(
    token: string,
    userToUnfollowDto: UserDto
  ): Promise<[followerCount: number, followeeCount: number]> {
    // Pause so we can see the unfollow message. Remove when connected to the server
    // await new Promise((f) => setTimeout(f, 2000));
    await this.followDAO.unfollowUser(token, userToUnfollowDto.alias);

    // TODO: Call the server

    const followerCount = await this.getFollowerCount(token, userToUnfollowDto);
    const followeeCount = await this.getFolloweeCount(token, userToUnfollowDto);

    return [followerCount, followeeCount];
  }
}
