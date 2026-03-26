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
exports.CourseReviewsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const user_entity_1 = require("../../database/entities/user.entity");
const course_reviews_service_1 = require("./course-reviews.service");
let CourseReviewsController = class CourseReviewsController {
    constructor(service) {
        this.service = service;
    }
    getCourses(user, department, sort, search) {
        return this.service.getCourses(user.universityId, department, sort, search);
    }
    getCourseDetail(id) {
        return this.service.getCourseDetail(id);
    }
    getReviews(id, page, limit) {
        return this.service.getReviews(id, page, Math.min(limit, 50));
    }
    createReview(user, id, dto) {
        return this.service.createReview(id, user.id, dto);
    }
};
exports.CourseReviewsController = CourseReviewsController;
__decorate([
    (0, common_1.Get)('courses'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('department')),
    __param(2, (0, common_1.Query)('sort')),
    __param(3, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, String, String, String]),
    __metadata("design:returntype", void 0)
], CourseReviewsController.prototype, "getCourses", null);
__decorate([
    (0, common_1.Get)('courses/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CourseReviewsController.prototype, "getCourseDetail", null);
__decorate([
    (0, common_1.Get)('courses/:id/reviews'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", void 0)
], CourseReviewsController.prototype, "getReviews", null);
__decorate([
    (0, common_1.Post)('courses/:id/reviews'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, String, Object]),
    __metadata("design:returntype", void 0)
], CourseReviewsController.prototype, "createReview", null);
exports.CourseReviewsController = CourseReviewsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('course-reviews'),
    __metadata("design:paramtypes", [course_reviews_service_1.CourseReviewsService])
], CourseReviewsController);
//# sourceMappingURL=course-reviews.controller.js.map