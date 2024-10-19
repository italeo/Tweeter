import { AuthToken } from "tweeter-shared";
import { UserService } from "../model/service/UserService";
import { MessageView, Presenter } from "./Presenter";

export interface LogoutView extends MessageView {
  navigateToLogin: () => void;
}

export class LogoutPresenter extends Presenter<LogoutView> {
  private service: UserService | null = null;

  public constructor(view: LogoutView) {
    super(view);
  }

  public get view() {
    return super.view as LogoutView;
  }

  public get userService() {
    if (this.service == null) {
      this.service = new UserService();
    }
    return this.service;
  }

  public async logout(authToken: AuthToken) {
    this.view.displayInfoMessage("Logging Out...", 0);

    this.doFailureReportingOperation(async () => {
      await this.userService.logout(authToken!);
      this.view.clearLastInfoMessage();
      this.view.clearUserInfo();
      this.view.navigateToLogin();
    }, "log user out");
  }
}
