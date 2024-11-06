import { TweeterRequest } from "./TweeterRequest";

export interface GetUserRequest extends TweeterRequest {
  readonly alias: string;
}
