import * as React from "react";
import {ChangeEvent} from "react";
import {Config, EntryPointConfig, MessagesConfig} from "../Config";

interface ChatWindowHeaderProps {
    config: Config
}

export class ChatWindowHeader extends React.PureComponent<ChatWindowHeaderProps> {

    public render(): React.ReactNode {
        return (
            <header>
                <div id="chat-window-modes">
                    <label htmlFor="messages">Nachrichten:</label>
                    <select id="messages" value={this.props.config.messages} onChange={this.handleMessagesChange}>
                        <option value={MessagesConfig.ADAPTIVE_CARDS}>Adaptive Cards</option>
                        <option value={MessagesConfig.TEXTUAL}>Textuell</option>
                    </select>

                    <label htmlFor="entryPoint">Einstiegspunkt:</label>
                    <select id="entryPoint" value={this.props.config.entryPoint} onChange={this.handleEntryPointChange}>
                        <option value={EntryPointConfig.CHATBOT}>Chatbot</option>
                        <option value={EntryPointConfig.OUTLOOK}>Outlook</option>
                    </select>
                </div>

                <span id="chat-window-heading">Chatbot zur Terminplanung</span>
            </header>
        )
    }

    private handleMessagesChange = (event: ChangeEvent<HTMLSelectElement>) => {
        this.props.config.redirectToUrl(undefined, event.target.value as MessagesConfig)
    }

    private handleEntryPointChange = (event: ChangeEvent<HTMLSelectElement>) => {
        this.props.config.redirectToUrl(event.target.value as EntryPointConfig, undefined)
    }

}
