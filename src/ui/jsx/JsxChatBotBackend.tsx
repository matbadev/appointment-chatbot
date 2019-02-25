import * as React from "react"
import {BotChatMessage, JsxChatMessage} from "./JsxChatMessage";
import {FromOutlookStep, ReturnToMainStep, RootStep} from "./steps/JsxSteps";
import {BaseChatBotBackend} from "../BaseChatBotBackend";
import {BaseStep} from "../BaseStep";
import {EntryPointConfig} from "../../Config";

export class JsxChatBotBackend extends BaseChatBotBackend<JsxChatMessage> {

    protected addInitialSteps(): void {
        this.context.stack.push(new RootStep(this.context))
        if (this.context.config.entryPoint === EntryPointConfig.OUTLOOK) {
            this.context.stack.push(new FromOutlookStep(this.context))
        }
    }

    protected buildNotUnderstoodMessage(): JsxChatMessage {
        return new BotChatMessage(
            <span>Das habe ich leider nicht verstanden, bitte erneut versuchen.</span>
        )
    }

    protected buildReturnToMainStep(): BaseStep<JsxChatMessage> {
        return new ReturnToMainStep(this.context)
    }

}
