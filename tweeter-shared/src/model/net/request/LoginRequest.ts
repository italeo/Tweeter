import { TweeterRequest } from "./TweeterRequest";

export interface LoginRequest extends Omit<TweeterRequest, "token"> {
  readonly alias: string;
  readonly password: string;
}
