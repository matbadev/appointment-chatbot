import {Action, AdaptiveCard, SubmitAction} from "adaptivecards";
import {FromOutlookStep, ReturnToMainStep, RootStep} from "./steps/AdaptiveSteps";
import {EntryPointConfig} from "../../Config";
import {BaseChatBotBackend} from "../BaseChatBotBackend";
import {BaseStep} from "../BaseStep";
import {AdaptiveCardBuilder} from "./AdaptiveCardBuilder";
import {UserChatMessage} from "../UserChatMessage";

export class AdaptiveChatBotBackend extends BaseChatBotBackend<AdaptiveCard> {

    protected addInitialSteps(): void {
        this.context.stack.push(new RootStep(this.context))
        if (this.context.config.entryPoint === EntryPointConfig.OUTLOOK) {
            this.context.stack.push(new FromOutlookStep(this.context))
        }
    }

    protected buildNotUnderstoodMessage(): AdaptiveCard {
        return AdaptiveCardBuilder.fromText("Das habe ich leider nicht verstanden, bitte erneut versuchen.")
    }

    protected buildReturnToMainStep(): BaseStep<AdaptiveCard> {
        return new ReturnToMainStep(this.context)
    }

    protected emitMessage(message: AdaptiveCard) {
        message.onExecuteAction = this.sendUserAction
        super.emitMessage(message)
    }

    private sendUserAction = (action: Action) => {
        const data: any = action instanceof SubmitAction ? action.data : undefined
        const message = new UserChatMessage(action.title, data)
        this.sendUserMessage(message)
    }

}
