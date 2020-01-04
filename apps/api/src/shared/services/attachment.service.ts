import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  OnModuleInit,
  PayloadTooLargeException
} from '@nestjs/common';
import { BaseService } from './base.service';
import {
  AttachmentModel,
  DbCollection,
  MongooseQueryModel,
  UserLoginProviderEnum,
  UserStatus
} from '@aavantan-app/models';
import { ClientSession, Document, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as aws from 'aws-sdk';
import { S3Client } from './S3Client.service';
import { GeneralService } from './general.service';
import {
  DEFAULT_DECIMAL_PLACES,
  MAX_FILE_UPLOAD_SIZE,
  MAX_PROFILE_PIC_UPLOAD_SIZE
} from '../helpers/defaultValueConstant';
import { UsersService } from './users.service';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class AttachmentService extends BaseService<AttachmentModel & Document> implements OnModuleInit {
  s3Client: S3Client;
  private _userService: UsersService;

  constructor(
    @InjectModel(DbCollection.attachments) protected readonly _attachmentModel: Model<AttachmentModel & Document>,
    private _generalService: GeneralService, private readonly _moduleRef: ModuleRef
  ) {
    super(_attachmentModel);
    aws.config.update({
      accessKeyId: process.env.AWS_ACCESSKEYID,
      secretAccessKey: process.env.AWS_SECRETACCESSKEY
    });
    this.s3Client = new S3Client(new aws.S3({ region: 'us-east-1' }), 'image.assign.work', '');
  }

  onModuleInit(): any {
    this._userService = this._moduleRef.get('UsersService');
  }

  async addAttachment(moduleName: string, files = []): Promise<{ id: string, url: string }> {
    const file = files[0];

    if (!file) {
      throw new BadRequestException('file not found!');
    }

    if (!moduleName) {
      throw new BadRequestException('invalid request');
    }

    const mimeType = file.mimetype.split('/')[0];
    const fileType = mimeType.includes('image') ? 'images' : mimeType.includes('video') ? 'videos' : 'others';
    const filePath = `${moduleName}/${fileType}/${file.originalname}`;
    let fileUrl: string;

    // validations
    this.fileSizeValidator(file);

    try {
      fileUrl = await this.s3Client.upload(filePath, file.buffer);
    } catch (e) {
      throw new InternalServerErrorException('file not uploaded');
    }

    const session = await this.startSession();

    try {
      const result = await this.createAttachmentInDb(file, fileUrl, session);
      await this.commitTransaction(session);
      return result;
    } catch (error) {
      await this.abortTransaction(session);
      throw error;
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

  async uploadProfilePic(files = [], userId: string) {
    const file = files[0];

    if (!file) {
      throw new BadRequestException('file not found');
    }

    const mimeType = file.mimetype.split('/')[0];
    const filePath = `profilePic/${file.originalname}`;
    let fileUrl: string;

    // mime type validation
    if (!mimeType.includes('image')) {
      throw new BadRequestException('invalid file type! only photos are allowed');
    }

    // file size validation
    this.fileSizeValidator(file);

    const userQuery = new MongooseQueryModel();
    userQuery.filter = {
      _id: userId, status: UserStatus.Active, lastLoginProvider: UserLoginProviderEnum.normal
    };
    userQuery.select = '_id';
    const userDetail = this._userService.findOne(userQuery);

    if (!userDetail) {
      throw new BadRequestException('user not found');
    }

    const session = await this.startSession();

    try {
      fileUrl = await this.s3Client.upload(filePath, file.buffer);
    } catch (e) {
      throw new InternalServerErrorException('file not uploaded');
    }

    try {
      const result = await this.createAttachmentInDb(file, fileUrl, session);
      await this._userService.updateUser(userId, { $set: { profilePic: result.url } }, session);
      return result;
    } catch (error) {
      await this.abortTransaction(session);
      throw error;
    }
  }

  private async createAttachmentInDb(file, fileUrl: string, session?: ClientSession): Promise<{ id: string, url: string }> {
    try {
      const result = await this.create([new this._attachmentModel({
        name: file.originalname, url: fileUrl, createdById: this._generalService.userId, mimeType: file.mimetype
      })], session);
      return {
        id: result[0].id,
        url: result[0].url
      };
    } catch (e) {
      throw e;
    }
  }

  private fileSizeValidator(file, isPofilePic: boolean = false) {
    // validations
    if (Number((file.size / (1024 * 1024)).toFixed(DEFAULT_DECIMAL_PLACES)) > (isPofilePic ? MAX_PROFILE_PIC_UPLOAD_SIZE : MAX_FILE_UPLOAD_SIZE)) {
      throw new PayloadTooLargeException('File size limit exceeded');
    }
  }
}
