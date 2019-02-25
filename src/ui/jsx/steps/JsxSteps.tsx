import {BotChatMessageButton, BotChatMessageCheckBox} from "../JsxChatMessage";
import * as React from "react";
import {JsxMessageHandlerStep, MessageHandler} from "./JsxMessageHandlerStep";
import {JsxBaseStep} from "./JsxBaseStep";
import {AppointmentBuilder} from "../../../data/AppointmentBuilder";
import {UserChatMessage} from "../../UserChatMessage";
import {AppointmentEquipment, AppointmentRepository, AppointmentRoom} from "../../../data/AppointmentRepository";
import {EntryPointConfig} from "../../../Config";
import {Utils} from "../../../util/Utils";

export class RootStep extends JsxMessageHandlerStep {
    private static newAppointment = new BotChatMessageButton("Neuen Termin anlegen")
    private static manageAppointments = new BotChatMessageButton("Termine verwalten")

    private startCreateNewAppointmentFlow = () => {
        this.context.stack.pushAll(
            new AppointmentCreatedStep(this.context),
            new AllDataStep(this.context),
            new ParticipantsStep(this.context),
            new RoomConfirmStep(this.context),
            new BasicDataStep(this.context),
            new DateEndStep(this.context),
            new DateStartStep(this.context),
            new TitleStep(this.context),
        )
    }

    private startManageAppointmentFlow = () => {
        this.context.stack.pushAll(
            new AppointmentCreatedStep(this.context),
            new AllDataStep(this.context),
            new ManageAppointmentsStep(this.context),
        )
    }

    private messageHandlers: { [text: string]: MessageHandler } = {
        [RootStep.newAppointment.text.toLowerCase()]: this.startCreateNewAppointmentFlow,
        [RootStep.manageAppointments.text.toLowerCase()]: this.startManageAppointmentFlow,
    }

    public start(): void {
        this.context.builder = new AppointmentBuilder()
        this.emitMessage((
                <span>Willkommen beim Chatbot! Du kannst jederzeit <i>/hauptmenü</i> eingeben, um hierhin zurückzukehren. Was möchtest du tun?</span>
            ), this.context.config.entryPoint === EntryPointConfig.CHATBOT
            ? [RootStep.newAppointment, RootStep.manageAppointments]
            : [RootStep.manageAppointments]
        )
    }

    public getMessageHandler(messageText: string): MessageHandler | undefined {
        return this.messageHandlers[messageText]
    }
}

export class FromOutlookStep extends JsxMessageHandlerStep {
    private static startOutlookFlow = new BotChatMessageButton("Ja")
    private static backToRoot = new BotChatMessageButton("Nein, zurück zum Hauptmenü")

    private startOutlookFlow = () => {
        this.context.stack.pushAll(
            new AppointmentCreatedStep(this.context),
            new AllDataStep(this.context),
            new RoomConfirmStep(this.context),
        )
    }

    private messageHandlers: { [text: string]: MessageHandler } = {
        [FromOutlookStep.startOutlookFlow.text.toLowerCase()]: this.startOutlookFlow,
        [FromOutlookStep.backToRoot.text.toLowerCase()]: this.returnToRoot,
    }

    public start(): void {
        this.context.builder = AppointmentRepository.buildDummyOutlookAppointment()
        const {title, start, end} = this.context.builder
        this.emitMessage((
                <span>
                Hallo! Du hast gerade folgenden Termin in Outlook erstellt:<br/>
                <ul>
                    <li><b>Titel:</b> {title}</li>
                    <li><b>Beginn:</b> {this.formatDateTime(start!)}</li>
                    <li><b>Ende:</b> {this.formatDateTime(end!)}</li>
                </ul>
                Soll ich dir bei der weiteren Planung helfen?
            </span>
            ), [FromOutlookStep.startOutlookFlow, FromOutlookStep.backToRoot]
        )
    }

    public getMessageHandler(messageText: string): MessageHandler | undefined {
        return this.messageHandlers[messageText]
    }
}

