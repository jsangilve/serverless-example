import { APIGatewayProxyHandler } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import * as queryString from 'querystring';
import { parseFormData, BUCKET_NAME } from './common';

const s3Client = new S3();


export const uploadFile: APIGatewayProxyHandler = async (event) => {
  const { file, fields } = await parseFormData(event);

  if (!file ) {
    return {
      statusCode: 401,
      body: JSON.stringify({ description: 'missing file field'})
    }
  }

  const tags = file?.filename ? { filename: file?.filename }: undefined;
  try {
    await s3Client
      .putObject({
        Bucket: BUCKET_NAME,
        Key: fields.filename || file?.filename,
        Body: file.content,
        Tagging: queryString.encode(tags),
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ description: 'file created', result: 'ok' }),
    };

  } catch (_error) {
    // this is deficient error handling, but good enough for the purpose of this example
    return {
      statusCode: 409, body: JSON.stringify({ description: 'something went wrong' })
    }
  }
};
