import { APIGatewayProxyHandler } from 'aws-lambda';
import * as queryString from 'querystring';
import { BUCKET_NAME, getUploadParameters } from './common';
import { S3 } from 'aws-sdk';

const s3Client = new S3();

export const createUploadUrl: APIGatewayProxyHandler = async (event) => {
  // expects body to be a JSON containing the required parameters
  const body = JSON.parse(event.body || '');
  const { filename, tags } = getUploadParameters(body);
  const url = await s3Client.getSignedUrlPromise('putObject', {
    Key: filename,
    Bucket: BUCKET_NAME,
    Metadata: tags,
    Tagging: tags ? queryString.encode(body.tags) : undefined,
    Expires: 90,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      url,
    }),
  };
};
