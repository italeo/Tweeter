import { UserDto } from "../../dto/UserDto";
import { TweeterRequest } from "./TweeterRequest";

export interface GetFollowerCountRequest extends TweeterRequest {
  readonly user: UserDto;
}
