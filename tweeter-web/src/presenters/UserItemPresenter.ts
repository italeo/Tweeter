import { AuthToken, User } from "tweeter-shared";

export interface UserItemView {
  addItems: (newItems: User[]) => void;
  displayErrorMessage: (message: string) => void;
}

export abstract class UserItemPresenter {
  private hasMoreItems = true;
  private lastItem: User | null = null;

  private _view: UserItemView;

  protected constructor(view: UserItemView) {
    this._view = view;
  }

  protected get view() {
    return this._view;
  }

  reset() {
    this.lastItem = null;
    this.hasMoreItems = true;
  }
  public abstract loadMoreItems(authToken: AuthToken, userAlias: string): void;
}
