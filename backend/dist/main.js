"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter({
        logger: false,
        trustProxy: true,
        bodyLimit: 5 * 1024 * 1024,
    }));
    const config = app.get(config_1.ConfigService);
    const port = config.get('app.port') || 3000;
    const nodeEnv = config.get('app.nodeEnv');
    const frontendUrl = config.get('app.frontendUrl') || '*';
    const fastify = app.getHttpAdapter().getInstance();
    await fastify.register(require('@fastify/helmet'), {
        contentSecurityPolicy: nodeEnv === 'production',
        crossOriginEmbedderPolicy: false,
    });
    await fastify.register(require('@fastify/rate-limit'), {
        max: 200,
        timeWindow: 60_000,
        allowList: ['127.0.0.1'],
    });
    app.enableCors({
        origin: nodeEnv === 'production' ? frontendUrl : true,
        credentials: true,
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        maxAge: 86400,
    });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor(), new transform_interceptor_1.TransformInterceptor());
    app.enableShutdownHooks();
    await app.listen(port, '0.0.0.0');
    logger.log(`Circulum API running on port ${port} [${nodeEnv}]`);
    logger.log(`CORS origin: ${nodeEnv === 'production' ? frontendUrl : '*'}`);
}
bootstrap();
//# sourceMappingURL=main.js.map