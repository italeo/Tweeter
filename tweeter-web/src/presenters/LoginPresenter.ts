import { AuthenticatePresenter, AuthView } from "./AuthenticatePresenter";

export class LoginPresenter extends AuthenticatePresenter {
  public constructor(view: AuthView) {
    super(view);
  }

  public async doLogin(alias: string, password: string) {
    await this.doAuthenticateOperation(
      () => this.userService.login(alias, password),
      "login user"
    );
  }
}
