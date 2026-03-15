"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModerationModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const report_entity_1 = require("../../database/entities/report.entity");
const moderation_action_entity_1 = require("../../database/entities/moderation-action.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const post_entity_1 = require("../../database/entities/post.entity");
const comment_entity_1 = require("../../database/entities/comment.entity");
const moderation_service_1 = require("./moderation.service");
const moderation_controller_1 = require("./moderation.controller");
const notifications_module_1 = require("../notifications/notifications.module");
let ModerationModule = class ModerationModule {
};
exports.ModerationModule = ModerationModule;
exports.ModerationModule = ModerationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([report_entity_1.Report, moderation_action_entity_1.ModerationAction, user_entity_1.User, post_entity_1.Post, comment_entity_1.Comment]),
            notifications_module_1.NotificationsModule,
        ],
        controllers: [moderation_controller_1.ModerationController],
        providers: [moderation_service_1.ModerationService],
        exports: [moderation_service_1.ModerationService],
    })
], ModerationModule);
//# sourceMappingURL=moderation.module.js.map