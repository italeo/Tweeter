import { AuthenticatePresenter, AuthView } from "./AuthenticatePresenter";

export class LoginPresenter extends AuthenticatePresenter {
  public constructor(view: AuthView) {
    super(view);
  }

  public async doLogin(alias: string, password: string) {
    this.setLoadingState(true);

    try {
      const [user, authToken] = await this.userService.login(alias, password);
      this.authenticated(user, authToken);
    } catch (error) {
      this.displayErrorMessage(
        `Failed to login user because of exception: ${error}`
      );
    } finally {
      this.setLoadingState(false);
    }
  }
}
