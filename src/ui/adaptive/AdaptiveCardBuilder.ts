import {AdaptiveCard} from "adaptivecards"

export class AdaptiveCardBuilder {

    public static fromText(text: string): AdaptiveCard {
        const cardJson: any = {
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.0",
            "type": "AdaptiveCard",
            "body": [
                {
                    "type": "TextBlock",
                    "wrap": true,
                    "text": text
                }
            ]
        }
        return AdaptiveCardBuilder.fromCardJson(cardJson)
    }

    public static fromCardJson(cardJson: AdaptiveCard) {
        const card = new AdaptiveCard()
        card.parse(cardJson)
        return card
    }

}
