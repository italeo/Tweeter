import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { FakeData } from "tweeter-shared";

const client = new DynamoDBClient({ region: "us-west-2" });

const normalizeAlias = (alias: string) =>
  alias.startsWith("@") ? alias : `@${alias}`;

const incrementFollowersCount = async (alias: string) => {
  const normalizedAlias = normalizeAlias(alias);

  const params = {
    TableName: "Users",
    Key: { alias: { S: normalizedAlias } },
    UpdateExpression:
      "SET followersCount = if_not_exists(followersCount, :zero) + :inc",
    ExpressionAttributeValues: { ":inc": { N: "1" }, ":zero": { N: "0" } },
  };

  try {
    await client.send(new UpdateItemCommand(params));
    console.log(`Followers count incremented for user ${normalizedAlias}.`);
  } catch (error) {
    console.error(
      `Error incrementing followers count for user ${normalizedAlias}:`,
      error
    );
  }
};

const incrementFollowingCount = async (alias: string) => {
  const normalizedAlias = normalizeAlias(alias);

  const params = {
    TableName: "Users",
    Key: { alias: { S: normalizedAlias } },
    UpdateExpression:
      "SET followingCount = if_not_exists(followingCount, :zero) + :inc",
    ExpressionAttributeValues: { ":inc": { N: "1" }, ":zero": { N: "0" } },
  };

  try {
    await client.send(new UpdateItemCommand(params));
    console.log(`Following count incremented for user ${normalizedAlias}.`);
  } catch (error) {
    console.error(
      `Error incrementing following count for user ${normalizedAlias}:`,
      error
    );
  }
};

const addFollow = async (followeeAlias: string, followerAlias: string) => {
  const normalizedFolloweeAlias = normalizeAlias(followeeAlias);
  const normalizedFollowerAlias = normalizeAlias(followerAlias);

  // Avoid self-following
  if (normalizedFolloweeAlias === normalizedFollowerAlias) {
    return;
  }

  const params = {
    TableName: "Followers",
    Item: {
      followeeAlias: { S: normalizedFolloweeAlias },
      followerAlias: { S: normalizedFollowerAlias },
    },
  };

  try {
    await client.send(new PutItemCommand(params));
    console.log(
      `Follow relationship: ${normalizedFollowerAlias} -> ${normalizedFolloweeAlias} added successfully!`
    );
    await incrementFollowersCount(normalizedFolloweeAlias);
    await incrementFollowingCount(normalizedFollowerAlias);
  } catch (error) {
    console.error(
      `Error adding follow relationship: ${normalizedFollowerAlias} -> ${normalizedFolloweeAlias}:`,
      error
    );
  }
};

export const populateFollowers = async () => {
  const fakeData = FakeData.instance;
  console.log("Populating Followers table...");

  const users = fakeData.fakeUsers.map((user) => normalizeAlias(user.alias));
  const userCount = users.length;

  for (let i = 0; i < userCount; i++) {
    const follower = users[i];

    // Add 5 followees for the current user
    for (let j = 1; j <= 5; j++) {
      const followee = users[(i + j) % userCount];
      await addFollow(followee, follower);
    }

    // Add 5 followers for the current user
    for (let j = 1; j <= 5; j++) {
      const followerForCurrent = users[(i - j + userCount) % userCount];
      await addFollow(users[i], followerForCurrent);
    }
  }

  console.log("Followers table populated successfully!");
};

populateFollowers();
