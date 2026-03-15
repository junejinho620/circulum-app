"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MessagesGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const messages_service_1 = require("./messages.service");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const conversation_participant_entity_1 = require("../../database/entities/conversation-participant.entity");
let MessagesGateway = MessagesGateway_1 = class MessagesGateway {
    constructor(jwtService, config, messagesService, partRepo) {
        this.jwtService = jwtService;
        this.config = config;
        this.messagesService = messagesService;
        this.partRepo = partRepo;
        this.logger = new common_1.Logger(MessagesGateway_1.name);
        this.userSockets = new Map();
    }
    async handleConnection(socket) {
        try {
            const token = socket.handshake.auth?.token
                || socket.handshake.headers?.authorization?.split(' ')[1];
            if (!token)
                throw new Error('No token');
            const payload = this.jwtService.verify(token, {
                secret: this.config.get('jwt.accessSecret'),
            });
            socket.data.userId = payload.sub;
            socket.data.handle = payload.handle;
            if (!this.userSockets.has(payload.sub)) {
                this.userSockets.set(payload.sub, new Set());
            }
            this.userSockets.get(payload.sub).add(socket.id);
            socket.join(`user:${payload.sub}`);
            this.logger.log(`User ${payload.handle} connected (${socket.id})`);
        }
        catch (err) {
            socket.disconnect();
        }
    }
    handleDisconnect(socket) {
        const userId = socket.data.userId;
        if (userId) {
            const sockets = this.userSockets.get(userId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0)
                    this.userSockets.delete(userId);
            }
        }
        this.logger.log(`Socket disconnected: ${socket.id}`);
    }
    async handleJoinConversation(data, socket) {
        const userId = socket.data.userId;
        const participant = await this.partRepo.findOne({
            where: { conversationId: data.conversationId, userId },
        });
        if (!participant)
            throw new websockets_1.WsException('Not a participant');
        socket.join(`conv:${data.conversationId}`);
        return { success: true };
    }
    handleLeaveConversation(data, socket) {
        socket.leave(`conv:${data.conversationId}`);
        return { success: true };
    }
    async handleSendMessage(data, socket) {
        const userId = socket.data.userId;
        try {
            const message = await this.messagesService.sendMessage(data.conversationId, { body: data.body }, userId);
            this.server.to(`conv:${data.conversationId}`).emit('new_message', {
                conversationId: data.conversationId,
                message: {
                    id: message.id,
                    body: message.body,
                    senderId: userId,
                    senderHandle: socket.data.handle,
                    createdAt: message.createdAt,
                },
            });
            return { success: true, messageId: message.id };
        }
        catch (err) {
            throw new websockets_1.WsException(err.message);
        }
    }
    handleTyping(data, socket) {
        socket.to(`conv:${data.conversationId}`).emit('user_typing', {
            conversationId: data.conversationId,
            handle: socket.data.handle,
        });
    }
    pushNotification(userId, payload) {
        this.server.to(`user:${userId}`).emit('notification', payload);
    }
    isUserOnline(userId) {
        const sockets = this.userSockets.get(userId);
        return sockets ? sockets.size > 0 : false;
    }
};
exports.MessagesGateway = MessagesGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], MessagesGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_conversation'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], MessagesGateway.prototype, "handleJoinConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_conversation'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], MessagesGateway.prototype, "handleLeaveConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_message'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], MessagesGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], MessagesGateway.prototype, "handleTyping", null);
exports.MessagesGateway = MessagesGateway = MessagesGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*' },
        namespace: '/ws',
    }),
    __param(3, (0, typeorm_1.InjectRepository)(conversation_participant_entity_1.ConversationParticipant)),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        messages_service_1.MessagesService,
        typeorm_2.Repository])
], MessagesGateway);
//# sourceMappingURL=messages.gateway.js.map