class ManageAppointmentsStep extends JsxBaseStep {
    public start(): void {
        this.emitTextMessage(
            "Welchen Termin möchtest du bearbeiten?",
            this.context.repository.getAll()
                .map((appointment: AppointmentBuilder) => new BotChatMessageButton(appointment.title!))
        )
    }

    public handleMessage(message: UserChatMessage): boolean {
        const messageText: string = message.text.toLowerCase()
        const builder: AppointmentBuilder | undefined = this.context.repository.getByTitle(messageText)
        if (builder != null) {
            this.context.builder = builder
            this.finish()
            return true
        } else {
            return false
        }
    }
}

class TitleStep extends JsxBaseStep {
    public start(): void {
        this.emitTextMessage("Wie lautet der Titel des Termins?")
    }

    public handleMessage(message: UserChatMessage): boolean {
        this.context.builder.title = message.text
        this.finish()
        return true
    }
}

class DateStartStep extends JsxBaseStep {
    public start(): void {
        this.emitMessage((<span>Wann soll der Termin beginnen?</span>), [], [], true)
    }

    public handleMessage(message: UserChatMessage): boolean {
        this.context.builder.start = this.readDateTime(message)
        if (this.context.builder.start != null) {
            this.finish()
        }
        return true
    }
}

class DateEndStep extends JsxBaseStep {
    public start(): void {
        this.emitMessage((<span>Wann soll der Termin enden?</span>), [], [], true)
    }

    public handleMessage(message: UserChatMessage): boolean {
        this.context.builder.end = this.readDateTime(message)
        if (this.context.builder.end != null) {
            this.finish()
        }
        return true
    }
}

class BasicDataStep extends JsxMessageHandlerStep {
    private static dataCorrect = new BotChatMessageButton("Daten korrekt")
    private static changeTitle = new BotChatMessageButton("Titel ändern")
    private static changeDateStart = new BotChatMessageButton("Beginn ändern")
    private static changeDateEnd = new BotChatMessageButton("Ende ändern")

    private messageHandlers: { [messageText: string]: MessageHandler } = {
        [BasicDataStep.dataCorrect.text.toLowerCase()]: () => this.finish(),
        [BasicDataStep.changeTitle.text.toLowerCase()]: () => this.push(new TitleStep(this.context)),
        [BasicDataStep.changeDateStart.text.toLowerCase()]: () => this.push(new DateStartStep(this.context)),
        [BasicDataStep.changeDateEnd.text.toLowerCase()]: () => this.push(new DateEndStep(this.context))
    }

    public start(): void {
        const {title, start, end} = this.context.builder
        const formattedMessage: JSX.Element = (
            <span>
                Folgende Daten habe ich erkannt:<br/>
                <ul>
                    <li><b>Titel:</b> {title}</li>
                    <li><b>Beginn:</b> {this.formatDateTime(start!)}</li>
                    <li><b>Ende:</b> {this.formatDateTime(end!)}</li>
                </ul>
                Sind diese Daten korrekt?
            </span>
        )
        this.emitMessage(formattedMessage, [BasicDataStep.dataCorrect, BasicDataStep.changeTitle, BasicDataStep.changeDateStart, BasicDataStep.changeDateEnd])
    }

    public getMessageHandler(messageText: string): MessageHandler | undefined {
        return this.messageHandlers[messageText];
    }
}

class RoomConfirmStep extends JsxMessageHandlerStep {
    private static roomOk = new BotChatMessageButton("Raum in Ordnung")
    private static changeRoom = new BotChatMessageButton("Raum/Equipment ändern")

    private messageHandlers: { [messageText: string]: MessageHandler } = {
        [RoomConfirmStep.roomOk.text.toLowerCase()]: () => this.finish(),
        [RoomConfirmStep.changeRoom.text.toLowerCase()]: () => this.context.stack.pushAll(
            new RoomSearchStep(this.context),
            new ParticipantsCountStep(this.context)
        ),
    }

