import { User, AuthToken } from "tweeter-shared";
import { UserService } from "../model/service/UserService";
import { Presenter, View } from "./Presenter";

export interface AuthView extends View {
  authenticated: (user: User, authToken: AuthToken) => void;
  setLoadingState: (isLoading: boolean) => void;
}

export class AuthenticatePresenter extends Presenter<AuthView> {
  protected userService: UserService;

  constructor(view: AuthView) {
    super(view);
    this.userService = new UserService();
  }

  protected setLoadingState(isLoading: boolean) {
    this.view.setLoadingState(isLoading);
  }

  protected displayErrorMessage(message: string) {
    this.view.displayErrorMessage(message);
  }

  protected authenticated(user: User, authToken: AuthToken) {
    this.view.authenticated(user, authToken);
  }

  protected async doAuthenticateOperation(
    authOperation: () => Promise<[User, AuthToken]>,
    operationDescription: string
  ) {
    this.setLoadingState(true);
    try {
      const [user, authToken] = await authOperation();
      this.authenticated(user, authToken);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Unable to ${operationDescription}. Please try again.`;

      this.displayErrorMessage(errorMessage); // Use the error message directly
    } finally {
      this.setLoadingState(false);
    }
  }
}
