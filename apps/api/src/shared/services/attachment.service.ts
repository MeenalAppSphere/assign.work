import { Injectable, InternalServerErrorException, NotFoundException, PayloadTooLargeException } from '@nestjs/common';
import { BaseService } from './base.service';
import { AttachmentModel, DbCollection } from '@aavantan-app/models';
import { Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as aws from 'aws-sdk';
import { S3Client } from './S3Client.service';
import { GeneralService } from './general.service';

@Injectable()
export class AttachmentService extends BaseService<AttachmentModel & Document> {
  s3Client: S3Client;

  constructor(
    @InjectModel(DbCollection.attachments) protected readonly _attachmentModel: Model<AttachmentModel & Document>,
    private _generalService: GeneralService
  ) {
    super(_attachmentModel);
    aws.config.update({
      accessKeyId: process.env.AWS_ACCESSKEYID,
      secretAccessKey: process.env.AWS_SECRETACCESSKEY
    });
    this.s3Client = new S3Client(new aws.S3({ region: 'us-east-1' }), 'image.assign.work', '');
  }

  async addAttachment(moduleName: string, files): Promise<{ id: string, url: string }> {
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
      const result = await this.create([new this._attachmentModel({
        name: file.originalname, url: fileUrl, createdById: this._generalService.userId, mimeType: file.mimetype
      })], session);
      await session.commitTransaction();
      session.endSession();
      return {
        id: result[0].id,
        url: result[0].url
      };
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }

  async deleteAttachment(id: string): Promise<string> {
    const attachmentDetails = await this._attachmentModel.findById(id).lean().exec();

    if (!attachmentDetails) {
      throw new NotFoundException('Attachment not found!');
    }
    const filePath = attachmentDetails.url.split('image.assign.work/');
    try {
      await this.s3Client.delete(filePath[1]);
      await this.delete(id);
      return 'Attachment Deleted Successfully';
    } catch (e) {
      throw e;
    }

  }
}
