import { AuthToken } from "tweeter-shared";
import { UserService } from "../model/service/UserService";
import { MessageView, Presenter } from "./Presenter";

export interface LogoutView extends MessageView {}

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
    }, "log user out");

    // OLD TRY CATCH BLOCK
    // try {
    //   await this.userService.logout(authToken!);

    //   this.view.clearLastInfoMessage();
    //   this.view.clearUserInfo();
    // } catch (error) {
    //   this.view.displayErrorMessage(
    //     `Failed to log user out because of exception: ${error}`
    //   );
    // }
  }
}
