import {AdaptiveBaseStep} from "./AdaptiveBaseStep";
import {UserChatMessage} from "../../UserChatMessage";

export type ActionTitleHandler = () => void

export abstract class AdaptiveActionHandlerStep extends AdaptiveBaseStep {

    abstract getActionTitleHandler(titleLower: string): ActionTitleHandler | undefined

    public handleMessage(message: UserChatMessage): boolean {
        const messageLower = message.text.toLowerCase()
        const handler: ActionTitleHandler | undefined = this.getActionTitleHandler(messageLower)
        if (handler != null) {
            handler()
            return true
        } else {
            return false
        }
    }

}
