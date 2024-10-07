import { AuthToken, User } from "tweeter-shared";
import { UserService } from "../model/service/UserService";
import { View, Presenter } from "./Presenter";

export interface NavigateView extends View {
  setDisplayedUser: (user: User) => void;
}
export class NavigationPresenter extends Presenter<NavigateView> {
  private userService: UserService;

  public constructor(view: NavigateView) {
    super(view);
    this.userService = new UserService();
  }

  public async navigateToUserCustom(
    authToken: AuthToken,
    currentUser: User,
    event: React.MouseEvent
  ) {
    event.preventDefault();

    this.doFailureReportingOperation(async () => {
      const alias = this.extractAlias(event.target.toString());

      const user = await this.userService.getUser(authToken!, alias);

      if (!!user) {
        if (currentUser!.equals(user)) {
          this.view.setDisplayedUser(currentUser!);
        } else {
          this.view.setDisplayedUser(user);
        }
      }
    }, "get user");
  }

  private extractAlias(value: string): string {
    const index = value.indexOf("@");
    return value.substring(index);
  }
}
