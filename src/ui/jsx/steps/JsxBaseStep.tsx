import {BotChatMessage, BotChatMessageButton, BotChatMessageCheckBox, JsxChatMessage} from "../JsxChatMessage";
import * as React from "react";
import {RootStep} from "./JsxSteps";
import {LocalDateTime} from "js-joda";
import {BaseStep} from "../../BaseStep";
import {UserChatMessage} from "../../UserChatMessage";

export abstract class JsxBaseStep extends BaseStep<JsxChatMessage> {

    protected emitMessage(body: JSX.Element, buttons: BotChatMessageButton[] = [], boxes: BotChatMessageCheckBox[] = [], dateTime: boolean = false) {
        this.context.emitter(new BotChatMessage(body, buttons, boxes, dateTime))
    }

    protected emitTextMessage(body: string, buttons: BotChatMessageButton[] = [], boxes: BotChatMessageCheckBox[] = [], dateTime: boolean = false) {
        this.emitMessage((<span>{body}</span>), buttons, boxes, dateTime)
    }

    protected returnToRoot = () => {
        this.context.stack.popWhile((top: BaseStep<JsxChatMessage>) => !(top instanceof RootStep))
    }

    protected readDateTime(message: UserChatMessage): LocalDateTime | undefined {
        try {
            return LocalDateTime.parse(message.text, this.context.config.dateTimeFormat)
        } catch (ex) {
            this.emitMessage(
                <span>Das Datum <i>{message.text}</i> habe ich leider nicht erkannt. Bitte verwende ein anderes Eingabeformat, z.B. <i>16.03.2018 14:20</i>.</span>
            )
            return
        }
    }

    protected readPositiveNumber(message: UserChatMessage): number | undefined {
        const int: number = parseInt(message.text)
        if (int >= 1) return int
        this.emitMessage(
            <span>Die Eingabe <i>{message.text}</i> ist keine gültige positive Zahl, bitte versuche es erneut.</span>
        )
        return
    }

}
