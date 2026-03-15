"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throttleConfig = exports.emailConfig = exports.jwtConfig = exports.redisConfig = exports.dbConfig = exports.appConfig = void 0;
const config_1 = require("@nestjs/config");
exports.appConfig = (0, config_1.registerAs)('app', () => ({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 3000,
    secret: process.env.APP_SECRET || 'dev-secret',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:19006',
}));
exports.dbConfig = (0, config_1.registerAs)('db', () => ({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'circulum',
    password: process.env.DB_PASSWORD || 'circulum_dev_password',
    database: process.env.DB_NAME || 'circulum_db',
}));
exports.redisConfig = (0, config_1.registerAs)('redis', () => ({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
}));
exports.jwtConfig = (0, config_1.registerAs)('jwt', () => ({
    accessSecret: process.env.JWT_ACCESS_SECRET || 'access-dev-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-dev-secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));
exports.emailConfig = (0, config_1.registerAs)('email', () => ({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'no-reply@circulum.app',
    fromName: process.env.EMAIL_FROM_NAME || 'Circulum',
}));
exports.throttleConfig = (0, config_1.registerAs)('throttle', () => ({
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 100,
}));
//# sourceMappingURL=app.config.js.map