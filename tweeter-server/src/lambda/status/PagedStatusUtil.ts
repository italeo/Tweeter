import {
  PagedStatusItemRequest,
  PagedStatusItemResponse,
  StatusDto,
} from "tweeter-shared";

export async function handlePagedStatusRequest<T extends StatusDto>(
  serviceMethod: (
    token: string,
    userAlias: string,
    pageSize: number,
    lastItem: T | null
  ) => Promise<[T[], boolean]>,
  request: PagedStatusItemRequest
): Promise<PagedStatusItemResponse> {
  const [items, hasMore] = await serviceMethod(
    request.token,
    request.userAlias,
    request.pageSize,
    request.lastItem as T | null
  );

  return {
    success: true,
    message: null,
    items: items,
    hasMore: hasMore,
  };
}
