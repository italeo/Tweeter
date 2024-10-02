import { AuthToken, User } from "tweeter-shared";
import { FollowService } from "../model/service/FollowService";

export interface UserInfoView {
  setFollowersCount: (count: number) => void;
  setFolloweesCount: (count: number) => void;
  setIsFollower: (isFollower: boolean) => void;
  displayErrorMessage: (message: string) => void;
  displayInfoMessage: (message: string, duration: number) => void;
  clearLastInfoMessage: () => void;
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
        this.view.setIsFollower(
          await this.followService.getIsFollowerStatus(
            authToken!,
            currentUser!,
            displayedUser!
          )
        );
      }
    } catch (error) {
      this.view.displayErrorMessage(
        `Failed to determine follower status because of exception: ${error}`
      );
    }
  }

  // Change to setNumberOfFollowees
  public async setNumbFollowees(authToken: AuthToken, displayedUser: User) {
    try {
      this.view.setFolloweesCount(
        await this.followService.getFolloweeCount(authToken, displayedUser)
      );
    } catch (error) {
      this.view.displayErrorMessage(
        `Failed to get followee because of exception: ${error}`
      );
    }
  }

  public async setNumbFollowers(authToken: AuthToken, displayedUser: User) {
    try {
      this.view.setFollowersCount(
        await this.followService.getFollowerCount(authToken, displayedUser)
      );
    } catch (error) {
      this.view.displayErrorMessage(
        `Failed to get follower because of exception: ${error}`
      );
    }
  }

  public async followUserCustom(
    _authToken: AuthToken,
    _displayedUser: User
  ): Promise<void> {
    try {
      // Display a message when starting the follow operation
      this.view.displayInfoMessage(
        `Adding ${_displayedUser!.name} to followers...`,
        0
      );

      // Call the service to follow the user
      let [followersCount, followeesCount] = await this.followService.follow(
        _authToken!,
        _displayedUser!
      );

      this.view.clearLastInfoMessage();

      this.view.setIsFollower(true);
      this.view.setFollowersCount(followersCount);
      this.view.setFolloweesCount(followeesCount);
    } catch (error) {
      // Handle any error that occurred during the follow operation
      this.view.displayErrorMessage(
        `Failed to follow user because of exception: ${error}`
      );
    }
  }

  public async unfollowUserCustom(
    _authToken: AuthToken,
    _displayedUser: User
  ): Promise<void> {
    try {
      this.view.displayInfoMessage(
        `Removing ${_displayedUser!.name} from followers...`,
        0
      );
      const [followersCount, followeesCount] =
        await this.followService.unfollow(_authToken!, _displayedUser!);

      this.view.clearLastInfoMessage();

      this.view.setIsFollower(false);
      this.view.setFollowersCount(followersCount);
      this.view.setFolloweesCount(followeesCount);
    } catch (error) {
      this.view.displayErrorMessage(
        `Failed to unfollow user because of exception: ${error}`
      );
      throw error;
    }
  }
}
