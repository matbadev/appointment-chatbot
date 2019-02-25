import * as React from "react"
import {FormEvent, PureComponent} from "react"
import {
    BotChatMessage,
    BotChatMessageButton,
    BotChatMessageCheckBox,
    JsxChatMessage,
    UserJsxChatMessage
} from "./JsxChatMessage"
import {JsxChatBotBackend} from "./JsxChatBotBackend";
import {LocalDateTime} from "js-joda";
import {ChatWindowHeader} from "../ChatWindowHeader";
import {Config} from "../../Config";
import {UserChatMessage} from "../UserChatMessage";

interface ChatWindowProps {
    config: Config
}

interface ChatWindowState {
    messages: Array<JsxChatMessage>
}

export class JsxChatWindow extends React.Component<ChatWindowProps, ChatWindowState> {

    private readonly backend = new JsxChatBotBackend(this.props.config)

    private messagesBottomElement?: HTMLElement = undefined

    constructor(props: ChatWindowProps) {
        super(props)
        this.state = {
            messages: []
        }
        this.backend.subscribe(this.addMessage)
    }

    private addMessage = (message: JsxChatMessage) => {
        this.setState({messages: [...this.state.messages, message]})
    }

    public render(): React.ReactNode {
        const {messages} = this.state
        const lastMessage: JsxChatMessage | undefined = messages[messages.length - 1]
        return (
            <div id="chat-window">
                <ChatWindowHeader config={this.props.config}/>

                <main>
                    {messages.map((message: JsxChatMessage) => (
                        <div key={message.id} className={`chat-message ${message.getCssClassName()}`}>
                            {message.body}
                        </div>
                    ))}

                    <div style={{flex: 1}}/>

                    {lastMessage instanceof BotChatMessage && (lastMessage as BotChatMessage).dateTime && (
                        <form className="chat-date" onSubmit={this.handleSubmitDate}>
                            <input type="datetime-local" required={true}/>
                            <input type="submit" value="Speichern"/>
                        </form>
                    )}

                    {lastMessage instanceof BotChatMessage && (lastMessage as BotChatMessage).buttons.length > 0 && (
                        <span className="chat-buttons">
                            {(lastMessage as BotChatMessage).buttons.map((button: BotChatMessageButton) => (
                                <ChatButton key={button.id} button={button} onButtonClick={this.onButtonClick}/>
                            ))}
                        </span>
                    )}

                    {lastMessage instanceof BotChatMessage && (lastMessage as BotChatMessage).boxes.length > 0 && (
                        <ChatCheckBoxForm boxes={(lastMessage as BotChatMessage).boxes} onSubmit={this.onSubmitBoxes}/>
                    )}

                    <div ref={this.bindMessagesBottomElement}/>
                </main>

                <footer>
                    <form onSubmit={this.onSendMessage}>
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

    private bindMessagesBottomElement = (element: HTMLDivElement) => {
        this.messagesBottomElement = element
    }

    private onSendMessage = (event: FormEvent) => {
        event.preventDefault()
        const form: HTMLFormElement = event.target as HTMLFormElement
        const input: HTMLInputElement = form.elements.item(0) as HTMLInputElement
        const messageText: string = input.value.trim()
        if (messageText.length > 0) {
            input.value = ""
            this.sendMessage(new UserChatMessage(messageText))
        }
    }

    private onButtonClick = (button: BotChatMessageButton) => {
        this.sendMessage(new UserChatMessage(button.text))
    }

    private onSubmitBoxes = (selectedItems: string[]) => {
        this.sendMessage(new UserChatMessage(selectedItems.join(", ")))
    }

    private handleSubmitDate = (event: FormEvent) => {
        event.preventDefault()
        const form: HTMLFormElement = event.target as HTMLFormElement
        const dateInput: HTMLInputElement = form.elements.item(0) as HTMLInputElement
        try {
            const date = LocalDateTime.parse(dateInput.value)
            this.sendMessage(new UserChatMessage(date.format(this.props.config.dateTimeFormat)))
        } catch (ex) {
        }
    }

    private sendMessage = (message: UserChatMessage) => {
        this.addMessage(new UserJsxChatMessage(message.text))
        this.backend.sendUserMessage(message)
    }

    public componentDidUpdate(prevProps: Readonly<ChatWindowProps>, prevState: Readonly<ChatWindowState>, snapshot?: any) {
        this.messagesBottomElement!.scrollIntoView({behavior: "smooth"})
    }

}

class ChatButtonProps {
    button: BotChatMessageButton
    onButtonClick: (button: BotChatMessageButton) => void
}

class ChatButton extends PureComponent<ChatButtonProps> {

    render(): React.ReactNode {
        const {button} = this.props
        return (
            <span className="chat-button" onClick={this.handleClick}>{button.text}</span>
        )
    }

    private handleClick = () => {
        this.props.onButtonClick(this.props.button)
    }

}

class ChatCheckBoxFormProps {
    boxes: BotChatMessageCheckBox[]
    onSubmit: (selectedItems: string[]) => void
}

class ChatCheckBoxForm extends PureComponent<ChatCheckBoxFormProps> {

    render(): React.ReactNode {
        return (
            <form className="chat-checkboxes" onSubmit={this.handleSubmit}>
                {this.props.boxes.map((box: BotChatMessageCheckBox) => (
                    <label key={box.id} className="chat-checkbox">
                        <input type="checkbox"/>{box.text}
                    </label>
                ))}
                <input type="submit" value="Speichern"/>
            </form>
        )
    }

    private handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        const selectedItems: string[] = []
        const form: HTMLElement = event.target as HTMLElement
        for (let childIndex = 0; childIndex < form.children.length; childIndex++) {
            const label: HTMLElement = form.children.item(childIndex) as HTMLElement
            if (label.children.length > 0) {
                const checkBox: HTMLInputElement = label.children.item(0) as HTMLInputElement
                if (checkBox.checked) {
                    selectedItems.push(label.textContent as string)
                }
            }
        }
        this.props.onSubmit(selectedItems)
    }

}
