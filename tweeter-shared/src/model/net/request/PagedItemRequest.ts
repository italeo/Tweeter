import { TweeterRequest } from "./TweeterRequest";

export interface PagedItemRequest<T> extends TweeterRequest {
  readonly userAlias: string;
  readonly pageSize: number;
  readonly lastItem: T | null;
}
