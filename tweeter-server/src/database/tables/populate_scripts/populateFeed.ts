import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { FakeData, Status } from "tweeter-shared";

const client = new DynamoDBClient({ region: "us-west-2" });

const addFeedItem = async (userAlias: string, status: Status) => {
  const userAliasWithAt = userAlias.startsWith("@")
    ? userAlias
    : `@${userAlias}`;
  const authorAliasWithAt = status.user.alias.startsWith("@")
    ? status.user.alias
    : `@${status.user.alias}`;

  const params = {
    TableName: "Feed",
    Item: {
      alias: { S: userAliasWithAt },
      timestamp: { N: status.timestamp.toString() },
      post: { S: status.post },
      authorAlias: { S: authorAliasWithAt },
    },
  };

  try {
    await client.send(new PutItemCommand(params));
    console.log(
      `Feed item added for user ${userAliasWithAt} from ${authorAliasWithAt}!`
    );
  } catch (error) {
    console.error(`Error adding feed item for user ${userAliasWithAt}:`, error);
  }
};

export const populateFeed = async () => {
  const fakeData = FakeData.instance;
  console.log("Populating Feed table...");
  for (const user of fakeData.fakeUsers) {
    for (const status of fakeData.fakeStatuses) {
      await addFeedItem(user.alias, status);
    }
  }
  console.log("Feed table populated successfully!");
};

populateFeed();
