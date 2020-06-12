import { WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

export class BaseGateway {
  @WebSocketServer() public server: Server;
  public connectedClients: Map<string, string> = new Map<string, string>();

  constructor(public roomName: string) {
  }

  emit(eventName: string, arg: any) {
    this.server.emit(eventName, arg);
  }
}
