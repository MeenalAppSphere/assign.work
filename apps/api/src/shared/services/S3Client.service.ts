import * as aws from 'aws-sdk';
import { Body, ManagedUpload } from 'aws-sdk/clients/s3';

export class S3Client {
  constructor(protected connection: aws.S3, protected bucketName: string, protected filePathPrefix: string) {
  }

  public upload(
    filePath: string,
    payload: Body,
    options: ManagedUpload.ManagedUploadOptions = {}
  ): Promise<string> {

    return new Promise<string>((resolve: Function, reject: Function): void => {
      this.connection.upload(
        {
          Bucket: this.bucketName,
          Key: `${this.filePathPrefix ? this.filePathPrefix + '/' : ''}${filePath}`,
          Body: payload
        },
        options,
        (err: Error, data: ManagedUpload.SendData) => {
          err ? reject(err) : resolve(data.Location);
        }
      );
    });
  }

  public uploadInBatch(
    filePath: string,
    payloadItems: object[],
    options: ManagedUpload.ManagedUploadOptions = {}
  ): Promise<string> {
    if (!Array.isArray(payloadItems) || payloadItems.length < 1) {
      throw new Error('You are trying to upload an empty file.');
    }
    const payload: string = payloadItems
      .reduce((prev: string, value: object): string => `${prev}${JSON.stringify(value)}\n`, '')
      .trim();

    return this.upload(filePath, payload, options);
  }
}