    public start(): void {
        const {room} = this.context.builder
        this.emitMessage((
                <span>Ich kann dir den Raum {room.name} für maximal {room.maxPeople} Personen {room.equipment.size === 0 ? "ohne Equipment" : "mit " + Array.from(room.equipment).join(", ")} anbieten. Ist dieser Raum in Ordnung oder benötigst du einen anderen mit eventuell zusätzlichem Equipment?</span>
            ), [RoomConfirmStep.roomOk, RoomConfirmStep.changeRoom]
        )
    }

    public getMessageHandler(messageText: string): MessageHandler | undefined {
        return this.messageHandlers[messageText];
    }
}

class ParticipantsCountStep extends JsxBaseStep {
    public start(): void {
        this.emitTextMessage("Wie viele Teilnehmer werden erwartet?")
    }

    public handleMessage(message: UserChatMessage): boolean {
        this.context.builder.participantsCount = this.readPositiveNumber(message)
        if (this.context.builder.participantsCount != null) {
            this.finish()
        }
        return true
    }
}

class RoomSearchStep extends JsxBaseStep {
    public start(): void {
        this.emitMessage(
            (<span>Welches Equipment benötigst du im Raum?</span>),
            [],
            AppointmentEquipment.ALL.map((name: string) => new BotChatMessageCheckBox(name))
        )
    }

    public handleMessage(message: UserChatMessage): boolean {
        const requiredEquipment: string[] = message.text.split(",")
            .map((name: string) => name.trim())
            .filter(Utils.isNotEmpty)
        this.context.builder.room = AppointmentRoom.getRecommended(this.context.builder.participantsCount!, requiredEquipment)
        this.finish()
        return true
    }
}

class ParticipantsStep extends JsxBaseStep {
    public start(): void {
        this.emitMessage(<span>Bitte sende mir die Teilnehmer durch Komma getrennt. <small>Später wird es hierfür Autovervollständigung in der Eingabeleiste geben</small></span>)
    }

    public handleMessage(message: UserChatMessage): boolean {
        this.context.builder.participants = message.text.split(",")
            .map((participant: string) => participant.trim())
            .filter(Utils.isNotEmpty)
        this.emitMessage(
            <span>Du hast folgende {this.context.builder.participants.length} Teilnehmer registriert: <i>{this.context.builder.participants.join(", ")}</i></span>)
        this.finish()
        return true
    }
}

class AllDataStep extends JsxMessageHandlerStep {
    private static createAppointment = new BotChatMessageButton("Termin speichern")
    private static cancelAppointment = new BotChatMessageButton("Termin stornieren")
    private static changeBasicData = new BotChatMessageButton("Basisdaten ändern")
    private static changeParticipants = new BotChatMessageButton("Teilnehmer ändern")
    private static changeRoom = new BotChatMessageButton("Raum ändern")
    private static changeCatering = new BotChatMessageButton("Catering ändern")

    private messageHandlers: { [messageText: string]: MessageHandler } = {
        [AllDataStep.createAppointment.text.toLowerCase()]: () => this.finish(),
        [AllDataStep.cancelAppointment.text.toLowerCase()]: () => {
            this.context.repository.delete(this.context.builder.id)
            this.context.builder = new AppointmentBuilder()
            this.finish()
            this.finish()
        },
        [AllDataStep.changeBasicData.text.toLowerCase()]: () => this.push(new BasicDataStep(this.context)),
        [AllDataStep.changeParticipants.text.toLowerCase()]: () => this.push(new ParticipantsStep(this.context)),
        [AllDataStep.changeRoom.text.toLowerCase()]: () => this.push(new RoomConfirmStep(this.context)),
        [AllDataStep.changeCatering.text.toLowerCase()]: () => this.context.stack.pushAll(new DrinkCateringStep(this.context), new FoodCateringStep(this.context)),
    }

