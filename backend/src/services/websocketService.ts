import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  email?: string;
  role?: string;
}

interface AuthenticatedSocket extends Socket {
  userEmail?: string;
  userRole?: string;
}

class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map(); // email -> socketId

  constructor(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*", // Em produção, especificar domínios
        methods: ["GET", "POST"]
      }
    });

    this.setupAuthentication();
    this.setupConnectionHandling();
  }

  private setupAuthentication() {
    this.io.use((socket: AuthenticatedSocket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Token não fornecido'));
      }

      try {
        const secret = process.env.JWT_SECRET || 'dev_secret';
        const payload = jwt.verify(token, secret) as JwtPayload;
        
        const userEmail = payload.userEmail || payload.email;
        const userRole = payload.userRole || payload.role;
        
        if (!userEmail) {
          return next(new Error('Token inválido'));
        }

        socket.userEmail = userEmail;
        socket.userRole = userRole;
        next();
      } catch (error) {
        next(new Error('Token inválido'));
      }
    });
  }

  private setupConnectionHandling() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`🔌 Usuário conectado via WebSocket: ${socket.userEmail} (${socket.userRole})`);
      
      // Registrar usuário conectado
      if (socket.userEmail) {
        this.connectedUsers.set(socket.userEmail, socket.id);
        
        // Entrar em sala baseada no papel do usuário
        if (socket.userRole === 'admin') {
          socket.join('admin-room');
          console.log(`👨‍💼 Admin ${socket.userEmail} entrou na sala de administradores`);
        } else {
          socket.join(`user-${socket.userEmail}`);
          console.log(`👤 Cliente ${socket.userEmail} entrou em sua sala privada`);
        }
      }

      // Manipular desconexão
      socket.on('disconnect', () => {
        console.log(`🔌 Usuário desconectado: ${socket.userEmail}`);
        if (socket.userEmail) {
          this.connectedUsers.delete(socket.userEmail);
        }
      });

      // Manipular solicitação de status online
      socket.on('get-online-status', () => {
        socket.emit('online-users', Array.from(this.connectedUsers.keys()));
      });
    });
  }

  // Notificar administradores sobre nova mensagem
  public notifyAdmins(message: any) {
    console.log(`📢 Notificando admins sobre nova mensagem de: ${message.from_user_email}`);
    this.io.to('admin-room').emit('new-message-for-admin', {
      type: 'new_message',
      message: message,
      timestamp: new Date().toISOString()
    });
  }

  // Notificar usuário específico sobre resposta do admin
  public notifyUser(userEmail: string, message: any) {
    console.log(`📢 Notificando usuário ${userEmail} sobre resposta do admin`);
    this.io.to(`user-${userEmail}`).emit('new-message-from-admin', {
      type: 'admin_reply',
      message: message,
      timestamp: new Date().toISOString()
    });
  }

  // Notificar sobre atualização de status de mensagem
  public notifyMessageStatusUpdate(userEmail: string, messageId: string, status: string) {
    console.log(`📢 Notificando ${userEmail} sobre atualização de status da mensagem ${messageId}: ${status}`);
    this.io.to(`user-${userEmail}`).emit('message-status-update', {
      messageId,
      status,
      timestamp: new Date().toISOString()
    });
  }

  // Broadcast geral para todos os usuários conectados
  public broadcastToAll(event: string, data: any) {
    console.log(`📢 Broadcast geral: ${event}`);
    this.io.emit(event, data);
  }

  // Obter usuários online
  public getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  // Verificar se usuário está online
  public isUserOnline(userEmail: string): boolean {
    return this.connectedUsers.has(userEmail);
  }
}

export { WebSocketService };