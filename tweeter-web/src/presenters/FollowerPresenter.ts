import { FollowService } from "../model/service/FollowService";
import { UserItemPresenter, UserItemView } from "./UserItemPresenter";

export class FollowerPresenter extends UserItemPresenter {
  private followService: FollowService;

  public constructor(view: UserItemView) {
    super(view);
    this.followService = new FollowService();
  }
}
