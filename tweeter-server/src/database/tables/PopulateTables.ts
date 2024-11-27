import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
} from "@aws-sdk/client-dynamodb";
import { AuthToken, FakeData, Status, User } from "tweeter-shared";
import bcrypt from "bcryptjs";

const client = new DynamoDBClient({ region: "us-west-2" });

//
// Add Users
//
const addUser = async (user: User) => {
  const aliasWithoutAt = user.alias.replace(/^@/, ""); // Remove '@' from alias
  const hashedPassword = await bcrypt.hash(user.password, 10);

  const params = {
    TableName: "Users",
    Item: {
      alias: { S: aliasWithoutAt },
      firstName: { S: user.firstName },
      lastName: { S: user.lastName },
      imageUrl: { S: user.imageUrl },
      passwordHash: { S: hashedPassword },
      followersCount: { N: "0" },
      followingCount: { N: "0" },
    },
  };

  try {
    await client.send(new PutItemCommand(params));
    console.log(`User ${aliasWithoutAt} added successfully!`);
  } catch (error) {
    console.error(`Error adding user ${aliasWithoutAt}:`, error);
  }
};

//
const incrementFollowersCount = async (alias: string) => {
  const aliasWithoutAt = alias.replace(/^@/, ""); // Remove '@' if present

  const params = {
    TableName: "Users",
    Key: {
      alias: { S: aliasWithoutAt },
    },
    UpdateExpression: "SET followersCount = followersCount + :inc",
    ExpressionAttributeValues: {
      ":inc": { N: "1" },
    },
  };

  try {
    await client.send(new UpdateItemCommand(params));
    console.log(`Followers count incremented for user ${aliasWithoutAt}.`);
  } catch (error) {
    console.error(
      `Error incrementing followers count for user ${aliasWithoutAt}:`,
      error
    );
  }
};

const incrementFollowingCount = async (alias: string) => {
  const aliasWithoutAt = alias.replace(/^@/, ""); // Remove '@' if present

  const params = {
    TableName: "Users",
    Key: {
      alias: { S: aliasWithoutAt },
    },
    UpdateExpression: "SET followingCount = followingCount + :inc",
    ExpressionAttributeValues: {
      ":inc": { N: "1" },
    },
  };

  try {
    await client.send(new UpdateItemCommand(params));
    console.log(`Following count incremented for user ${aliasWithoutAt}.`);
  } catch (error) {
    console.error(
      `Error incrementing following count for user ${aliasWithoutAt}:`,
      error
    );
  }
};

//
// Add Followers/Followees
//
const addFollow = async (followeeAlias: string, followerAlias: string) => {
  const followeeAliasWithoutAt = followeeAlias.replace(/^@/, "");
  const followerAliasWithoutAt = followerAlias.replace(/^@/, "");

  const params = {
    TableName: "Followers",
    Item: {
      followeeAlias: { S: followeeAliasWithoutAt },
      followerAlias: { S: followerAliasWithoutAt },
    },
  };

  try {
    await client.send(new PutItemCommand(params));
    console.log(
      `Follow relationship: ${followerAlias} -> ${followeeAlias} added successfully!`
    );

    // Update followersCount for followee and followingCount for follower
    await incrementFollowersCount(followeeAliasWithoutAt);
    await incrementFollowingCount(followerAliasWithoutAt);
  } catch (error) {
    console.error(
      `Error adding follow relationship: ${followerAlias} -> ${followeeAlias}:`,
      error
    );
  }
};

//
// Add Status
//
const addStatus = async (status: Status) => {
  const aliasWithoutAt = status.user.alias.replace(/^@/, "");

  const params = {
    TableName: "Statuses",
    Item: {
      alias: { S: aliasWithoutAt },
      timestamp: { N: status.timestamp.toString() },
      post: { S: status.post },
    },
  };

  try {
    await client.send(new PutItemCommand(params));
    console.log(`Status for user ${aliasWithoutAt} added successfully!`);
  } catch (error) {
    console.error(`Error adding status for user ${aliasWithoutAt}:`, error);
  }
};

//
// Add Feeds
//
const addFeedItem = async (userAlias: string, status: Status) => {
  const aliasWithoutAt = userAlias.replace(/^@/, "");
  const authorAliasWithAt = `@${status.user.alias.replace(/^@/, "")}`; // Add '@' dynamically

  const params = {
    TableName: "Feed",
    Item: {
      alias: { S: aliasWithoutAt },
      timestamp: { N: status.timestamp.toString() },
      post: { S: status.post },
      authorAlias: { S: authorAliasWithAt },
    },
  };

  try {
    await client.send(new PutItemCommand(params));
    console.log(
      `Feed item added for user ${aliasWithoutAt} from ${authorAliasWithAt}!`
    );
  } catch (error) {
    console.error(
      `Error adding feed item for user ${aliasWithoutAt} from ${authorAliasWithAt}:`,
      error
    );
  }
};

//
// Add AuthTokens
//
const addAuthToken = async (authToken: AuthToken) => {
  const params = {
    TableName: "AuthTokens",
    Item: {
      token: { S: authToken.token },
      timestamp: { N: authToken.timestamp.toString() },
    },
  };

  try {
    await client.send(new PutItemCommand(params));
    console.log(`AuthToken ${authToken.token} added successfully!`);
  } catch (error) {
    console.error(`Error adding AuthToken ${authToken.token}:`, error);
  }
};

//
// Populate Tables
//
const populateTables = async () => {
  const fakeData = FakeData.instance;

  console.log("Populating Users table...");
  for (const user of fakeData.fakeUsers) {
    await addUser(user);
  }

  console.log("Populating Followers table...");
  const users = fakeData.fakeUsers;
  for (let i = 0; i < users.length; i++) {
    const follower = users[i];
    const followee = users[(i + 1) % users.length];
    await addFollow(followee.alias, follower.alias);
  }

  console.log("Populating Statuses table...");
  for (const status of fakeData.fakeStatuses) {
    await addStatus(status);
  }

  console.log("Populating Feed table...");
  for (const user of fakeData.fakeUsers) {
    const statuses = fakeData.fakeStatuses;
    for (const status of statuses) {
      await addFeedItem(user.alias, status);
    }
  }

  console.log("Populating AuthTokens table...");
  const authToken = fakeData.authToken;
  await addAuthToken(authToken);

  console.log("Tables populated successfully!");
};

populateTables();
