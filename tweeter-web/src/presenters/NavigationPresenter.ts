import { AuthToken, User } from "tweeter-shared";
import { UserService } from "../model/service/UserService";

export interface NavigateView {
  displayErrorMessage: (message: string) => void;
  setDisplayedUser: (user: User) => void;
}
export class NavigationPresenter {
  private view: NavigateView;
  private userService: UserService;

  public constructor(view: NavigateView) {
    this.view = view;
    this.userService = new UserService();
  }

  public async navigateToUserCustom(
    authToken: AuthToken,
    currentUser: User,
    event: React.MouseEvent
  ) {
    event.preventDefault();

    try {
      const alias = this.extractAlias(event.target.toString());

      const user = await this.userService.getUser(authToken!, alias);

      if (!!user) {
        if (currentUser!.equals(user)) {
          this.view.setDisplayedUser(currentUser!);
        } else {
          this.view.setDisplayedUser(user);
        }
      }
    } catch (error) {
      this.view.displayErrorMessage(
        `Failed to get user because of exception: ${error}`
      );
    }
  }

  private extractAlias(value: string): string {
    const index = value.indexOf("@");
    return value.substring(index);
  }
}
