import { AbstractRepository } from '../../abstract.repository';
import { Message } from './message.model';
import { IMessage } from './../../../utils';
export class MessageRepository extends AbstractRepository<IMessage> {
    constructor() {
        super(Message);
    }
}
