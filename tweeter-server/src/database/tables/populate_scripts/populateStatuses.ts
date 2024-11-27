import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { FakeData, Status } from "tweeter-shared";

const client = new DynamoDBClient({ region: "us-west-2" });

const addStatus = async (status: Status) => {
  const aliasWithAt = status.user.alias.startsWith("@")
    ? status.user.alias
    : `@${status.user.alias}`;

  const params = {
    TableName: "Statuses",
    Item: {
      alias: { S: aliasWithAt },
      timestamp: { N: status.timestamp.toString() },
      post: { S: status.post },
    },
  };

  try {
    await client.send(new PutItemCommand(params));
    console.log(`Status for user ${aliasWithAt} added successfully!`);
  } catch (error) {
    console.error(`Error adding status for user ${aliasWithAt}:`, error);
  }
};

export const populateStatuses = async () => {
  const fakeData = FakeData.instance;
  console.log("Populating Statuses table...");
  for (const status of fakeData.fakeStatuses) {
    await addStatus(status);
  }
  console.log("Statuses table populated successfully!");
};

populateStatuses();
