import "isomorphic-fetch";
import { ServerFacade } from "../../../src/model/network/ServerFacade";
import { AuthToken, RegisterRequest, UserDto } from "tweeter-shared";

describe("ServerFacade Integration Test", () => {
  const serverFacade = ServerFacade.getInstance();

  // Register User Test
  test("Register a new user", async () => {
    const registerRequest: RegisterRequest = {
      firstName: "Allen",
      lastName: "Anderson",
      alias: "@allen",
      password: "password123",
      userImageBase64: "",
      imageFileExtension: ".png",
      token: "dummy_token_for_registration",
    };

    const [user, authToken] = await serverFacade.register(registerRequest);
    expect(user).toBeDefined();
    expect(user.alias).toBe("@allen");
    expect(authToken).toBeInstanceOf(AuthToken);
  });

  // Get Followers Test
  test("Get followers", async () => {
    const authToken: AuthToken = new AuthToken("dummyToken", Date.now());
    const userAlias = "@exampleUser";
    const pageSize = 10;
    const lastItem: UserDto | null = null;

    const [followers, hasMore] = await serverFacade.getMoreFollowers({
      token: authToken.token,
      userAlias,
      pageSize,
      lastItem,
    });

    expect(Array.isArray(followers)).toBe(true);
    expect(followers.length).toBeLessThanOrEqual(pageSize);
    expect(typeof hasMore).toBe("boolean");
  });

  // Get Followee Count Test
  test("Get followee count", async () => {
    const authToken: AuthToken = new AuthToken("dummyToken", Date.now());
    const userDto: UserDto = {
      alias: "@exampleUser",
      firstName: "Example",
      lastName: "User",
      imageUrl: "https://example.com/user-image.png",
    };

    const followeeCount = await serverFacade.getFolloweeCount(
      authToken.token,
      userDto
    );

    expect(typeof followeeCount).toBe("number");
    expect(followeeCount).toBeGreaterThanOrEqual(0);
  });

  // Get Follower Count Test
  test("Get follower count", async () => {
    const authToken: AuthToken = new AuthToken("dummyToken", Date.now());
    const userDto: UserDto = {
      alias: "@exampleUser",
      firstName: "Example",
      lastName: "User",
      imageUrl: "https://example.com/user-image.png",
    };

    const followerCount = await serverFacade.getFollowerCount(
      authToken.token,
      userDto
    );

    expect(typeof followerCount).toBe("number");
    expect(followerCount).toBeGreaterThanOrEqual(0);
  });
});
