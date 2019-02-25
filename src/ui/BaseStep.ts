import {ChatContext} from "./ChatContext";
import {UserChatMessage} from "./UserChatMessage";
import {LocalDateTime} from "js-joda";

export abstract class BaseStep<M> {

    public constructor(protected readonly context: ChatContext<M>) {
    }

    public abstract start(): void

    public abstract handleMessage(message: UserChatMessage): boolean

    protected push(step: BaseStep<M>) {
        this.context.stack.push(step)
    }

    protected finish() {
        this.context.stack.pop()
    }

    protected formatDateTime(dateTime: LocalDateTime): string {
        return dateTime.format(this.context.config.dateTimeFormat)
    }

}
