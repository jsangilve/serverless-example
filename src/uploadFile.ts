import { APIGatewayProxyHandler } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import queryString from 'querystring';

const s3Client = new S3();

const BUCKET_NAME = 'serverless-example-bucket';

export const uploadFile: APIGatewayProxyHandler = async event => {
  console.info('Uploading a new file to AWS', event);
  const tags = {};
  const result = await s3Client.putObject({
    Bucket: BUCKET_NAME,
    Key: 'the_filename',
    Body: 'content of the file',
    Tagging: queryString.encode(tags),
  }).promise();

  console.info('PutOperationResult', result);


  // the file content is provided 
  return {
    statusCode: 200,
    body: JSON.stringify({ description: 'file created', result: 'ok' })
  }
}