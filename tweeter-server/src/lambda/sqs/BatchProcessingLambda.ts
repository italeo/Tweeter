import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqsClient = new SQSClient({ region: "us-west-2" });

const FEED_UPDATE_QUEUE_URL =
  "https://sqs.us-west-2.amazonaws.com/506149017946/BatchProcessingQueue";

function splitIntoBatches(array: any[], batchSize: number): any[][] {
  const batches = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

export const handler = async (event: any) => {
  console.log("Received SQS Event:", JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    try {
      // Parse the SQS message
      const messageBody = JSON.parse(record.body);
      const { followers, status } = messageBody;

      if (!followers || !status) {
        console.error("Invalid message format. Skipping:", messageBody);
        continue;
      }

      console.log(`Processing batch for status: ${status.authorAlias}`);

      // Split followers into manageable batches
      const followerBatches = splitIntoBatches(followers, 500);
      for (const batch of followerBatches) {
        // Construct a message for each batch
        const message = {
          followers: batch,
          status, // Pass the entire status object
        };

        const sqsParams = {
          QueueUrl: FEED_UPDATE_QUEUE_URL,
          MessageBody: JSON.stringify(message),
        };

        // Send message to FeedUpdateQueue
        await sqsClient.send(new SendMessageCommand(sqsParams));
        console.log(
          `Batch of ${batch.length} followers sent to FeedUpdateQueue.`
        );
      }
    } catch (error) {
      console.error("Error processing message:", error);
      // Optionally handle failed messages (e.g., send to Dead Letter Queue)
    }
  }

  console.log("Batch processing Lambda completed.");
};
