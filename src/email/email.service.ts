import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { forwardRef } from '@nestjs/common/utils/forward-ref.util'
import Mail from 'nodemailer/lib/mailer'
import { config } from 'src/config'
import { RedisService } from 'src/redis/redis.service'
import { TokenService } from 'src/token/token.service'
import { UserService } from 'src/user/user.service'
import { NODEMAILER_TRANSPORTER } from '../nodemailer/nodemailer.constants'
import { QueryDto } from './dto/query.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'

@Injectable()
export class EmailService {
    constructor(
        @Inject(NODEMAILER_TRANSPORTER)
        private readonly nodemailerTransporter: Mail,
        private readonly redisService: RedisService,
        private readonly tokenService: TokenService,
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService
    ) {}

    async sendConfirmEmail(userID: number, address: string) {
        const confirmToken = this.tokenService.createEmailToken()
        const { hostname } = config.app
        const { from, expiresInHours } = config.email

        const link = `http://${hostname}/api/email/confirm-email?id=${userID}&token=${confirmToken}`

        await this.redisService.setConfirmEmail(userID, confirmToken)

        await this.nodemailerTransporter.sendMail({
            from: `${from}`,
            to: address,
            subject: 'Confirm email',
            text: `Link is valid for ${expiresInHours} hours. ${link}`,
            html: `
				<h1>Confirm email</h1>
				<p>Link is valid for ${expiresInHours} hours.</p>
				<a href="${link}">Verify</a>
			`,
        })
    }

    async confirmEmail({ id: userID, token: confirmEmailToken }: QueryDto) {
        const redisConfirmEmailToken = await this.redisService.getConfirmEmail(userID)

        if (!redisConfirmEmailToken) {
            throw new BadRequestException('Invalid id or token')
        }

        if (confirmEmailToken !== redisConfirmEmailToken) {
            throw new BadRequestException('Invalid id or token')
        }

        await this.redisService.delConfirmEmail(userID)
    }

    async verifyConfirmEmail(userID: number, errorMessage = 'You need to confirm your email') {
        const isConfirm = await this.redisService.getConfirmEmail(userID)
        if (isConfirm) {
            throw new UnauthorizedException(errorMessage)
        }
    }

    async sendResetPassword(userID: number, address: string) {
        const resetToken = this.tokenService.createEmailToken()
        const { hostname } = config.app
        const { from, expiresInHours } = config.email

        const link = `http://${hostname}/api/email/reset-password?id=${userID}&token=${resetToken}`

        await this.redisService.setResetPassword(userID, resetToken)

        await this.nodemailerTransporter.sendMail({
            from: `${from}`,
            to: address,
            subject: 'Reset password',
            text: `Link is valid for ${expiresInHours} hours. ${link}`,
            html: `
				<h1>Reset password</h1>
				<p>Link is valid for ${expiresInHours} hours.</p>
				<a href="${link}">Reset</a>
			`,
        })
    }

    async resetPassword({ newPassword }: ResetPasswordDto, { id: userID, token: resetPasswordToken }: QueryDto) {
        const redisResetPasswordToken = await this.redisService.getResetPassword(userID)

        if (!redisResetPasswordToken) {
            throw new UnauthorizedException('Invalid id or token')
        }
        if (resetPasswordToken !== redisResetPasswordToken) {
            throw new UnauthorizedException('Invalid id or token')
        }

        await this.userService.setNewPassword(userID, newPassword)

        await this.redisService.delResetPassword(userID)
    }

    async sendChangeEmail(userID: number, newAddress: string) {
        const changeEmailToken = this.tokenService.createEmailToken()
        const { hostname } = config.app
        const { from, expiresInHours } = config.email

        const link = `http://${hostname}/api/email/change-email?id=${userID}&token=${changeEmailToken}`

        await this.redisService.setChangeEmail(userID, { token: changeEmailToken, email: newAddress })

        await this.nodemailerTransporter.sendMail({
            from: `${from}`,
            to: newAddress,
            subject: 'Confirm new email',
            text: `Link is valid for ${expiresInHours} hours. ${link}`,
            html: `
				<h1>Confirm new email</h1>
				<p>Link is valid for ${expiresInHours} hours.</p>
				<a href="${link}">Confirm</a>
			`,
        })
    }

    async changeEmail({ id: userID, token: changeEmailToken }: QueryDto) {
        const redisChangeEmailData = await this.redisService.getChangeEmail(userID)

        if (!redisChangeEmailData) {
            throw new UnauthorizedException('Invalid id or token')
        }
        if (changeEmailToken !== redisChangeEmailData.token) {
            throw new UnauthorizedException('Invalid id or token')
        }

        await this.userService.setNewEmail(userID, redisChangeEmailData.email)

        await this.redisService.delChangeEmail(userID)
    }
}
