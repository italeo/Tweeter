import { User } from "tweeter-shared";
import { DynamoFollowDAO } from "../../dao/dynamodb/DynamoFollowDAO";
import { DynamoUserDAO } from "../../dao/dynamodb/DynamoUserDAO";
import { DynamoS3ProfileImageDAO } from "../../dao/s3/DynamoS3ProfileImageDAO";

// Configuration
const mainUsername = "@ish";
const baseFollowerAlias = "@donald";
const followerPassword = "password";
const followerImageUrl =
  "https://faculty.cs.byu.edu/~jwilkerson/cs340/tweeter/images/donald_duck.png";
const baseFollowerFirstName = "Donald";
const baseFollowerLastName = "Duck";

const numUsersToCreate = 10000;
const batchSize = 25;

// DAOs
const profileImageDAO = new DynamoS3ProfileImageDAO();
const userDao = new DynamoUserDAO(profileImageDAO);
const followDao = new DynamoFollowDAO();

async function main() {
  console.log("Starting batch loading...");

  console.log(`Ensuring ${mainUsername} exists...`);
  await ensureMainUser();

  console.log("Creating users...");
  await createUsers(0);

  console.log("Creating follower relationships...");
  await createFollows(0);

  console.log("Batch loading complete!");
}

async function ensureMainUser() {
  const mainUser = new User(
    "Ishmael",
    "Taleo",
    mainUsername,
    followerImageUrl,
    followerPassword
  );

  try {
    const existingUser = await userDao.getUserByAlias(mainUsername);
    if (existingUser) {
      console.log(`${mainUsername} already exists.`);
    } else {
      console.log(`${mainUsername} not found. Creating now...`);
      await userDao.createUser(mainUser);
      console.log(`${mainUsername} created successfully.`);
    }
  } catch (error) {
    console.error(`Error ensuring ${mainUsername} exists:`, error);
    throw error;
  }
}

async function createUsers(createdCount: number) {
  const users = [];
  for (
    let i = createdCount;
    i < createdCount + batchSize && i < numUsersToCreate;
    i++
  ) {
    const alias = `${baseFollowerAlias}${i + 1}`;
    const user = new User(
      `${baseFollowerFirstName}_${i + 1}`,
      `${baseFollowerLastName}_${i + 1}`,
      alias,
      followerImageUrl,
      followerPassword
    );
    users.push(user);
  }

  try {
    await Promise.all(users.map((user) => userDao.createUser(user)));
    console.log(
      `Created users from ${createdCount} to ${createdCount + users.length}`
    );
  } catch (error) {
    console.error("Error creating users:", error);
    throw error;
  }

  if (createdCount + batchSize < numUsersToCreate) {
    await createUsers(createdCount + batchSize);
  }
}

async function createFollowsWithRetries(followers: string[], retries = 3) {
  let attempts = 0;
  while (attempts < retries) {
    try {
      await Promise.all(
        followers.map((followerAlias) =>
          followDao.followUser(followerAlias, mainUsername)
        )
      );
      return;
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "__type" in error &&
        (error as any).__type === "ProvisionedThroughputExceededException"
      ) {
        attempts++;
        console.log(
          `Retrying batch write due to throughput limit (Attempt ${attempts})...`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
      } else {
        console.error(
          "Unhandled error:",
          error,
          error instanceof Error ? error.stack : ""
        );
        throw error;
      }
    }
  }
  throw new Error("Failed to process batch after multiple retries.");
}

async function createFollows(createdCount: number) {
  const followers = [];
  for (
    let i = createdCount;
    i < createdCount + batchSize && i < numUsersToCreate;
    i++
  ) {
    const alias = `${baseFollowerAlias}${i + 1}`;
    followers.push(alias);
  }

  try {
    await createFollowsWithRetries(followers);
    console.log(
      `Created follower relationships from ${createdCount} to ${
        createdCount + followers.length
      }`
    );
  } catch (error) {
    console.error("Error creating follower relationships:", error);
    throw error;
  }

  if (createdCount + batchSize < numUsersToCreate) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await createFollows(createdCount + batchSize);
  }
}

main().catch((err) => {
  console.error("Error during batch loading:", err);
});
