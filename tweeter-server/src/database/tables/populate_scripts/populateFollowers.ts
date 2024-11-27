import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { FakeData } from "tweeter-shared";

const client = new DynamoDBClient({ region: "us-west-2" });

const incrementFollowersCount = async (alias: string) => {
  const params = {
    TableName: "Users",
    Key: { alias: { S: alias } },
    UpdateExpression: "SET followersCount = followersCount + :inc",
    ExpressionAttributeValues: { ":inc": { N: "1" } },
  };

  try {
    await client.send(new UpdateItemCommand(params));
    console.log(`Followers count incremented for user ${alias}.`);
  } catch (error) {
    console.error(
      `Error incrementing followers count for user ${alias}:`,
      error
    );
  }
};

const incrementFollowingCount = async (alias: string) => {
  const params = {
    TableName: "Users",
    Key: { alias: { S: alias } },
    UpdateExpression: "SET followingCount = followingCount + :inc",
    ExpressionAttributeValues: { ":inc": { N: "1" } },
  };

  try {
    await client.send(new UpdateItemCommand(params));
    console.log(`Following count incremented for user ${alias}.`);
  } catch (error) {
    console.error(
      `Error incrementing following count for user ${alias}:`,
      error
    );
  }
};

const addFollow = async (followeeAlias: string, followerAlias: string) => {
  const params = {
    TableName: "Followers",
    Item: {
      followeeAlias: { S: followeeAlias },
      followerAlias: { S: followerAlias },
    },
  };

  try {
    await client.send(new PutItemCommand(params));
    console.log(
      `Follow relationship: ${followerAlias} -> ${followeeAlias} added successfully!`
    );
    await incrementFollowersCount(followeeAlias);
    await incrementFollowingCount(followerAlias);
  } catch (error) {
    console.error(
      `Error adding follow relationship: ${followerAlias} -> ${followeeAlias}:`,
      error
    );
  }
};

export const populateFollowers = async () => {
  const fakeData = FakeData.instance;
  console.log("Populating Followers table...");
  const users = fakeData.fakeUsers;
  for (let i = 0; i < users.length; i++) {
    const follower = users[i];
    const followee = users[(i + 1) % users.length];
    await addFollow(followee.alias, follower.alias);
  }
  console.log("Followers table populated successfully!");
};

populateFollowers();
