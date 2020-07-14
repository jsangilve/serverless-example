import { APIGatewayProxyHandler } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import { BUCKET_NAME } from './common';

const s3Client = new S3();

interface POSTParameters {
  filename: string;
  tags?: Record<string, string>;
}

const getPOSTParameters = (
  rawBody: Record<string, any> | null,
): POSTParameters => {
  if (!rawBody || !(typeof rawBody.filename === 'string')) {
    throw new Error('Missing filename parameters');
  }

  return {
    filename: rawBody.filename,
    tags: rawBody.tags,
  };
};

interface CreatePresignedPOSTParameters extends POSTParameters {
  expirationInSeconds: number;
}

const createPresignedPOST = async ({
  filename,
  expirationInSeconds,
  tags,
}: CreatePresignedPOSTParameters): Promise<{
  url: string;
  fields: Record<string, string>;
}> => {
  return s3Client.createPresignedPost({
    Bucket: BUCKET_NAME,
    Expires: expirationInSeconds, // expiration in seconds
    // matching any provided tags
    // TODO change match only the expected values
    Conditions: tags && [['starts-with', '$tagging', '']],
    // field that should be part of the payload
    Fields: {
      key: filename,
    },
  });
};

export const createPostUploadUrl: APIGatewayProxyHandler = async (event) => {
  // expects body to be a JSON containing the required parameters
  try {
    // TODO check error case whent his can be null
    const body = JSON.parse(event.body!);
    const { filename, tags } = getPOSTParameters(body);

    console.log('POST Parameters', filename, tags);

    return {
      statusCode: 200,
      body: '',
    };
  } catch (error) {
    console.log(error);

    return {
      statusCode: 409, body: JSON.stringify({ description: 'something went wrong' })
    }
  }
};
