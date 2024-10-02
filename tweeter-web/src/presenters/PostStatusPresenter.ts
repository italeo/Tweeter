import { AuthToken, Status, User } from "tweeter-shared";
import { StatusService } from "../model/service/StatusService";

export interface PostStatusView {
  setLoading: (isLoading: boolean) => void;
  clearPost: () => void;
  displayInfoMessage: (message: string, duration: number) => void;
  displayErrorMessage: (message: string) => void;
  clearLastInfoMessage: () => void;
}
export class PostStatusPresenter {
  private statusService: StatusService;
  private view: PostStatusView;

  public constructor(view: PostStatusView) {
    this.view = view;
    this.statusService = new StatusService();
  }

  public async postStatus(
    authToken: AuthToken,
    postContent: string,
    currentUser: User
  ) {
    try {
      this.view.setLoading(true);
      this.view.displayInfoMessage("Posting status...", 0);

      const status = new Status(postContent, currentUser, Date.now());

      await this.statusService.postStatus(authToken, status);
      this.view.clearPost();
      this.view.displayInfoMessage("Status posted!", 2000);
    } catch (error) {
      this.view.displayErrorMessage(
        `Failed to post the status because of exception: ${error}`
      );
    } finally {
      this.view.clearLastInfoMessage();
      this.view.setLoading(false);
    }
  }
}
