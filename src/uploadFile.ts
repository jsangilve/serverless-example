import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import * as queryString from 'querystring';
import * as Busboy from 'busboy';

interface UploadedFile {
  filename: string;
  contentType: string;
  encoding: string;
  content: any;
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
): Promise<UploadedFile> =>
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
        content = data;
      });

      file.on('error', () => {
        // TODO reject promise and return error
      });

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

    busboy.on('error', (error) => reject(error));

    busboy.on('finish', () => {
      if (!uploadedFile) {
        reject(new Error('missing file'));
      }
      resolve(uploadedFile);
    });

    busboy.write(event.body, event.isBase64Encoded ? 'base64' : 'binary');
    busboy.end();
  });

export const uploadFile: APIGatewayProxyHandler = async (event) => {
  console.info('Uploading a new file to AWS', event);
  const uploadedFile = await parseFormData(event);
  console.log(uploadedFile.filename, uploadedFile.encoding);
  const tags = { filename: uploadedFile.filename };
  const result = await s3Client
    .putObject({
      Bucket: BUCKET_NAME,
      Key: 'the_filename',
      Body: 'content of the file',
      Tagging: queryString.encode(tags),
    })
    .promise();

  console.info('PutOperationResult', result);

  // the file content is provided
  return {
    statusCode: 200,
    body: JSON.stringify({ description: 'file created', result: 'ok' }),
  };
};
