import { Module } from '@nestjs/common'
import { RedisModule } from 'src/redis/redis.module'
import { TokenService } from './token.service'

@Module({
    imports: [RedisModule],
    providers: [TokenService],
    exports: [TokenService],
})
export class TokenModule {}
