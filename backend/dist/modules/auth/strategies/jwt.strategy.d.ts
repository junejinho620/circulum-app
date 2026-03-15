import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../../../database/entities/user.entity';
export interface JwtPayload {
    sub: string;
    handle: string;
    role: string;
    universityId: string;
    iat?: number;
    exp?: number;
}
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private config;
    private userRepo;
    constructor(config: ConfigService, userRepo: Repository<User>);
    validate(payload: JwtPayload): Promise<User>;
}
export {};
