import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { User, FakeData } from "tweeter-shared";
import bcrypt from "bcryptjs";

const client = new DynamoDBClient({ region: "us-west-2" });

const addUser = async (user: User) => {
  const aliasWithAt = user.alias.startsWith("@")
    ? user.alias
    : `@${user.alias}`;
  const hashedPassword = await bcrypt.hash(user.password, 10);

  const params = {
    TableName: "Users",
    Item: {
      alias: { S: aliasWithAt },
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
    console.log(`User ${aliasWithAt} added successfully!`);
  } catch (error) {
    console.error(`Error adding user ${aliasWithAt}:`, error);
  }
};

export const populateUsers = async () => {
  const fakeData = FakeData.instance;
  console.log("Populating Users table...");
  for (const user of fakeData.fakeUsers) {
    await addUser(user);
  }
  console.log("Users table populated successfully!");
};

populateUsers();
