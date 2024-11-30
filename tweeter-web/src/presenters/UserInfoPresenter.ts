import { AuthToken, User } from "tweeter-shared";
import { FollowService } from "../model/service/FollowService";
import { Presenter, StatusMessageView } from "./Presenter";

export interface UserInfoView extends StatusMessageView {
  setFollowersCount: (count: number) => void;
  setFolloweesCount: (count: number) => void;
  setIsFollower: (isFollower: boolean) => void;
}

export class UserInfoPresenter extends Presenter<UserInfoView> {
  protected followService: FollowService;

  public constructor(view: UserInfoView) {
    super(view);
    this.followService = new FollowService();
  }

  public async setIsFollowerStatus(
    authToken: AuthToken,
    currentUser: User,
    displayedUser: User
  ) {
    await this.doFailureReportingOperation(async () => {
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
    }, "determine follower status");
  }

  // Change to setNumberOfFollowees
  public async setNumbFollowees(authToken: AuthToken, displayedUser: User) {
    await this.doFailureReportingOperation(async () => {
      this.view.setFolloweesCount(
        await this.followService.getFolloweeCount(authToken, displayedUser)
      );
    }, "get followees count");
  }

  public async setNumbFollowers(authToken: AuthToken, displayedUser: User) {
    await this.doFailureReportingOperation(async () => {
      this.view.setFollowersCount(
        await this.followService.getFollowerCount(authToken, displayedUser)
      );
    }, "get followers count");
  }

  public async followUserCustom(
    _authToken: AuthToken,
    _displayedUser: User
  ): Promise<void> {
    await this.doFailureReportingOperation(async () => {
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

      // Update the UI state
      console.log("Follow successful. Updating state...");
      this.view.setIsFollower(true);
      this.view.setFollowersCount(followersCount);
      this.view.setFolloweesCount(followeesCount);
      await this.refreshFolloweesList(_authToken, _displayedUser);
    }, "follow user");
  }

  public async unfollowUserCustom(
    _authToken: AuthToken,
    _displayedUser: User
  ): Promise<void> {
    await this.doFailureReportingOperation(async () => {
      this.view.displayInfoMessage(
        `Removing ${_displayedUser!.name} from followers...`,
        0
      );
      const [followersCount, followeesCount] =
        await this.followService.unfollow(_authToken!, _displayedUser!);

      this.view.clearLastInfoMessage();

      console.log("Unfollow successful. Updating state...");
      this.view.setIsFollower(false);
      this.view.setFollowersCount(followersCount);
      this.view.setFolloweesCount(followeesCount);
      await this.refreshFolloweesList(_authToken, _displayedUser);
    }, "unfollow user");
  }

  public async refreshFolloweesList(authToken: AuthToken, displayedUser: User) {
    await this.doFailureReportingOperation(async () => {
      console.log("Refreshing followee list...");
      await this.setNumbFollowees(authToken, displayedUser);
    }, "refresh followee list");
  }
}
