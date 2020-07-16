import * as fs from 'fs';
import * as FormData from 'form-data';
import axios from 'axios';

const getContentLength = async (form: FormData): Promise<number> =>
  new Promise((resolve, reject) => {
    form.getLength((err, length) => {
      if (err) reject(err);
      resolve(length);
    });
  });

test('upload file', async () => {
  const { data, status } = await axios.post(
    'https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/createPostUploadUrl',
    {
      filename: 'myCustomFilename.m4a',
      tags: {
        genre: 'rock',
        year: '1994',
      },
    },
  );
  expect(status).toEqual(200);

  const fields = {
    ...data.fields,
    file: fs.createReadStream('./GoBanyo_incomplete.m4a'),
  };

  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value);
  }

  const { status: uploadStatusCode } = await axios.post(data.url, form, {
    // AWS requirest the Content-Length header
    headers: {
      ...form.getHeaders(),
      'Content-Length': await getContentLength(form),
    },
  });
  expect(uploadStatusCode).toEqual(204);
});
