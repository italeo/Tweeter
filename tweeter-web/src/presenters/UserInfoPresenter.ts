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
    console.log("setIsFollowerStatus called with:", {
      authToken,
      currentUser,
      displayedUser,
    });

    await this.doFailureReportingOperation(async () => {
      if (currentUser === displayedUser) {
        console.log(
          "Current user is the displayed user, setting isFollower to false"
        );
        this.view.setIsFollower(false);
      } else {
        const isFollower = await this.followService.getIsFollowerStatus(
          authToken!,
          currentUser!,
          displayedUser!
        );
        console.log("Fetched isFollower status:", isFollower);
        this.view.setIsFollower(isFollower);
      }
    }, "determine follower status");
  }

  // Change to setNumberOfFollowees
  public async setNumbFollowees(authToken: AuthToken, displayedUser: User) {
    console.log("setNumbFollowees called with:", { authToken, displayedUser });

    await this.doFailureReportingOperation(async () => {
      const followeeCount = await this.followService.getFolloweeCount(
        authToken,
        displayedUser
      );
      console.log("Fetched followee count:", followeeCount);
      this.view.setFolloweesCount(followeeCount);
    }, "get followees count");
  }

  public async setNumbFollowers(authToken: AuthToken, displayedUser: User) {
    console.log("setNumbFollowers called with:", { authToken, displayedUser });

    await this.doFailureReportingOperation(async () => {
      const followerCount = await this.followService.getFollowerCount(
        authToken,
        displayedUser
      );
      console.log("Fetched follower count:", followerCount);
      this.view.setFollowersCount(followerCount);
    }, "get followers count");
  }

  public async followUserCustom(
    _authToken: AuthToken,
    _displayedUser: User
  ): Promise<void> {
    console.log("followUserCustom called with:", {
      authToken: _authToken,
      displayedUser: _displayedUser,
    });

    await this.doFailureReportingOperation(async () => {
      this.view.displayInfoMessage(
        `Adding ${_displayedUser!.name} to followers...`,
        0
      );

      const [followersCount, followeesCount] = await this.followService.follow(
        _authToken!,
        _displayedUser!
      );
      console.log("Follow service response:", {
        followersCount,
        followeesCount,
      });

      this.view.clearLastInfoMessage();

      console.log("Follow successful. Updating state...");
      this.view.setIsFollower(true);
      this.view.setFollowersCount(followersCount);
      this.view.setFolloweesCount(followeesCount);

      console.log("Refreshing followee list...");
      await this.refreshFolloweesList(_authToken, _displayedUser);
    }, "follow user");
  }

  public async unfollowUserCustom(
    _authToken: AuthToken,
    _displayedUser: User
  ): Promise<void> {
    console.log("unfollowUserCustom called with:", {
      authToken: _authToken,
      displayedUser: _displayedUser,
    });

    await this.doFailureReportingOperation(async () => {
      this.view.displayInfoMessage(
        `Removing ${_displayedUser!.name} from followers...`,
        0
      );

      const [followersCount, followeesCount] =
        await this.followService.unfollow(_authToken!, _displayedUser!);
      console.log("Unfollow service response:", {
        followersCount,
        followeesCount,
      });

      this.view.clearLastInfoMessage();

      console.log("Unfollow successful. Updating state...");
      this.view.setIsFollower(false);
      this.view.setFollowersCount(followersCount);
      this.view.setFolloweesCount(followeesCount);

      console.log("Refreshing followee list...");
      await this.refreshFolloweesList(_authToken, _displayedUser);
    }, "unfollow user");
  }

  public async refreshFolloweesList(authToken: AuthToken, displayedUser: User) {
    console.log("refreshFolloweesList called with:", {
      authToken,
      displayedUser,
    });

    await this.doFailureReportingOperation(async () => {
      console.log("Refreshing followee count...");
      await this.setNumbFollowees(authToken, displayedUser);
    }, "refresh followee list");
  }
}
