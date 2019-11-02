import { Injectable, InternalServerErrorException, PayloadTooLargeException } from '@nestjs/common';
import { BaseService } from './base.service';
import { AttachmentModel, DbCollection, Task, TaskHistory } from '@aavantan-app/models';
import { ClientSession, Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as aws from 'aws-sdk';
import { S3Client } from './S3Client.service';

aws.config.update({
  accessKeyId: 'AKIAVBE3ZXGH5F3IVEWZ',
  secretAccessKey: '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'
});

@Injectable()
export class AttachmentService extends BaseService<AttachmentModel & Document> {
  s3Client: S3Client;

  constructor(
    @InjectModel(DbCollection.attachments) protected readonly _attachmentModel: Model<AttachmentModel & Document>
  ) {
    super(_attachmentModel);
    this.s3Client = new S3Client(new aws.S3({ region: 'us-east-1' }), 'images.assign.work', '');
  }

  async addAttachment(moduleName: string, files, userId: string) {
    const file = files[0];
    const mimeType = file.mimetype.split('/')[0];
    const fileType = mimeType.includes('image') ? 'images' : mimeType.includes('video') ? 'videos' : 'others';
    const filePath = `${moduleName}/${fileType}/${file.originalname}`;
    let fileUrl: string;

    // validations
    if (Number((file.size / (1024 * 1024)).toFixed(2)) > 5) {
      throw new PayloadTooLargeException('File size limit exceeded');
    }

    try {
      fileUrl = await this.s3Client.upload(filePath, file.buffer);
    } catch (e) {
      throw new InternalServerErrorException('file not uploaded');
    }

    const session = await this._attachmentModel.db.startSession();
    session.startTransaction();

    try {
      await this.create([new this._attachmentModel({
        name: file.originalname, url: fileUrl, createdBy: userId, mimeType: file.mimetype
      })], session);
      await session.commitTransaction();
      session.endSession();
      return fileUrl;
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }
}
