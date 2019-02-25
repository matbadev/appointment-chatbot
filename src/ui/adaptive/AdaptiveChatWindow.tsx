import * as React from "react"
import {FormEvent} from "react"
import {AdaptiveCard} from "adaptivecards";
import {AdaptiveChatBotBackend} from "./AdaptiveChatBotBackend";
import {ChatWindowHeader} from "../ChatWindowHeader";
import {Config} from "../../Config";
import {UserChatMessage} from "../UserChatMessage";

interface AdaptiveChatWindowProps {
    config: Config
}

export class AdaptiveChatWindow extends React.PureComponent<AdaptiveChatWindowProps> {

    private readonly backend = new AdaptiveChatBotBackend(this.props.config)

    private messagesContainerElement?: HTMLDivElement = undefined
    private messagesBottomElement?: HTMLDivElement = undefined

    constructor(props: AdaptiveChatWindowProps) {
        super(props)
        this.state = {}
        this.backend.subscribe(this.addCard)
    }

    private addCard = (card: AdaptiveCard) => {
        card.onInlineCardExpanded = this.scrollToBottom
        const messageElement: HTMLElement = card.render()
        messageElement.classList.add("chat-message", "bot")
        messageElement.style.backgroundColor = null
        messageElement.style.padding = null
        messageElement.ondblclick = () => {
            const messageJsonObject: any = card.toJSON()
            console.log(messageJsonObject)
            // @ts-ignore
            navigator["clipboard"].writeText(JSON.stringify(messageJsonObject))
        }
        this.addMessageElement(messageElement)
    }

    public render(): React.ReactNode {
        return (
            <div id="chat-window">
                <ChatWindowHeader config={this.props.config}/>

                <main ref={this.bindMessagesContainerElement}>
                    {/* Cards are inserted here */}
                    <div ref={this.bindMessagesBottomElement}/>
                </main>

                <footer>
                    <form onSubmit={this.onSubmitUserMessage}>
                        <input
                            id="chat-input"
                            type="text"
                            name="message"
                            autoComplete="off"
                            placeholder="Schreiben..."
                        />
                        <input type="submit" value="Senden"/>
                    </form>
                </footer>
            </div>
        )
    }

    private bindMessagesContainerElement = (messagesContainer: HTMLDivElement) => {
        this.messagesContainerElement = messagesContainer
    }

    private bindMessagesBottomElement = (element: HTMLDivElement) => {
        this.messagesBottomElement = element
    }

    private onSubmitUserMessage = (event: FormEvent) => {
        event.preventDefault()
        const form: HTMLFormElement = event.target as HTMLFormElement
        const input: HTMLInputElement = form.elements.item(0) as HTMLInputElement
        const messageText: string = input.value.trim()
        if (messageText.length > 0) {
            input.value = ""
            this.sendUserMessage(messageText)
        }
    }

    private sendUserMessage(message: string) {
        const element: HTMLDivElement = document.createElement("div")
        element.className = "chat-message user"
        element.appendChild(document.createTextNode(message))
        this.addMessageElement(element)
        this.backend.sendUserMessage(new UserChatMessage(message))
    }

    private addMessageElement(messageElement: HTMLElement) {
        const {children} = this.messagesContainerElement!
        for (let index = 0; index < children.length - 1; index++) {
            children.item(index)!.classList.add("disabled")
        }
        this.messagesContainerElement!.insertBefore(messageElement, this.messagesBottomElement!)
        this.scrollToBottom()
    }

    private scrollToBottom = () => {
        this.messagesBottomElement!.scrollIntoView({behavior: "smooth"})
    }

}
