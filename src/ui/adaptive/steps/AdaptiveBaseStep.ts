import {RootStep} from "./AdaptiveSteps";
import {Action, AdaptiveCard} from "adaptivecards";
import {LocalDate, LocalDateTime, LocalTime} from "js-joda";
import {Utils} from "../../../util/Utils";
import {AdaptiveCardBuilder} from "../AdaptiveCardBuilder";
import {BaseStep} from "../../BaseStep";
import {UserChatMessage} from "../../UserChatMessage";

export abstract class AdaptiveBaseStep extends BaseStep<AdaptiveCard> {

    protected returnToRoot = () => {
        this.context.stack.popWhile((top: BaseStep<AdaptiveCard>) => !(top instanceof RootStep))
    }

    protected emitText(text: string) {
        this.context.emitter(AdaptiveCardBuilder.fromText(text))
    }

    /** More than 5 actions will not be displayed by adaptive card. */
    protected emitCardJson(cardJson: any, action1?: string, action2?: string, action3?: string, action4?: string, action5?: string) {
        const newActionTitles: string[] = [action1, action2, action3, action4, action5].filter(Utils.isPresent)
        cardJson.actions = [...(cardJson.actions || []), ...newActionTitles.map((title: string) => ({
            type: "Action.Submit",
            title: title
        }))]
        this.context.emitter(AdaptiveCardBuilder.fromCardJson(cardJson))
    }

    protected readDateTime(message: UserChatMessage, dateId: string = "date", timeId: string = "time"): LocalDateTime | undefined {
        const data: any = message.data
        if (data != null) {
            try {
                return LocalDateTime.of(LocalDate.parse(data[dateId]), LocalTime.parse(data[timeId]))
            } catch (e) {
            }
        }
        this.emitText("Diesen Zeitpunkt habe ich leider nicht erkannt, bitte versuche es erneut.")
        return
    }

    protected readPositiveInt(message: UserChatMessage, id: string): number | undefined {
        const data: any = message.data
        if (data != null) {
            const int: number = parseInt(data[id])
            if (int >= 1) return int
        }
        this.emitText("Die Eingabe ist keine gültige positive Zahl, bitte versuche es erneut.")
        return
    }

    protected static readString(message: UserChatMessage, id: string): string | undefined {
        const data: any = message.data
        if (data != null) {
            const value: any = data[id]
            if (typeof value === "string" && value.length > 0) {
                return value
            }
        }
        return undefined
    }

}
