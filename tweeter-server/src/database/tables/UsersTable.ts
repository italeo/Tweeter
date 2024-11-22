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
    KeySchema: [
      { AttributeName: "alias", KeyType: "HASH" as KeyType }, // Primary key
    ],
    AttributeDefinitions: [
      { AttributeName: "alias", AttributeType: "S" as ScalarAttributeType }, // Corresponding attribute definition
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5, // Adjust based on requirements
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
