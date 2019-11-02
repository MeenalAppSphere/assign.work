import { Controller, Delete, Param, Post, Request, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
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
  async createTask(@UploadedFiles() files, @Param('module') module: string, @Request() req) {
    return await this._attachmentService.addAttachment(module, files, req.user.id);
  }

  @Delete(':id')
  async deleteAttachment(@Param() id: string) {
    // return await this._taskService.delete(id);
  }

}
