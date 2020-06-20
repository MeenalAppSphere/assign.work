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
import {
  NotificationResponseModel,
  NotificationTypeEnum,
  Project,
  Sprint,
  Task,
  TaskComments
} from '@aavantan-app/models';
import { environment } from '../environments/environment';
import { GeneralService } from '../shared/services/general.service';

@WebSocketGateway()
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  public connectedClients: Map<string, string> = new Map<string, string>();

  constructor(private _generalService: GeneralService) {
  }

  /**
   * handle on connect method
   * @param {SocketIO.Socket} client
   */
  handleConnection(client: Socket) {
    this.server.emit(NotificationTypeEnum.connectionSuccess);
  }

  /**
   * handle disconnect
   * @param {SocketIO.Socket} client
   * @return {any}
   */
  handleDisconnect(client: Socket): any {
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage(NotificationTypeEnum.userConnected)
  connect(@MessageBody() userId: string,
          @ConnectedSocket() client: Socket) {
    this.connectedClients.set(client.id, userId);
  }

  /**
   * task created notification
   * @param {Task} task
   * @param {Project} project
   */
  taskCreated(task: Task, project: Project) {
    const msg = `a task named ${task.displayName} in project named ${project.name}
        has been created by ${task.createdBy.firstName} ${task.createdBy.lastName}`;
    const link = this.getTaskLink(task);

    this.sendTaskRelatedUpdate(task, {
      name: NotificationTypeEnum.taskAdded,
      arg: { msg, link }
    }, task.createdById, project);
  }

  /**
   * task assigned
   * @param {Task} task
   * @param {Project} project
   */
  taskAssigned(task: Task, project: Project) {
    const msg = `a task named ${task.displayName} in project named ${project.name}
        is assigned to you by ${task.createdBy.firstName} ${task.createdBy.lastName}`;
    const link = this.getTaskLink(task);

    this.sendTaskRelatedUpdate(task, {
      name: NotificationTypeEnum.taskAssigned,
      arg: { msg, link }
    }, task.createdById, project);
  }

  /**
   * task created notification
   * @param {Task} task
   * @param {Project} project
   */
  taskUpdated(task: Task, project: Project) {
    const msg = `a task named ${task.displayName} in project named ${project.name}
        has been updated by ${task.updatedBy.firstName} ${task.updatedBy.lastName}`;
    const link = this.getTaskLink(task);

    this.sendTaskRelatedUpdate(task, {
      name: NotificationTypeEnum.taskUpdated,
      arg: { msg, link }
    }, task.updatedById, project);
  }

  /**
   * comment added notification
   * @param {TaskComments} comment
   * @param {Task} task
   * @param {Project} project
   */
  commentAdded(comment: TaskComments, task: Task, project: Project) {
    const msg = `A comment added to a task named ${task.displayName} by ${comment.createdBy.firstName} ${comment.createdBy.lastName}
    in project ${project.name}`;
    const link = this.getTaskLink(task);

    this.sendTaskRelatedUpdate(task, {
      name: NotificationTypeEnum.commentAdded,
      arg: { msg, link }
    }, comment.createdById, project);
  }

  /**
   * comment updated notification
   * @param {TaskComments} comment
   * @param {Task} task
   * @param {Project} project
   */
  commentUpdated(comment: TaskComments, task: Task, project: Project) {
    const msg = `A comment updated to a task named ${task.displayName} by ${comment.updatedBy.firstName} ${comment.updatedBy.lastName}
    in project ${project.name}`;
    const link = this.getTaskLink(task);

    this.sendTaskRelatedUpdate(task, {
      name: NotificationTypeEnum.commentUpdated,
      arg: { msg, link }
    }, comment.updatedById, project);
  }

  /**
   * comment pinned notification
   * @param {TaskComments} comment
   * @param {Task} task
   * @param {Project} project
   */
  commentPinned(comment: TaskComments, task: Task, project: Project) {
    const msg = `A comment has been ${comment.isPinned ? 'Pinned' : 'UnPinned'} to a task named ${task.displayName} by
    ${comment.pinnedBy.firstName} ${comment.pinnedBy.lastName}
    in project ${project.name}`;
    const link = this.getTaskLink(task);

    this.sendTaskRelatedUpdate(task, {
      name: comment.isPinned ? NotificationTypeEnum.commentPinned : NotificationTypeEnum.commentUnPinned,
      arg: { msg, link }
    }, comment.pinnedById, project);
  }

  /**
   * sprint created
   * @param {Sprint} sprint
   * @param {Project} project
   */
  sprintCreated(sprint: Sprint, project: Project) {
    const msg = `Sprint named ${sprint.name} is created by ${sprint.createdBy.firstName} ${sprint.createdBy.lastName} in project named ${project.name}`;
    const link = `${environment.APP_URL}dashboard/backlog`;
  }

  /**
   * sprint updated
   * @param {Sprint} sprint
   * @param {Project} project
   */
  sprintUpdated(sprint: Sprint, project: Project) {
    const msg = `Sprint named ${sprint.name} is updated by ${sprint.updatedBy.firstName} ${sprint.updatedBy.lastName} in project named ${project.name}`;
    const link = `${environment.APP_URL}dashboard/backlog`;
  }

  /**
   * sprint published
   * @param {Sprint} sprint
   * @param {Project} project
   */
  sprintPublished(sprint: Sprint, project: Project) {
    const msg = `Sprint named ${sprint.name} is published by ${sprint.sprintStatus.updatedBy.firstName} ${sprint.sprintStatus.updatedBy.firstName} in project named ${project.name}`;
    const link = `${environment.APP_URL}dashboard/backlog`;
  }

  /**
   * sprint closed
   * @param {Sprint} sprint
   * @param {Project} project
   */
  sprintClosed(sprint: Sprint, project: Project) {
    const msg = `Sprint name ${sprint.name} is closed by ${sprint.sprintStatus.updatedBy.firstName} ${sprint.sprintStatus.updatedBy.firstName} in project named ${project.name}`;
    const link = `${environment.APP_URL}dashboard`;
  }

  sprintBoardUpdated(sprint: Sprint, project: Project) {
    const msg = ``;
  }

  /**
   * get task link
   * @param {Task} task
   * @return {string}
   */
  private getTaskLink(task: Task) {
    return `dashboard/task/${task.displayName}`;
  }

  /**
   * send task related notification
   * @param {Task} task
   * @param event
   * @param {string} exceptThisId
   * @param project
   */
  private sendTaskRelatedUpdate(task: Task, event: { name: NotificationTypeEnum, arg: NotificationResponseModel }, exceptThisId: string,
                                project: Project) {

    this.filterOutNonProjectClients(project, exceptThisId).forEach((value, socketId) => {
      this.server.to(socketId).emit(event.name, { ...event.arg, projectId: project._id, projectName: project.name });
    });
  }

  /**
   * filter out non project clients
   * @param {Project} project
   * @param {string} exceptThisId
   * @return {Map<string, string>}
   */
  private filterOutNonProjectClients(project: Project, exceptThisId: string): Map<string, string> {
    return new Map<string, string>([
        ...this.connectedClients
      ].filter(([key, value]) => {
        return project.members.some(member => member.userId.toString() === value && (member.userId !== exceptThisId));
      })
    );
  }
}
