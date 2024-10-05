import { AuthToken, Status } from "tweeter-shared";
import { View, Presenter } from "./Presenter";

export interface StatusItemView extends View {
  addItems: (newItems: Status[]) => void;
}

export abstract class StatusItemPresenter extends Presenter {
  private _hasMoreItems = true;
  private _lastItem: Status | null = null;

  protected constructor(view: View) {
    super(view);
  }

  public get hasMoreItems() {
    return this._hasMoreItems;
  }

  protected set hasMoreItems(value: boolean) {
    this._hasMoreItems = value;
  }

  protected get lastItem() {
    return this._lastItem;
  }

  protected set lastItem(value: Status | null) {
    this._lastItem = value;
  }

  reset() {
    this.lastItem = null;
    this.hasMoreItems = true;
  }

  public abstract loadMoreItems(authToken: AuthToken, userAlias: string): void;
}
