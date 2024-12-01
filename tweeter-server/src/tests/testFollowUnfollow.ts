import { DynamoFollowDAO } from "../database/dao/dynamodb/DynamoFollowDAO";

const testFollowUnfollow = async () => {
  const followDAO = new DynamoFollowDAO();

  // Test Parameters
  const followerAlias = "@testUser1";
  const followeeAlias = "@testUser2";

  console.log("Starting isolated tests for followUser and unfollowUser...");

  try {
    console.log("Testing followUser...");
    await followDAO.followUser(followerAlias, followeeAlias);
    console.log(
      `Follow operation for ${followerAlias} -> ${followeeAlias} completed.`
    );

    console.log("Verifying followUser with isUserFollowing...");
    const isFollowing = await followDAO.isUserFollowing(
      followerAlias,
      followeeAlias
    );
    console.log(`Is ${followerAlias} following ${followeeAlias}?`, isFollowing);

    if (!isFollowing) {
      console.error(
        "Error: followUser did not persist the follow relationship."
      );
    } else {
      console.log("Follow relationship verified successfully.");
    }

    console.log("Testing unfollowUser...");
    await followDAO.unfollowUser(followerAlias, followeeAlias);
    console.log(
      `Unfollow operation for ${followerAlias} -> ${followeeAlias} completed.`
    );

    console.log("Verifying unfollowUser with isUserFollowing...");
    const isStillFollowing = await followDAO.isUserFollowing(
      followerAlias,
      followeeAlias
    );
    console.log(
      `Is ${followerAlias} following ${followeeAlias} after unfollow?`,
      isStillFollowing
    );

    if (isStillFollowing) {
      console.error(
        "Error: unfollowUser did not remove the follow relationship."
      );
    } else {
      console.log("Unfollow relationship verified successfully.");
    }
  } catch (error) {
    console.error("Test encountered an error:", error);
  }
};

// Run the test
testFollowUnfollow();
