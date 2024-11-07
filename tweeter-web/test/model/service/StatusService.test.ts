import "isomorphic-fetch";
import { StatusService } from "../../../src/model/service/StatusService";
import { AuthToken } from "tweeter-shared";

describe("StatusService Integration Tests", () => {
  const statusService = new StatusService();

  // Returns A User's Story Pages
  test("Retrieve a user's story", async () => {
    const authToken: AuthToken = new AuthToken("dummyAuthToken", Date.now());
    const userAlias = "@exampleUser";
    const pageSize = 10;
    const lastItem = null;

    const [statuses, hasMore] = await statusService.loadMoreStoryItems(
      authToken,
      userAlias,
      pageSize,
      lastItem
    );

    expect(Array.isArray(statuses)).toBe(true);
    expect(statuses.length).toBeLessThanOrEqual(pageSize);
    expect(typeof hasMore).toBe("boolean");
  });
});
