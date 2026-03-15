export declare const appConfig: (() => {
    nodeEnv: string;
    port: number;
    secret: string;
    frontendUrl: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    nodeEnv: string;
    port: number;
    secret: string;
    frontendUrl: string;
}>;
export declare const dbConfig: (() => {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
}>;
export declare const redisConfig: (() => {
    host: string;
    port: number;
    password: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    host: string;
    port: number;
    password: string;
}>;
export declare const jwtConfig: (() => {
    accessSecret: string;
    refreshSecret: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    accessSecret: string;
    refreshSecret: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
}>;
export declare const emailConfig: (() => {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    fromName: string;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    fromName: string;
}>;
export declare const throttleConfig: (() => {
    ttl: number;
    limit: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    ttl: number;
    limit: number;
}>;
