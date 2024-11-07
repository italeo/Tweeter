import { TweeterResponse } from "tweeter-shared";

export async function handlePagedUserRequest<T>(
  serviceMethod: () => Promise<[T[], boolean]>
): Promise<TweeterResponse & { items: T[] | null; hasMore: boolean }> {
  const [items, hasMore] = await serviceMethod();

  return {
    success: true,
    message: null,
    items,
    hasMore,
  };
}
