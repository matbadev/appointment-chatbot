import {ChatContext} from "./ChatContext";
import {Config} from "../Config";
import {Stack} from "../util/Stack";
import {AppointmentRepository} from "../data/AppointmentRepository";
import {AppointmentBuilder} from "../data/AppointmentBuilder";
import {Consumer} from "../util/Consumer";
import {BaseStep} from "./BaseStep";
import {UserChatMessage} from "./UserChatMessage";

export abstract class BaseChatBotBackend<M> {

    protected context: ChatContext<M> = new ChatContext(this.config, (message: M) => this.emitMessage(message), new Stack(), new AppointmentRepository(), new AppointmentBuilder())

    private readonly subscribers: Array<Consumer<M>> = []

    public constructor(private readonly config: Config) {
    }

    protected abstract addInitialSteps(): void

    protected abstract buildNotUnderstoodMessage(): M

    protected abstract buildReturnToMainStep(): BaseStep<M>

    protected emitMessage(message: M) {
        this.subscribers.forEach((consumer: Consumer<M>) => consumer(message))
    }

    public subscribe(subscriber: Consumer<M>) {
        this.subscribers.push(subscriber)
        this.addInitialSteps()
        window.setTimeout(this.startFirstStep, this.config.responseDuration.toMillis())
    }

    private startFirstStep = () => {
        this.context.stack.peek().start()
    }

    public sendUserMessage(message: UserChatMessage) {
        window.setTimeout(() => this.answerUserMessage(message), this.config.responseDuration.toMillis())
    }

    private answerUserMessage(message: UserChatMessage) {
        const messageLower: string = message.text.toLowerCase()
        if (!this.handleGlobalCommand(messageLower) && !this.context.stack.peek().handleMessage(message)) {
            this.emitMessage(this.buildNotUnderstoodMessage())
        }
        this.context.stack.peek().start()
    }

    private handleGlobalCommand(inputText: string): boolean {
        if (inputText.startsWith("/")) {
            const command: string = inputText.substring(1)
            if (command == "hauptmenü") {
                this.context.stack.push(this.buildReturnToMainStep())
                return true
            }
        }
        return false;
    }

}
