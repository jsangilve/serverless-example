import { APIGatewayProxyHandler } from 'aws-lambda';
import { S3 } from 'aws-sdk';

const s3Client = new S3();

export const uploadFile: APIGatewayProxyHandler = async event => {
  console.info('Uploading a new file to AWS');
  return {
    statusCode: 200,
    body: JSON.stringify({ description: 'file created', result: 'ok' })
  }
}