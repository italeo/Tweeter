import { TweeterResponse } from "./TweeterResponse";

export interface GetFolloweeCountResponse extends TweeterResponse {
  readonly count: number;
}
