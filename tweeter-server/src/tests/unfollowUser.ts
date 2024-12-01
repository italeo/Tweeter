import { DynamoFollowDAO } from "../database/dao/dynamodb/DynamoFollowDAO";

async function testUnfollowUser() {
  const dao = new DynamoFollowDAO();
  const followerAlias = "@testFollower";
  const followeeAlias = "@testFollowee";

  try {
    console.log("Testing unfollowUser...");
    await dao.unfollowUser(followerAlias, followeeAlias);
    console.log(
      `Successfully unfollowed: ${followerAlias} -> ${followeeAlias}`
    );
  } catch (error) {
    console.error("Error during unfollowUser test:", error);
  }
}

testUnfollowUser();
