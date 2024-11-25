import { DynamoFeedDAO } from "../database/dao/dynamodb/DynamoFeedDAO";
import { Status } from "tweeter-shared";
import { User } from "tweeter-shared";

async function testGetFeedForUser() {
  const feedDAO = new DynamoFeedDAO();

  // Test with a valid userAlias
  const userAlias = "@dee";
  const pageSize = 5;

  console.log(`Testing getFeedForUser for alias: ${userAlias}`);
  try {
    const { statuses, hasMore } = await feedDAO.getFeedForUser(
      userAlias,
      pageSize
    );

    console.log(`Statuses fetched for alias ${userAlias}:`, statuses);
    console.log(`Has more: ${hasMore}`);
    statuses.forEach((status, index) => {
      console.log(`Status ${index + 1}:`, {
        post: status.post,
        authorAlias: status.user.alias,
        timestamp: status.timestamp,
      });
    });
  } catch (error) {
    console.error(`Error fetching feed for alias ${userAlias}:`, error);
  }

  // Test with an invalid userAlias
  const invalidAlias = "@nonexistent";
  console.log(`Testing getFeedForUser for alias: ${invalidAlias}`);
  try {
    const { statuses, hasMore } = await feedDAO.getFeedForUser(
      invalidAlias,
      pageSize
    );
    console.log(`Statuses fetched for alias ${invalidAlias}:`, statuses);
    console.log(`Has more: ${hasMore}`);
  } catch (error) {
    console.error(`Error fetching feed for alias ${invalidAlias}:`, error);
  }

  // Test with valid alias and lastItem
  const lastItemUser = new User(
    "Allen",
    "Anderson",
    "@allen",
    "https://faculty.cs.byu.edu/~jwilkerson/cs340/tweeter/images/donald_duck.png",
    "password123"
  );
  const lastItem: Status = new Status(
    "Post 0 0 My friend @amy likes this website: http://byu.edu. Do you?",
    lastItemUser,
    0
  );
  console.log(
    `Testing getFeedForUser for alias ${userAlias} with lastItem:`,
    lastItem
  );
  try {
    const { statuses, hasMore } = await feedDAO.getFeedForUser(
      userAlias,
      pageSize,
      lastItem
    );

    console.log(
      `Statuses fetched for alias ${userAlias} with lastItem:`,
      statuses
    );
    console.log(`Has more: ${hasMore}`);
  } catch (error) {
    console.error(
      `Error fetching feed for alias ${userAlias} with lastItem:`,
      error
    );
  }
}

// Run the test
testGetFeedForUser().catch((error) => {
  console.error("Test failed with error:", error);
});
