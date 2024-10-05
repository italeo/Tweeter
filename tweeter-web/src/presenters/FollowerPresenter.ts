import { AuthToken } from "tweeter-shared";
import { FollowService } from "../model/service/FollowService";
import { UserItemPresenter, UserItemView } from "./UserItemPresenter";

export const PAGE_SIZE = 10;

export class FollowerPresenter extends UserItemPresenter {
  private followService: FollowService;

  public constructor(view: UserItemView) {
    super(view);
    this.followService = new FollowService();
  }

  protected get view(): UserItemView {
    return super.view as UserItemView;
  }

  public async loadMoreItems(authToken: AuthToken, userAlias: string) {
    this.doFaliureReportingOperation(async () => {
      if (this.hasMoreItems) {
        const [newItems, hasMore] = await this.followService.loadMoreFollowers(
          authToken,
          userAlias,
          PAGE_SIZE,
          this.lastItem
        );

        this.hasMoreItems = hasMore;
        this.lastItem = newItems[newItems.length - 1];
        this.view.addItems(newItems);
      }
    }, "load follower items");
  }
}
