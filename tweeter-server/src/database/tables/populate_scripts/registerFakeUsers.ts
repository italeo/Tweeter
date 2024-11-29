import { FakeData, RegisterRequest } from "tweeter-shared";
import { handler as registerHandler } from "../../../lambda/user/GetRegisterLambda";

// Function to throttle batch processing
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Populate Users Function
const populateUsers = async () => {
  const fakeUsers = FakeData.instance.fakeUsers;
  const BATCH_SIZE = 5;
  const DELAY_BETWEEN_BATCHES = 2000;

  console.log(`Starting to populate users... Total users: ${fakeUsers.length}`);

  for (let i = 0; i < fakeUsers.length; i += BATCH_SIZE) {
    const userBatch = fakeUsers.slice(i, i + BATCH_SIZE);

    console.log(`Processing batch: ${i / BATCH_SIZE + 1}`);

    for (const user of userBatch) {
      const registerRequest: RegisterRequest = {
        firstName: user.firstName,
        lastName: user.lastName,
        alias: user.alias,
        password: user.password,
        userImageBase64: Buffer.from(user.imageUrl).toString("base64"),
        imageFileExtension: "png",
        token: "dummyToken", // Provide a token
      };

      try {
        const response = await registerHandler(registerRequest);
        console.log(
          `User ${user.alias} registered successfully:`,
          response.success ? "Success" : response.message
        );
      } catch (error) {
        console.error(`Error registering user ${user.alias}:`, error);
      }
    }

    if (i + BATCH_SIZE < fakeUsers.length) {
      console.log("Waiting before processing the next batch...");
      await delay(DELAY_BETWEEN_BATCHES);
    }
  }

  console.log("All users have been processed.");
};

populateUsers()
  .then(() => console.log("User population completed successfully."))
  .catch((error) => console.error("Error populating users:", error));
