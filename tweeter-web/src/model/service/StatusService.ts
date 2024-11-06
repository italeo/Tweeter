import {
  AuthToken,
  Status,
  FakeData,
  PagedStatusItemRequest,
  PostStatusRequest,
  StatusDto,
} from "tweeter-shared";
import { ServerFacade } from "../network/ServerFacade";

export class StatusService {
  private serverFacade = ServerFacade.getInstance();

  public async loadMoreStoryItems(
    authToken: AuthToken,
    userAlias: string,
    pageSize: number,
    lastItem: Status | null
  ): Promise<[Status[], boolean]> {
    const request: PagedStatusItemRequest = {
      token: authToken.token,
      userAlias,
      pageSize,
      lastItem: lastItem ? lastItem.toDto() : null,
    };

    return await this.serverFacade.getMoreStoryItems(request);
  }

  public async loadMoreFeedItems(
    authToken: AuthToken,
    userAlias: string,
    pageSize: number,
    lastItem: Status | null
  ): Promise<[Status[], boolean]> {
    const request: PagedStatusItemRequest = {
      token: authToken.token,
      userAlias: userAlias,
      pageSize: pageSize,
      lastItem: lastItem ? lastItem.toDto() : null,
    };

    return await this.serverFacade.getMoreFeedItems(request);
  }

  public async postStatus(
    authToken: AuthToken,
    newStatus: Status
  ): Promise<void> {
    const request: PostStatusRequest = {
      token: authToken.token,
      status: newStatus.toDto() as StatusDto,
    };
    // Pause so we can see the logging out message. Remove when connected to the server
    await this.serverFacade.postStatus(request.token, request.status);
  }
}
