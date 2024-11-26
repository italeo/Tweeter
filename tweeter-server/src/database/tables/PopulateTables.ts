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
  const hashedPassword = await bcrypt.hash(user.password, 10);

  const params = {
    TableName: "Users",
    Item: {
      alias: { S: user.alias },
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
    console.log(`User ${user.alias} added successfully!`);
  } catch (error) {
    console.error(`Error adding user ${user.alias}:`, error);
  }
};

//
// Increment Followers Count
//
const incrementFollowersCount = async (alias: string) => {
  const params = {
    TableName: "Users",
    Key: {
      alias: { S: alias },
    },
    UpdateExpression: "SET followersCount = followersCount + :inc",
    ExpressionAttributeValues: {
      ":inc": { N: "1" },
    },
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

//
// Increment Following Count
//
const incrementFollowingCount = async (alias: string) => {
  const params = {
    TableName: "Users",
    Key: {
      alias: { S: alias },
    },
    UpdateExpression: "SET followingCount = followingCount + :inc",
    ExpressionAttributeValues: {
      ":inc": { N: "1" },
    },
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

//
// Add Followers/Followees
//
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

    // Update followersCount for followee and followingCount for follower
    await incrementFollowersCount(followeeAlias);
    await incrementFollowingCount(followerAlias);
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
  const params = {
    TableName: "Statuses",
    Item: {
      alias: { S: status.user.alias },
      timestamp: { N: status.timestamp.toString() },
      post: { S: status.post },
    },
  };

  try {
    await client.send(new PutItemCommand(params));
    console.log(`Status for user ${status.user.alias} added successfully!`);
  } catch (error) {
    console.error(`Error adding status for user ${status.user.alias}:`, error);
  }
};

//
// Add Feeds
//
const addFeedItem = async (userAlias: string, status: Status) => {
  const params = {
    TableName: "Feed",
    Item: {
      alias: { S: userAlias },
      timestamp: { N: status.timestamp.toString() },
      post: { S: status.post },
      authorAlias: { S: status.user.alias },
    },
  };

  try {
    await client.send(new PutItemCommand(params));
    console.log(
      `Feed item added for user ${userAlias} from ${status.user.alias}!`
    );
  } catch (error) {
    console.error(
      `Error adding feed item for user ${userAlias} from ${status.user.alias}:`,
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
