import * as React from "react"
import * as ReactDOM from "react-dom"
import {JsxChatWindow} from "./ui/jsx/JsxChatWindow"
import {AdaptiveChatWindow} from "./ui/adaptive/AdaptiveChatWindow";

import "./index.css"
import {Config, MessagesConfig} from "./Config";

const config = new Config()

const chatWindow: JSX.Element = config.messages === MessagesConfig.TEXTUAL
    ? (<JsxChatWindow config={config}/>)
    : (<AdaptiveChatWindow config={config}/>)

ReactDOM.render(
    chatWindow,
    document.getElementById("root") as HTMLElement
)
