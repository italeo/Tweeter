import { AuthToken } from "tweeter-shared";
import { Presenter, View } from "./Presenter";

// Generic parnent class for feed and story along with followee and followers.
// It is generic because we are using User for followee and follower and Status for feed and story

export const PAGE_SIZE = 10;

export interface PagedItemView<T> extends View {
  addItems: (items: T[]) => void;
}
export abstract class PagedItemPresenter<T, U> extends Presenter<
  PagedItemView<T>
> {
  private _hasMoreItems = true;
  private _lastItem: T | null = null;
  private _service: U;

  public constructor(view: PagedItemView<T>) {
    super(view);
    this._service = this.createService();
  }

  protected abstract createService(): U;

  protected get service() {
    return this._service;
  }

  public get hasMoreItems() {
    return this._hasMoreItems;
  }

  protected set hasMoreItems(value: boolean) {
    this._hasMoreItems = value;
  }

  public get lastItem(): T | null {
    return this._lastItem;
  }

  public set lastItem(user: T | null) {
    this._lastItem = user;
  }

  public async loadMoreItems(
    authToken: AuthToken,
    userAlias: string
  ): Promise<void> {
    this.doFailureReportingOperation(async () => {
      if (this.hasMoreItems) {
        const [newItems, hasMore] = await this.getMoreItems(
          authToken,
          userAlias
        );

        this.hasMoreItems = hasMore;

        if (newItems.length > 0) {
          this.lastItem = newItems[newItems.length - 1]; // Update to the last fetched item
          this.view.addItems(newItems);
        }
      }
    }, this.getItemDescription());
  }

  protected abstract getMoreItems(
    authToken: AuthToken,
    userAlias: string
  ): Promise<[T[], boolean]>;

  protected abstract getItemDescription(): string;
}
