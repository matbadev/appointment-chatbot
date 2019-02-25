import * as React from "react"

export abstract class JsxChatMessage {
    public readonly id: number = Date.now() + Math.random()

    protected constructor(public readonly body: JSX.Element) {
    }

    public abstract getCssClassName(): string
}

export class UserJsxChatMessage extends JsxChatMessage {
    public constructor(public readonly text: string) {
        super(<span>{text}</span>)
    }

    public getCssClassName(): string {
        return "user"
    }
}

export class BotChatMessage extends JsxChatMessage {
    public constructor(body: JSX.Element, public readonly buttons: BotChatMessageButton[] = [], public readonly boxes: BotChatMessageCheckBox[] = [], public readonly dateTime: boolean = false) {
        super(body)
    }

    public getCssClassName(): string {
        return "bot"
    }
}

export class BotChatMessageButton {
    public readonly id: number = Date.now() + Math.random()

    public constructor(public readonly text: string) {
    }
}

export class BotChatMessageCheckBox {
    public readonly id: number = Date.now() + Math.random()

    public constructor(public readonly text: string) {
    }
}
