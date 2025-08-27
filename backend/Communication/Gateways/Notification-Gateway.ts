import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: true, namespace: '/ws' })
export class NotificationGateway implements OnGatewayConnection {
    @WebSocketServer() server!: Server;

    constructor(private readonly jwt: JwtService) {}

    async handleConnection(client: Socket) {
        try {
            const token =
                (client.handshake.auth as any)?.token ||
                (client.handshake.headers.authorization?.toString().split(' ')[1]);

            if (!token) return client.disconnect();
            const payload = this.jwt.verify(token); // Ensure JwtModule.register({ secret }) configured
            const userId = payload?.sub as string;
            if (!userId) return client.disconnect();

            client.join(`user:${userId}`);
            (client as any).userId = userId;
        } catch {
            client.disconnect();
        }
    }

    emitToUser(userId: string, event: string, data: any) {
        this.server.to(`user:${userId}`).emit(event, data);
    }
}