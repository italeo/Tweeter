import { TweeterResponse } from "tweeter-shared";

export async function handleCountRequest(
  serviceMethod: () => Promise<number>
): Promise<TweeterResponse & { count: number }> {
  const count = await serviceMethod();

  return {
    success: true,
    message: null,
    count: count,
  };
}
