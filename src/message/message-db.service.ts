import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Content } from 'src/content/content.entity'
import { User } from 'src/user/user.entity'
import { EntityManager, Repository } from 'typeorm'
import { Message } from './message.entity'

@Injectable()
export class MessageDBService {
    constructor(
        @InjectRepository(Message)
        private readonly messageRepository: Repository<Message>
    ) {}

    async create(content: Content, sender: User, receiver: User, manager: EntityManager) {
        const newMessage = new Message()

        newMessage.content = content
        newMessage.sender = sender
        newMessage.receiver = receiver

        const messageRepo = manager.getRepository(Message)

        return await messageRepo.save(newMessage)
    }

    async findOneOnlyIDBoolean(interlocutor1: User, interlocutor2: User) {
        const message = await this.messageRepository.findOne({
            select: ['id'],
            where: [
                {
                    sender: interlocutor1,
                    receiver: interlocutor2,
                },
                {
                    sender: interlocutor2,
                    receiver: interlocutor1,
                },
            ],
        })

        if (!message) {
            return false
        } else {
            return true
        }
    }

    async findOne(id: number, errorMessage?: string) {
        const message = await this.messageRepository.findOne({
            relations: ['sender', 'receiver', 'content'],
            where: {
                id,
            },
        })

        if (!message) {
            throw new BadRequestException(errorMessage ? errorMessage : 'Message not found')
        } else {
            return message
        }
    }

    async find(interlocutor1: User, interlocutor2: User, take: number, skip: number, errorMessage?: string) {
        const messages = await this.messageRepository.find({
            relations: ['sender', 'receiver', 'content'],
            order: {
                createdAt: 'DESC',
            },
            skip,
            take,
            where: [
                {
                    sender: interlocutor1,
                    receiver: interlocutor2,
                },
                {
                    sender: interlocutor2,
                    receiver: interlocutor1,
                },
            ],
        })

        if (!messages) {
            throw new BadRequestException(errorMessage ? errorMessage : 'Messages not found')
        }

        return messages
    }

    async findLatest(interlocutor1: User, interlocutor2: User) {
        return await this.messageRepository.find({
            relations: ['sender', 'receiver', 'content'],
            where: [
                {
                    sender: interlocutor1,
                    receiver: interlocutor2,
                },
                {
                    sender: interlocutor2,
                    receiver: interlocutor1,
                },
            ],
            order: {
                createdAt: 'DESC',
            },
            take: 1,
        })
    }

    async update(content: Content, message: Message, manager: EntityManager) {
        message.content = content
        message.is_updated = true

        const messageRepo = manager.getRepository(Message)
        await messageRepo.save(message)
    }

    async delete(message: Message) {
        await this.messageRepository.remove(message)
    }
}