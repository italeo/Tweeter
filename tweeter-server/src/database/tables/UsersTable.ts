import {
  DynamoDBClient,
  CreateTableCommand,
  ScalarAttributeType,
  KeyType,
} from "@aws-sdk/client-dynamodb";

const createUsersTable = async () => {
  const client = new DynamoDBClient({ region: "us-west-2" });

  const params = {
    TableName: "Users",
    KeySchema: [{ AttributeName: "alias", KeyType: "HASH" as KeyType }],
    AttributeDefinitions: [
      { AttributeName: "alias", AttributeType: "S" as ScalarAttributeType },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };

  try {
    const data = await client.send(new CreateTableCommand(params));
    console.log("Users Table created successfully:", data);
  } catch (error) {
    console.error("Error creating Users Table:", error);
  }
};

createUsersTable();
