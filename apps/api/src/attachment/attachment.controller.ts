import { Body, Controller, Delete, Param, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { AttachmentService } from '../shared/services/attachment.service';

@Controller('attachment')
@UseGuards(AuthGuard('jwt'))
export class AttachmentController {
  constructor(private readonly _attachmentService: AttachmentService) {

  }

  @Post(':module/add')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadAttachment(@UploadedFiles() files, @Param('module') module: string) {
    return await this._attachmentService.addAttachment(module, files);
  }

  @Post('profilepic')
  @UseInterceptors(AnyFilesInterceptor())
  async uploadProfilePic(@UploadedFiles() files, @Body('userId') userId: string) {
    return await this._attachmentService.uploadProfilePic(files, userId);
  }

  @Delete(':id')
  async deleteAttachment(@Param() id: string) {
    return await this._attachmentService.deleteAttachment(id);
  }

}
