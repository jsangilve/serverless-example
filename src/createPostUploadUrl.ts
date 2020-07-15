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

/**
 * Given a set of tags, produces the required XML tagging format as string
 */
export const buildXMLTagSet = (tagset: Record<string, string>): string => {
  const tags = Object.entries(tagset).reduce(
    (acc, [key, value]) =>
      `${acc}<Tag><Key>${key}</Key><Value>${value}</Value></Tag>`,
    '',
  );

  return `<Tagging><TagSet>${tags}</TagSet></Tagging>`;
};

export const createPostUploadUrl: APIGatewayProxyHandler = async (event) => {
  try {
    // expects body to be a JSON containing the required parameters
    const body = JSON.parse(event.body || '');
    const { filename, tags } = getPOSTParameters(body);

    const postObj = s3Client.createPresignedPost({
      Bucket: BUCKET_NAME,
      Expires: 30, // expiration in seconds
      // matches any value for tagging
      Conditions: tags && [['starts-with', '$tagging', '']],
      Fields: {
        key: filename,
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        url: postObj.url,
        fields: {
          ...postObj.fields,
          // enrich post object with the tagging values
          tagging: tags ? buildXMLTagSet(tags) : undefined,
        },
      }),
    };
  } catch (error) {
    console.log(error);

    return {
      statusCode: 409,
      body: JSON.stringify({ description: 'something went wrong' }),
    };
  }
};
