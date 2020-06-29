import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import * as queryString from 'querystring';
import * as Busboy from 'busboy';

interface UploadedFile {
  filename: string;
  contentType: string;
  encoding: string;
  content: Buffer | string;
}

interface FormData {
  file: UploadedFile;
  fields: Record<string, any>;
}

const s3Client = new S3();

const BUCKET_NAME = 'serverless-example-bucket';

/** 
 * Parses the multipart form data and returns the uploaded files and fields
 */
const parseFormData = async (
  event: APIGatewayProxyEvent,
): Promise<FormData> =>
  new Promise((resolve, reject) => {
    const busboy = new Busboy({
      headers: { 'content-type': event.headers['content-type'] },
    });
    const fields: Record<string, any> = {};
    let uploadedFile: UploadedFile;

    // event listener for the form data
    busboy.on('file', (field, file, filename, encoding, contentType) => {
      let content = null;

      file.on('data', (data) => {
        // reads the file content in one chunk
        content = data;
      });

      file.on('error', reject);

      file.on('end', () => {
        uploadedFile = {
          filename,
          encoding,
          contentType,
          content,
        };
      });
    });

    busboy.on('field', (fieldName, value) => {
      fields[fieldName] = value;
    });

    busboy.on('error', reject);

    busboy.on('finish', () => {
      if (!uploadedFile) {
        reject(new Error('Missing file'));
      }
      resolve({ file: uploadedFile, fields })
    });

    busboy.write(event.body, event.isBase64Encoded ? 'base64' : 'binary');
    busboy.end();
  });

export const uploadFile: APIGatewayProxyHandler = async (event) => {
  const { file, fields } = await parseFormData(event);
  const tags = { filename: file.filename };
  try {
    await s3Client
      .putObject({
        Bucket: BUCKET_NAME,
        Key: fields.filename || file.filename,
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
