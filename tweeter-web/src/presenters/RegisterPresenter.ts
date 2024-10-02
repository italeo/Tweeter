import { AuthenticatePresenter, AuthView } from "./AuthenticatePresenter";

export class RegisterPresenter extends AuthenticatePresenter {
  public constructor(view: AuthView) {
    super(view);
  }

  public async doRegister(
    firstName: string,
    lastName: string,
    alias: string,
    password: string,
    imageBytes: Uint8Array,
    imageFileExtension: string
  ) {
    this.setLoadingState(true);

    try {
      const [user, authToken] = await this.userService.register(
        firstName,
        lastName,
        alias,
        password,
        imageBytes,
        imageFileExtension
      );

      this.authenticated(user, authToken);
    } catch (error) {
      this.displayErrorMessage(
        `Failed to register user because of exception: ${error}`
      );
    } finally {
      this.setLoadingState(false);
    }
  }
}
