import {JsxBaseStep} from "./JsxBaseStep";
import {UserChatMessage} from "../../UserChatMessage";

export type MessageHandler = () => void

export abstract class JsxMessageHandlerStep extends JsxBaseStep {

    abstract getMessageHandler(messageText: string): MessageHandler | undefined

    public handleMessage(message: UserChatMessage): boolean {
        const messageText = message.text.toLowerCase()
        const handler: MessageHandler | undefined = this.getMessageHandler(messageText)
        if (handler != null) {
            handler()
            return true
        } else {
            return false
        }
    }

}
