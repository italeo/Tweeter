import { DynamoFollowDAO } from "../database/dao/dynamodb/DynamoFollowDAO";

describe("DynamoFollowDAO Integration Tests with Actual Users", () => {
  let dao: DynamoFollowDAO;

  beforeEach(() => {
    dao = new DynamoFollowDAO();
  });

  it("should follow and unfollow a user", async () => {
    const followerAlias = "@gary";
    const followeeAlias = "@isabel";

    // Follow the user
    await dao.followUser(followerAlias, followeeAlias);

    // Verify the relationship exists
    const isFollowing = await dao.isUserFollowing(followerAlias, followeeAlias);
    expect(isFollowing).toBe(true);

    // Unfollow the user
    await dao.unfollowUser(followerAlias, followeeAlias);

    // Verify the relationship no longer exists
    const postCheck = await dao.isUserFollowing(followerAlias, followeeAlias);
    expect(postCheck).toBe(false);
  });

  it("should retrieve followers", async () => {
    const userAlias = "@isabel";

    // Add test data
    await dao.followUser("@gary", userAlias);
    await dao.followUser("@fish", userAlias);

    // Retrieve followers
    const { followers } = await dao.getFollowers(userAlias, 10);

    // Ensure followers match expected results
    expect(followers).toEqual(
      expect.arrayContaining([
        {
          alias: "@gary",
          firstName: "Gary",
          lastName: "Gilbert",
          imageUrl:
            "https://faculty.cs.byu.edu/~jwilkerson/cs340/tweeter/images/donald_duck.png",
        },
        {
          alias: "@fish",
          firstName: "Ishmael",
          lastName: "Taleo",
          imageUrl:
            "https://profile-images-tweeter.s3.us-west-2.amazonaws.com/@fish.jpeg",
        },
      ])
    );
  });

  it("should retrieve followees", async () => {
    const userAlias = "@gary";

    // Add test data
    await dao.followUser(userAlias, "@isabel");
    await dao.followUser(userAlias, "@fish");

    // Retrieve followees
    const { followees } = await dao.getFollowees(userAlias, 10);

    // Ensure followees match expected results
    expect(followees).toEqual(
      expect.arrayContaining([
        {
          alias: "@isabel",
          firstName: "Isabel",
          lastName: "Isaacson",
          imageUrl:
            "https://faculty.cs.byu.edu/~jwilkerson/cs340/tweeter/images/daisy_duck.png",
        },
        {
          alias: "@fish",
          firstName: "Ishmael",
          lastName: "Taleo",
          imageUrl:
            "https://profile-images-tweeter.s3.us-west-2.amazonaws.com/@fish.jpeg",
        },
      ])
    );
  });
});
