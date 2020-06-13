import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Project, Task, TaskComments, User } from '@aavantan-app/models';
import { environment } from '../environments/environment';
import { GeneralService } from '../shared/services/general.service';

@WebSocketGateway()
export class TaskGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  public connectedClients: Map<string, string> = new Map<string, string>();
  public roomName: string = 'TasksRoom';

  constructor(private _generalService: GeneralService) {
  }

  handleConnection(client: Socket) {
    this.server.emit('connected-successfully');
  }

  handleDisconnect(client: Socket): any {
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('connect-tasks')
  connect(@MessageBody() userId: string,
          @ConnectedSocket() client: Socket) {
    this.connectedClients.set(client.id, userId);
  }

  taskCreated(task: Task, project: Project) {
    const msg = `a task named ${task.displayName} in project names ${project.name}
        has been updated by ${task.createdBy.firstName} ${task.createdBy.lastName}`;
    const link = `${environment.APP_URL}dashboard/task/${task.displayName}`;

    this.sendUpdate(task, { name: 'task-added', arg: { msg, link } }, task.createdById);
  }

  taskUpdated(task: Task, project: Project) {
    const msg = `a task named ${task.displayName} in project names ${project.name}
        has been updated by ${task.updatedBy.firstName} ${task.updatedBy.lastName}`;
    const link = `${environment.APP_URL}dashboard/task/${task.displayName}`;

    this.sendUpdate(task, { name: 'task-updated', arg: { msg, link } }, task.updatedById);
  }

  commentAdded(comment: TaskComments, task: Task, project: Project) {
    const msg = `A comment added to a task named ${task.displayName} by ${comment.createdBy.firstName} ${comment.createdBy.lastName}
    in project ${project.name}`;
    const link = `${environment.APP_URL}dashboard/task/${task.displayName}`;

    this.sendUpdate(task, { name: 'comment-added', arg: { msg, link } }, comment.createdById);
  }

  commentUpdated(comment: TaskComments, task: Task, project: Project) {
    const msg = `A comment updated to a task named ${task.displayName} by ${comment.updatedBy.firstName} ${comment.updatedBy.lastName}
    in project ${project.name}`;
    const link = `${environment.APP_URL}dashboard/task/${task.displayName}`;

    this.sendUpdate(task, { name: 'comment-updated', arg: { msg, link } }, comment.updatedById);
  }

  commentPinned(comment: TaskComments, task: Task, project: Project) {
    const msg = `A comment has been ${comment.isPinned ? 'Pinned' : 'UnPinned'} to a task named ${task.displayName} by
    ${comment.pinnedBy.firstName} ${comment.pinnedBy.lastName}
    in project ${project.name}`;
    const link = `${environment.APP_URL}dashboard/task/${task.displayName}`;

    this.sendUpdate(task, {
      name: `${comment.isPinned ? 'comment-pinned' : 'comment-unpinned'}`,
      arg: { msg, link }
    }, comment.pinnedById);
  }

  sendUpdate(task: Task, event: any, exceptThisId: string) {
    this.connectedClients.forEach((value, socketId) => {
      const currentUser = this.connectedClients.get(socketId);
      if (currentUser !== exceptThisId.toString()) {
        this.server.to(socketId).emit(event.name, event.arg);
      }
    });
  }
}
