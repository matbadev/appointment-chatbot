import {DateTimeFormatter, Duration} from "js-joda";

export enum EntryPointConfig {
    CHATBOT = "chatbot",
    OUTLOOK = "outlook",
}

export enum MessagesConfig {
    ADAPTIVE_CARDS = "adaptive",
    TEXTUAL = "textual",
}

export class Config {

    private readonly currentUrl = new URL(window.location.href)

    public dateTimeFormat = DateTimeFormatter.ofPattern("d.M.y HH:mm")
    public responseDuration = Duration.ofMillis(300)

    public entryPoint: EntryPointConfig = this.currentUrl.searchParams.get("entryPoint") === EntryPointConfig.OUTLOOK
        ? EntryPointConfig.OUTLOOK
        : EntryPointConfig.CHATBOT

    public messages: MessagesConfig = this.currentUrl.searchParams.get("messages") === MessagesConfig.TEXTUAL
        ? MessagesConfig.TEXTUAL
        : MessagesConfig.ADAPTIVE_CARDS

    public redirectToUrl(entryPoint: EntryPointConfig = this.entryPoint, messages: MessagesConfig = this.messages) {
        const targetUrl = new URL(window.location.href)
        targetUrl.search = ""
        targetUrl.searchParams.set("entryPoint", entryPoint)
        targetUrl.searchParams.set("messages", messages)
        window.location.href = targetUrl.toString()
    }

}
