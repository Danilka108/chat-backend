import { Module } from '@nestjs/common'
import { UserModule } from './user/user.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from './auth/auth.module'
import { NodemailerModule } from './nodemailer/nodemailer.module'
import { TokenModule } from './token/token.module'
import { config } from './config'
import { EmailModule } from './email/email.module'
import { RedisCoreModule } from './redis/redis-core.module'
import { RedisModule } from './redis/redis.module'
import { MessageModule } from './message/message.module'
import { ContentModule } from './content/content.module'
import { DialogModule } from './dialog/dialog.module'

@Module({
    imports: [
        TypeOrmModule.forRoot(config.db),
        RedisCoreModule.forRoot(config.redis),
        NodemailerModule.forRoot(config.nodemailer),
        RedisModule,
        UserModule,
        AuthModule,
        TokenModule,
        EmailModule,
        MessageModule,
        ContentModule,
        DialogModule,
    ],
})
export class AppModule {}
