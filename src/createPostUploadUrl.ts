import { APIGatewayProxyHandler } from 'aws-lambda'


export const createPostUploadUrl: APIGatewayProxyHandler = async event => {

  return {
    statusCode: 200,
    body: ''
  }
}