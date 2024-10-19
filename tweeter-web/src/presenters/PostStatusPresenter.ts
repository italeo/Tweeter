import { AuthToken, Status, User } from "tweeter-shared";
import { StatusService } from "../model/service/StatusService";
import { Presenter, StatusMessageView } from "./Presenter";

export interface PostStatusView extends StatusMessageView {
  setLoading: (isLoading: boolean) => void;
  clearPost: () => void;
}
export class PostStatusPresenter extends Presenter<PostStatusView> {
  private _statusService: StatusService;

  public constructor(view: PostStatusView) {
    super(view);
    this._statusService = new StatusService();
  }

  public get statusService() {
    return this._statusService;
  }

  public async postStatus(
    authToken: AuthToken,
    postContent: string,
    currentUser: User
  ) {
    await this.doFailureReportingOperation(async () => {
      this.view.setLoading(true);
      this.view.displayInfoMessage("Posting status...", 0);

      const status = new Status(postContent, currentUser, Date.now());

      await this.statusService.postStatus(authToken, status);
      this.view.clearPost();
      this.view.displayInfoMessage("Status posted!", 2000);
    }, "post the status");
    this.view.clearLastInfoMessage();
    this.view.setLoading(false);
  }
}
