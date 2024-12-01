import { DynamoFollowDAO } from "../database/dao/dynamodb/DynamoFollowDAO";

async function testFollowUser() {
  const dao = new DynamoFollowDAO();
  const followerAlias = "@testFollower";
  const followeeAlias = "@testFollowee";

  try {
    console.log("Testing followUser...");
    await dao.followUser(followerAlias, followeeAlias);
    console.log(`Successfully followed: ${followerAlias} -> ${followeeAlias}`);
  } catch (error) {
    console.error("Error during followUser test:", error);
  }
}

testFollowUser();
