import { AuthenticatePresenter, AuthView } from "./AuthenticatePresenter";

export class LoginPresenter extends AuthenticatePresenter {
  constructor(view: AuthView) {
    super(view);
  }

  public async doLogin(alias: string, password: string) {
    this.setLoadingState(true);

    try {
      const [user, authToken] = await this.userService.login(alias, password);
      this.authenticated(user, authToken);
    } catch (error) {
      this.displayErrorMessage(
        `Login failed: ${error instanceof Error ? error.message : error}`
      );
    } finally {
      this.setLoadingState(false);
    }
  }
}
