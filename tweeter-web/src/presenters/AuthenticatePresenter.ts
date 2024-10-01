import { User, AuthToken } from "tweeter-shared";
import { UserService } from "../model/service/UserService";

export interface AuthView {
  authenticated: (user: User, authToken: AuthToken) => void;
  displayErrorMessage: (message: string) => void;
  setLoadingState: (isLoading: boolean) => void;
}

export class AuthenticatePresenter {
  protected userService: UserService;
  private view: AuthView;

  constructor(view: AuthView) {
    this.userService = new UserService();
    this.view = view;
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
}
