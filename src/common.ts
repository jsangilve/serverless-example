
import * as Busboy from 'busboy';
import { APIGatewayProxyEvent } from 'aws-lambda';

// TODO: load from env variables
export const BUCKET_NAME = 'serverless-example-bucket';

export interface UploadedFile {
  filename: string;
  contentType: string;
  encoding: string;
  content: Buffer | string;
}

export interface FormData {
  file?: UploadedFile;
  fields: Record<string, any>;
}

/** 
 * Parses the multipart form data and returns the uploaded files and fields
 */
export const parseFormData = async (
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
      let content = '';

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
      resolve({ file: uploadedFile, fields })
    });

    busboy.write(event.body || '', event.isBase64Encoded ? 'base64' : 'binary');
    busboy.end();
  });