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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HashtagsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const hashtags_service_1 = require("./hashtags.service");
let HashtagsController = class HashtagsController {
    constructor(hashtagsService) {
        this.hashtagsService = hashtagsService;
    }
    getTrending(limit) {
        return this.hashtagsService.getTrending(Math.min(limit, 50));
    }
    search(query) {
        if (!query || query.length < 1)
            return [];
        return this.hashtagsService.search(query, 10);
    }
    getPostsByHashtag(name, page, limit) {
        return this.hashtagsService.getPostsByHashtag(name, page, Math.min(limit, 50));
    }
};
exports.HashtagsController = HashtagsController;
__decorate([
    (0, common_1.Get)('trending'),
    __param(0, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], HashtagsController.prototype, "getTrending", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HashtagsController.prototype, "search", null);
__decorate([
    (0, common_1.Get)(':name/posts'),
    __param(0, (0, common_1.Param)('name')),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", void 0)
], HashtagsController.prototype, "getPostsByHashtag", null);
exports.HashtagsController = HashtagsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('hashtags'),
    __metadata("design:paramtypes", [hashtags_service_1.HashtagsService])
], HashtagsController);
//# sourceMappingURL=hashtags.controller.js.map