    public start(): void {
        const {title, start, end, participants, room, food, drinks} = this.context.builder
        const buttons: BotChatMessageButton[] = [AllDataStep.createAppointment, AllDataStep.changeRoom, AllDataStep.changeCatering]
        if (this.context.config.entryPoint === EntryPointConfig.CHATBOT) {
            buttons.push(AllDataStep.cancelAppointment, AllDataStep.changeBasicData, AllDataStep.changeParticipants)
        }
        const formattedMessage: JSX.Element = (
            <span>
                Folgende Daten habe ich erkannt:<br/>
                <b>Basisdaten:</b>
                <ul>
                    <li><b>Titel:</b> {title}</li>
                    <li><b>Beginn:</b> {this.formatDateTime(start!)}</li>
                    <li><b>Ende:</b> {this.formatDateTime(end!)}</li>
                </ul>
                {this.context.config.entryPoint === EntryPointConfig.CHATBOT && (
                    <span><b>Teilnehmer: </b>{participants.join(", ")}<br/></span>
                )}
                <b>Raum: </b>{room.name} für maximal {room.maxPeople} Personen {room.equipment.size === 0 ? "ohne Equipment" : "mit " + Array.from(room.equipment).join(", ")}<br/>
                <b>Catering:</b>
                <ul>
                    <li><b>Essen:</b> {food.length === 0 ? "(Keine)" : food.join(", ")}</li>
                    <li><b>Getränke:</b> {drinks.length === 0 ? "(Keine)" : drinks.join(", ")}</li>
                </ul>
                Sind diese Daten korrekt?
            </span>
        )
        this.emitMessage(formattedMessage, buttons)
    }

    public getMessageHandler(messageText: string): MessageHandler | undefined {
        return this.messageHandlers[messageText];
    }
}

class FoodCateringStep extends JsxBaseStep {
    public start(): void {
        this.emitTextMessage(
            "Welches Essen möchtest du hinzufügen?",
            [],
            ["Brezeln", "Butterbrezeln", "Pizzen"].map((foodName: string) => new BotChatMessageCheckBox(foodName))
        )
    }

    public handleMessage(message: UserChatMessage): boolean {
        this.context.builder.food = message.text.split(",")
            .map((foodName: string) => foodName.trim())
            .filter(Utils.isNotEmpty)
        this.finish()
        return true
    }
}

class DrinkCateringStep extends JsxBaseStep {
    public start(): void {
        this.emitTextMessage(
            "Welche Getränke möchtest du hinzufügen?",
            [],
            ["Wasser", "Cola", "Apfelsaft", "Orangensaft"].map((drinkName: string) => new BotChatMessageCheckBox(drinkName))
        )
    }

    public handleMessage(message: UserChatMessage): boolean {
        this.context.builder.drinks = message.text.split(",")
            .map((drinkName: string) => drinkName.trim())
            .filter(Utils.isNotEmpty)
        this.finish()
        return true
    }
}

class AppointmentCreatedStep extends JsxMessageHandlerStep {
    private static goToRoot = new BotChatMessageButton("Zurück zum Hauptmenü")

    private messageHandlers: { [messageText: string]: MessageHandler } = {
        [AppointmentCreatedStep.goToRoot.text.toLowerCase()]: this.returnToRoot
    }

    public start(): void {
        this.emitMessage(
            (<span>{this.context.builder.stored ? "Termin aktualisiert!" : "Termin erstellt!"}</span>),
            [AppointmentCreatedStep.goToRoot]
        )
        console.log("Created appointment:", this.context.builder)
        this.context.repository.save(this.context.builder)
        this.context.builder = new AppointmentBuilder()
    }

    public getMessageHandler(messageText: string): MessageHandler | undefined {
        return this.messageHandlers[messageText];
    }
}

export class ReturnToMainStep extends JsxMessageHandlerStep {
    private static yes = new BotChatMessageButton("Ja")
    private static no = new BotChatMessageButton("Nein")

    private messageHandlers: { [messageText: string]: MessageHandler } = {
        [ReturnToMainStep.yes.text.toLowerCase()]: this.returnToRoot,
        [ReturnToMainStep.no.text.toLowerCase()]: () => this.finish(),
    }

    public start(): void {
        this.emitTextMessage(
            "Zurück zum Hauptmenü? Dadurch gehen die aktuell eingegebenen Daten verloren.",
            [ReturnToMainStep.yes, ReturnToMainStep.no]
        )
    }

    public getMessageHandler(messageText: string): MessageHandler | undefined {
        return this.messageHandlers[messageText];
    }
}
