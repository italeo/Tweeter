import { AuthToken, User } from "tweeter-shared";
import { FollowService } from "../model/service/FollowService";

export interface UserInfoView {
  setFollowerCount: (count: number) => void;
  setFolloweeCount: (count: number) => void;
  setIsFollower: (isFollower: boolean) => void;
  setLoadingState: (isLoading: boolean) => void;
  displayErrorMessage: (message: string) => void;
}

export class UserInfoPresenter {
  protected followService: FollowService;
  protected view: UserInfoView;

  public constructor(view: UserInfoView) {
    this.view = view;
    this.followService = new FollowService();
  }

  public async setIsFollowerStatus(
    authToken: AuthToken,
    currentUser: User,
    displayedUser: User
  ) {
    try {
      if (currentUser === displayedUser) {
        this.view.setIsFollower(false);
      } else {
        const isFollower = await this.followService.getIsFollowerStatus(
          authToken,
          currentUser,
          displayedUser
        );
        this.view.setIsFollower(isFollower);
      }
    } catch (error) {
      this.view.displayErrorMessage(
        `Failed to determine follower status because of exception: ${error}`
      );
    }
  }

  public async setFolloweeCount(authToken: AuthToken, displayedUser: User) {
    try {
      const followeeCount = await this.followService.getFolloweeCount(
        authToken,
        displayedUser
      );
      this.view.setFolloweeCount(followeeCount);
    } catch (error) {
      this.view.displayErrorMessage(
        `Failed to get followee because of exception: ${error}`
      );
    }
  }

  public async setFollowerCount(authToken: AuthToken, displayedUser: User) {
    try {
      const followerCount = await this.followService.getFollowerCount(
        authToken,
        displayedUser
      );
      this.view.setFollowerCount(followerCount);
    } catch (error) {
      this.view.displayErrorMessage(
        `Failed to get follower because of exception: ${error}`
      );
    }
  }

  public async follow(
    authToken: AuthToken,
    displayedUser: User
  ): Promise<[number, number]> {
    try {
      this.view.setLoadingState(true);
      const followerCount = await this.followService.getFollowerCount(
        authToken,
        displayedUser
      );
      const followeeCount = await this.followService.getFolloweeCount(
        authToken,
        displayedUser
      );
      this.view.setIsFollower(true);
      return [followerCount, followeeCount];
    } catch (error) {
      this.view.displayErrorMessage(
        `Failed to follower user because of exception: ${error}`
      );
      throw error;
    } finally {
      this.view.setLoadingState(false);
    }
  }

  public async unfollow(
    authToken: AuthToken,
    displayedUser: User
  ): Promise<[number, number]> {
    try {
      this.view.setLoadingState(true);
      const followerCount = await this.followService.getFollowerCount(
        authToken,
        displayedUser
      );
      const followeeCount = await this.followService.getFolloweeCount(
        authToken,
        displayedUser
      );
      this.view.setIsFollower(false);
      return [followerCount, followeeCount];
    } catch (error) {
      this.view.displayErrorMessage(
        `Failed to unfollow user because of exception: ${error}`
      );
      throw error;
    } finally {
      this.view.setLoadingState(false);
    }
  }
}
