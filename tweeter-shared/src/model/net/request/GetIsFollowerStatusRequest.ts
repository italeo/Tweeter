import { UserDto } from "../../dto/UserDto";
import { TweeterRequest } from "./TweeterRequest";

export interface GetIsFollowerStatusRequest extends TweeterRequest {
  readonly user: UserDto;
  readonly selectedUser: UserDto;
}
