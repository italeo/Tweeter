#!/bin/bash

# use set -e to terminate the script on error
set -e

source .server

aws s3 cp dist.zip s3://$BUCKET/code/lambdalist.zip

# using -e let's us use escape characters such as \n if the output is in quotation marks
echo -e '\n\n\nlambdalist.zip uploaded to the bucket. Updating or creating lambda functions...\n'

# Update or create Lambdas
i=1
PID=0
pids=()
IFS=$'\n' # Set IFS to newline to handle function name and handler pairs properly
for lambda_info in $EDIT_LAMBDALIST
do
    # Extract function name and handler from lambda_info and trim whitespace
    function_name=$(echo "$lambda_info" | cut -d '|' -f 1 | tr -d '[:space:]')
    handler=$(echo "$lambda_info" | cut -d '|' -f 2 | tr -d '[:space:]')

    if aws lambda get-function --function-name "$function_name" &>/dev/null; then
        # Lambda exists, update code
        aws lambda update-function-code \
            --function-name  "$function_name" \
            --s3-bucket $BUCKET \
            --s3-key code/lambdalist.zip \
            1>>/dev/null \
            &
        echo lambda $i, "$function_name", updating from s3
    else
        # Lambda doesn't exist, create it
        aws lambda create-function \
            --function-name "$function_name" \
            --runtime nodejs20.x \
            --role $LAMBDA_ROLE \
            --handler "$handler" \
            --code S3Bucket=$BUCKET,S3Key=code/lambdalist.zip \
            1>>/dev/null \
            &
        echo lambda $i, "$function_name", created from s3
    fi
    pids[${i-1}]=$!
    ((i=i+1))
done

# Wait for each process to finish
for pid in "${pids[@]}"; do
    wait "$pid"
done

echo -e '\nLambda functions updated or created.'