import { APIGatewayProxyHandler } from 'aws-lambda';
import * as queryString from 'querystring';
import { parseFormData, BUCKET_NAME } from './common';
import { S3 } from 'aws-sdk';

const s3Client = new S3();

export const createUploadUrl: APIGatewayProxyHandler = async (event) => {
  const { fields } = await parseFormData(event);
  const tags = fields.filename ? { filename: fields.filename }: undefined;
  const expirationInSeconds = 30;
  // presigned url for put operation
  // TODO proper error handling
  const url = await s3Client.getSignedUrlPromise('putObject', {
    // Use the filename provided in the form. Otherwise fallback to the original filename
    Key: fields.filename,
    Bucket: BUCKET_NAME,
    Metadata: tags ? tags : undefined,
    Tagging: tags ? queryString.encode(tags) : undefined,
    Expires: expirationInSeconds,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      url,
    }),
  };
};
