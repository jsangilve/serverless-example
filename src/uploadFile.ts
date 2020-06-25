import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import { S3 } from 'aws-sdk';
import queryString from 'querystring';
import Busboy from 'busboy';

interface UploadedFile {
  filename: string;
  contentType: string;
  encoding: string;
  chunks: (Buffer | string)[];
}

interface FormData {
  file: UploadedFile;
  fields: Record<string, any>;
}

const s3Client = new S3();

const BUCKET_NAME = 'serverless-example-bucket';

const parseFormData = async (event: APIGatewayProxyEvent): Promise<UploadedFile> =>
  new Promise((resolve, reject) => {
    const busboy = new Busboy({ headers: event.headers['content-type'] });
    const fields: Record<string, any> = {};
    let uploadedFile: UploadedFile;
    busboy.on('file', (field, file, filename, encoding, mimetype) => {
      const chunks = [];
      
      file.on('data', (data) => {
        console.info('typeof chunk', typeof data);
        chunks.push(data);
      });

      file.on('error', () => {
        // TODO reject promise and return error
      });

      file.on('end', () => {
        console.log('File readed');
        uploadedFile = {
          filename,
          encoding,
          contentType: mimetype,
          chunks,
        }
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
    busboy.end()
  });

export const uploadFile: APIGatewayProxyHandler = async (event) => {
  console.info('Uploading a new file to AWS', event);
  const uploadedFile = await parseFormData(event);
  console.log(uploadedFile.filename, 'Chunks', uploadedFile.chunks.length);
  const tags = {};
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
