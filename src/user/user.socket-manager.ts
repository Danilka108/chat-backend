import { Injectable } from '@nestjs/common'
import { Socket } from 'socket.io'
import { config } from 'src/config'
import { IRedisSession } from 'src/redis/interface/redis-session.interface'
import { isSessionsEqual } from 'src/redis/is-sessions-equal'

@Injectable()
export class UserSocketManager {
    private readonly userSessionsSockets!: Map<IRedisSession, Socket>

    constructor() {
        this.userSessionsSockets = new Map<IRedisSession, Socket>()
    }

    addUserSessionSocket(session: IRedisSession, socket: Socket) {
        const { maxNum } = config.refreshToken

        let allUserSessionsLen = 0
        for (const [userSession] of this.userSessionsSockets) {
            if (userSession.userID === session.userID) allUserSessionsLen += 1
        }

        if (allUserSessionsLen >= maxNum) {
            for (const [userSession] of this.userSessionsSockets) {
                if (userSession.userID === session.userID) {
                    this.userSessionsSockets.delete(session)
                    break
                }
            }
        }

        this.userSessionsSockets.set(session, socket)
    }

    findUserSessions(userID: number) {
        const sessions: IRedisSession[] = []

        for (const [session] of this.userSessionsSockets) {
            if (session.userID === userID) {
                sessions.push(session)
            }
        }

        return sessions
    }

    getUserIDBySocket(socket: Socket) {
        for (const [userSesion, userSocket] of this.userSessionsSockets) {
            if (socket === userSocket) {
                return userSesion.userID
            }
        }

        return null
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    emitToUser(userID: number, event: string, ...data: any[]) {
        for (const [session, socket] of this.userSessionsSockets) {
            if (session.userID === userID) {
                socket.emit(event, ...data)
            }
        }
    }

    removeUserSessionSocket(socket: Socket) {
        for (const [userSession, userSocket] of this.userSessionsSockets) {
            if (userSocket === socket) {
                this.userSessionsSockets.delete(userSession)
                break
            }
        }
    }

    disconnectUserSessionSocket(session: IRedisSession) {
        for (const [userSession, userSocket] of this.userSessionsSockets) {
            if (isSessionsEqual(userSession, session)) {
                this.userSessionsSockets.delete(userSession)
                userSocket.disconnect(true)
            }
        }
    }
}
