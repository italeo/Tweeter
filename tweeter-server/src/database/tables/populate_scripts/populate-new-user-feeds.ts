import {
  DynamoDBClient,
  ScanCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { FakeData, Status } from "tweeter-shared";

const client = new DynamoDBClient({ region: "us-west-2" });
const FEED_TABLE_NAME = "Feed";
const USERS_TABLE_NAME = "Users";

const fakeData = FakeData.instance;

/**
 * Fetches all users from the Users table.
 * @returns {Promise<Set<string>>} A set of user aliases.
 */
const getAllUsersFromTable = async (): Promise<Set<string>> => {
  const params = {
    TableName: USERS_TABLE_NAME,
  };

  try {
    const command = new ScanCommand(params);
    const result = await client.send(command);

    // Map the aliases, filter out undefined, and add them to the Set
    const users =
      result.Items?.map((item) => item.alias?.S).filter(
        (alias): alias is string => alias !== undefined
      ) ?? [];
    return new Set(users);
  } catch (error) {
    console.error("Error fetching users from Users table:", error);
    throw error;
  }
};

/**
 * Checks if the user already has feed items.
 * @param userAlias - The alias of the user to check.
 * @returns {Promise<boolean>} True if the user has feed items, false otherwise.
 */
const userHasFeedItems = async (userAlias: string): Promise<boolean> => {
  const params = {
    TableName: FEED_TABLE_NAME,
    FilterExpression: "alias = :alias",
    ExpressionAttributeValues: {
      ":alias": { S: userAlias },
    },
  };

  try {
    const command = new ScanCommand(params);
    const result = await client.send(command);
    return (result.Count ?? 0) > 0;
  } catch (error) {
    console.error(`Error checking feed for user ${userAlias}:`, error);
    return false;
  }
};

/**
 * Adds a feed item for a user.
 * @param userAlias - The alias of the user to populate the feed for.
 * @param status - A status object to add to the feed.
 */
const addFeedItem = async (
  userAlias: string,
  status: Status
): Promise<void> => {
  const params = {
    TableName: FEED_TABLE_NAME,
    Item: {
      alias: { S: userAlias },
      timestamp: { N: status.timestamp.toString() },
      post: { S: status.post },
      authorAlias: { S: status.user.alias },
    },
  };

  try {
    await client.send(new PutItemCommand(params));
    console.log(`Added feed item for user ${userAlias}.`);
  } catch (error) {
    console.error(`Error adding feed item for user ${userAlias}:`, error);
  }
};

/**
 * Populates the feed for all new users.
 */
const populateFeedForNewUsers = async (): Promise<void> => {
  try {
    console.log("Fetching existing users...");
    const existingUsers = await getAllUsersFromTable();

    console.log("Checking for new users...");
    for (const user of fakeData.fakeUsers) {
      const userAlias = user.alias;

      if (!existingUsers.has(userAlias)) {
        console.log(`New user detected: ${userAlias}. Populating feed...`);

        for (const status of fakeData.fakeStatuses) {
          await addFeedItem(userAlias, status);
        }

        console.log(`Feed populated for new user: ${userAlias}.`);
      } else {
        console.log(`User ${userAlias} already exists in the Users table.`);
      }
    }
  } catch (error) {
    console.error("Error populating feed for new users:", error);
  }
};

// Run the script
(async () => {
  try {
    console.log("Starting to populate feeds for new users...");
    await populateFeedForNewUsers();
    console.log("Feed population complete.");
  } catch (error) {
    console.error("Unexpected error:", error);
  }
})();
