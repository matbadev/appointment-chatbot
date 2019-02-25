import {AppointmentBuilder} from "../../../data/AppointmentBuilder";
import {ChronoUnit, LocalDateTime} from "js-joda";
import {AdaptiveBaseStep} from "./AdaptiveBaseStep";
import {ActionTitleHandler, AdaptiveActionHandlerStep} from "./AdaptiveActionHandlerStep";
import {UserChatMessage} from "../../UserChatMessage";
import {AppointmentEquipment, AppointmentRepository, AppointmentRoom} from "../../../data/AppointmentRepository";
import {EntryPointConfig} from "../../../Config";
import {Utils} from "../../../util/Utils";
import {AdaptiveCard} from "adaptivecards";

export class RootStep extends AdaptiveActionHandlerStep {
    private static newAppointment = "Neuen Termin anlegen"
    private static manageAppointments = "Termine verwalten"

    private startCreateNewAppointmentFlow = () => {
        this.context.stack.pushAll(
            new AppointmentCreatedStep(this.context),
            new AllDataStep(this.context),
            new ParticipantsStep(this.context),
            new RoomConfirmStep(this.context),
            new BasicDataStep(this.context),
            new DateTimeStep(this.context),
            new TitleDescriptionStep(this.context),
        )
    }

    private startManageAppointmentFlow = () => {
        this.context.stack.pushAll(
            new AppointmentCreatedStep(this.context),
            new AllDataStep(this.context),
            new ManageAppointmentsStep(this.context),
        )
    }

    private actionHandlers: { [text: string]: ActionTitleHandler } = {
        [RootStep.newAppointment.toLowerCase()]: this.startCreateNewAppointmentFlow,
        [RootStep.manageAppointments.toLowerCase()]: this.startManageAppointmentFlow,
    }

    public start(): void {
        this.context.builder = new AppointmentBuilder()
        this.emitCardJson({
                "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                "version": "1.0",
                "type": "AdaptiveCard",
                "body": [
                    {
                        "type": "TextBlock",
                        "wrap": true,
                        "color": "Accent",
                        "text": "Willkommen beim Chatbot!"
                    },
                    {
                        "type": "TextBlock",
                        "wrap": true,
                        "text": "Du kannst jederzeit \"/hauptmenü\" eingeben, um hierhin zurückzukehren."
                    },
                    {
                        "type": "TextBlock",
                        "wrap": true,
                        "text": "Was möchtest du tun?"
                    }
                ],
            }, this.context.config.entryPoint === EntryPointConfig.CHATBOT ? RootStep.newAppointment : undefined, RootStep.manageAppointments
        )
    }

    public getActionTitleHandler(titleLower: string): ActionTitleHandler | undefined {
        return this.actionHandlers[titleLower]
    }
}

export class FromOutlookStep extends AdaptiveActionHandlerStep {
    private static startOutlookFlow = "Ja"
    private static backToRoot = "Nein, zum Hauptmenü"

    private startOutlookFlow = () => {
        this.context.stack.pushAll(
            new AppointmentCreatedStep(this.context),
            new AllDataStep(this.context),
            new RoomConfirmStep(this.context),
        )
    }

    private actionHandlers: { [text: string]: ActionTitleHandler } = {
        [FromOutlookStep.startOutlookFlow.toLowerCase()]: this.startOutlookFlow,
        [FromOutlookStep.backToRoot.toLowerCase()]: this.returnToRoot,
    }

    public start(): void {
        this.context.builder = AppointmentRepository.buildDummyOutlookAppointment()
        const {title, start, end} = this.context.builder
        this.emitCardJson({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.0",
            "type": "AdaptiveCard",
            "body": [
                {
                    "type": "TextBlock",
                    "color": "Accent",
                    "text": "Outlook Termin"
                },
                {
                    "type": "TextBlock",
                    "wrap": true,
                    "text": "Hallo! Du hast gerade folgenden Termin in Outlook erstellt:"
                },
                {
                    "type": "FactSet",
                    "facts": [
                        {
                            "title": "Titel:",
                            "value": title
                        },
                        {
                            "title": "Beginn:",
                            "value": this.formatDateTime(start!)
                        },
                        {
                            "title": "Ende:",
                            "value": this.formatDateTime(end!)
                        }
                    ]
                },
                {
                    "type": "TextBlock",
                    "wrap": true,
                    "text": "Soll ich dir bei der weiteren Planung helfen?"
                }
            ],
        }, FromOutlookStep.startOutlookFlow, FromOutlookStep.backToRoot)
    }

    public getActionTitleHandler(titleLower: string): ActionTitleHandler | undefined {
        return this.actionHandlers[titleLower]
    }
}

class ManageAppointmentsStep extends AdaptiveBaseStep {
    public start(): void {
        const builders: AppointmentBuilder[] = this.context.repository.getAll()
        this.emitCardJson({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.0",
            "type": "AdaptiveCard",
            "body": [
                {
                    "type": "TextBlock",
                    "color": "Accent",
                    "text": "Termin bearbeiten"
                },
                {
                    "type": "TextBlock",
                    "wrap": true,
                    "text": "Welchen Termin möchtest du bearbeiten?"
                },
                {
                    "type": "Input.ChoiceSet",
                    "id": "appointment",
                    "value": builders[0].id,
                    "choices": builders.map((appointment: AppointmentBuilder) => ({
                        "title": appointment.title,
                        "value": appointment.id
                    }))
                }
            ]
        }, "Auswählen")
    }

    public handleMessage(message: UserChatMessage): boolean {
        const appointmentId: number | undefined = this.readPositiveInt(message, "appointment")
        if (appointmentId != null) {
            const builder: AppointmentBuilder | undefined = this.context.repository.getById(appointmentId)
            if (builder != null) {
                this.context.builder = builder
                this.finish()
                return true
            }
        }
        return false
    }
}

class TitleDescriptionStep extends AdaptiveBaseStep {
    public start(): void {
        this.emitCardJson({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.0",
            "type": "AdaptiveCard",
            "body": [
                {
                    "type": "TextBlock",
                    "color": "Accent",
                    "text": "Titel und Beschreibung"
                },
                {
                    "type": "TextBlock",
                    "separator": true,
                    "text": "Gib einen Titel und eine Beschreibung für die Besprechung ein.",
                    "wrap": true
                },
                {
                    "type": "TextBlock",
                    "weight": "Lighter",
                    "text": "Titel"
                },
                {
                    "id": "title",
                    "type": "Input.Text",
                    "title": "New Input.Toggle",
                    "value": this.context.builder.title,
                },
                {
                    "type": "TextBlock",
                    "weight": "Lighter",
                    "text": "Beschreibung",
                },
                {
                    "id": "description",
                    "type": "Input.Text",
                    "title": "New Input.Toggle",
                    "value": this.context.builder.description,
                    "isMultiline": true
                }
            ],
        }, "Weiter")
    }

    public handleMessage(message: UserChatMessage): boolean {
        const title: string | undefined = AdaptiveBaseStep.readString(message, "title")
        const description: string | undefined = AdaptiveBaseStep.readString(message, "description")
        if (title != null && description != null) {
            this.context.builder.title = title
            this.context.builder.description = description
            this.finish()
            return true
        }
        return false
    }
}

class DateTimeStep extends AdaptiveBaseStep {
    public start(): void {
        const initialStart: LocalDateTime = this.context.builder.start || LocalDateTime.now()
        const initialEnd: LocalDateTime = this.context.builder.end || this.context.builder.start || LocalDateTime.now()
        this.emitCardJson({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.0",
            "type": "AdaptiveCard",
            "body": [
                {
                    "type": "TextBlock",
                    "color": "Accent",
                    "text": "Zeitraum"
                },
                {
                    "type": "TextBlock",
                    "separator": true,
                    "text": "Gib an, wann die Besprechung beginnen und enden soll.",
                    "wrap": true
                },
                {
                    "type": "TextBlock",
                    "horizontalAlignment": "Left",
                    "height": "stretch",
                    "weight": "Lighter",
                    "text": "Beginn",
                    "wrap": true
                },
                {
                    "type": "ColumnSet",
                    "columns": [
                        {
                            "type": "Column",
                            "items": [
                                {
                                    "type": "Input.Date",
                                    "id": "startDate",
                                    "value": initialStart.toLocalDate().toString(),
                                }
                            ],
                            "width": "stretch"
                        },
                        {
                            "type": "Column",
                            "items": [
                                {
                                    "type": "Input.Time",
                                    "id": "startTime",
                                    "value": initialStart.toLocalTime().truncatedTo(ChronoUnit.MINUTES).toString(),
                                }
                            ],
                            "width": "stretch"
                        }
                    ]
                },
                {
                    "type": "TextBlock",
                    "weight": "Lighter",
                    "text": "Ende"
                },
                {
                    "type": "ColumnSet",
                    "columns": [
                        {
                            "type": "Column",
                            "items": [
                                {
                                    "type": "Input.Date",
                                    "id": "endDate",
                                    "value": initialEnd.toLocalDate().toString(),
                                }
                            ],
                            "width": "stretch"
                        },
                        {
                            "type": "Column",
                            "items": [
                                {
                                    "type": "Input.Time",
                                    "id": "endTime",
                                    "value": initialEnd.toLocalTime().truncatedTo(ChronoUnit.MINUTES).toString(),
                                }
                            ],
                            "width": "stretch"
                        }
                    ]
                }
            ],
        }, "Weiter")
    }

    public handleMessage(message: UserChatMessage): boolean {
        const start: LocalDateTime | undefined = this.readDateTime(message, "startDate", "startTime")
        const end: LocalDateTime | undefined = this.readDateTime(message, "endDate", "endTime")
        if (start != null && end != null) {
            this.context.builder.start = start
            this.context.builder.end = end
            this.finish()
            return true
        }
        return false
    }
}

class BasicDataStep extends AdaptiveActionHandlerStep {
    private static dataCorrect = "Daten korrekt"
    private static changeTitle = "Titel"
    private static changeDateTime = "Zeitpunkt"

    private actionHandlers: { [text: string]: ActionTitleHandler } = {
        [BasicDataStep.dataCorrect.toLowerCase()]: () => this.finish(),
        [BasicDataStep.changeTitle.toLowerCase()]: () => this.push(new TitleDescriptionStep(this.context)),
        [BasicDataStep.changeDateTime.toLowerCase()]: () => this.push(new DateTimeStep(this.context)),
    }

    public start(): void {
        const {title, description, start, end} = this.context.builder
        this.emitCardJson({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.0",
            "type": "AdaptiveCard",
            "body": [
                {
                    "type": "TextBlock",
                    "color": "Accent",
                    "text": "Datenkontrolle"
                },
                {
                    "type": "TextBlock",
                    "wrap": true,
                    "text": "Folgende Daten habe ich erkannt:"
                },
                {
                    "type": "FactSet",
                    "facts": [
                        {
                            "title": "Titel:",
                            "value": title
                        },
                        {
                            "title": "Beschreibung:",
                            "value": description
                        },
                        {
                            "title": "Beginn:",
                            "value": this.formatDateTime(start!)
                        },
                        {
                            "title": "Ende:",
                            "value": this.formatDateTime(end!)
                        }
                    ]
                },
                {
                    "type": "TextBlock",
                    "wrap": true,
                    "text": "Sind diese Daten korrekt?"
                }
            ],
            "actions": [
                {
                    "type": "Action.ShowCard",
                    "title": "Daten ändern",
                    "card": {
                        "type": "AdaptiveCard",
                        "body": [
                            {
                                "type": "TextBlock",
                                "wrap": true,
                                "text": "Zu ändernde Daten wählen:"
                            }
                        ],
                        "actions": [
                            {
                                "type": "Action.Submit",
                                "title": BasicDataStep.changeTitle
                            },
                            {
                                "type": "Action.Submit",
                                "title": BasicDataStep.changeDateTime
                            },
                        ]
                    }
                }
            ]
        }, BasicDataStep.dataCorrect)
    }

    public getActionTitleHandler(titleLower: string): ActionTitleHandler | undefined {
        return this.actionHandlers[titleLower]
    }
}

class RoomConfirmStep extends AdaptiveActionHandlerStep {
    private static roomOk = "Raum in Ordnung"
    private static changeRoom = "Raum/Equipment ändern"

    private actionHandlers: { [text: string]: ActionTitleHandler } = {
        [RoomConfirmStep.roomOk.toLowerCase()]: () => this.finish(),
        [RoomConfirmStep.changeRoom.toLowerCase()]: () => this.push(new RoomSearchStep(this.context)),
    }

    public start(): void {
        const {room} = this.context.builder
        this.emitCardJson({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.0",
            "type": "AdaptiveCard",
            "body": [
                {
                    "type": "TextBlock",
                    "color": "Accent",
                    "text": "Raum - Vorschlag"
                },
                {
                    "type": "TextBlock",
                    "separator": true,
                    "text": "Basierend auf die von dir gegebenen Informationen kann ich dir folgenden Raum für die Besprechung vorschlagen:",
                    "wrap": true
                },
                {
                    "type": "ColumnSet",
                    "horizontalAlignment": "Left",
                    "separator": true,
                    "columns": [
                        {
                            "type": "Column",
                            "items": [
                                {
                                    "type": "Image",
                                    "url": room.imageUrl
                                }
                            ],
                            "width": "stretch"
                        },
                        {
                            "type": "Column",
                            "items": [
                                {
                                    "type": "TextBlock",
                                    "spacing": "None",
                                    "weight": "Bolder",
                                    "text": room.name,
                                    "wrap": true
                                },
                                {
                                    "type": "TextBlock",
                                    "spacing": "None",
                                    "weight": "Lighter",
                                    "text": "Karlsruhe"
                                },
                                {
                                    "type": "TextBlock",
                                    "spacing": "None",
                                    "weight": "Lighter",
                                    "text": `max. ${room.maxPeople} Personen`,
                                    "wrap": true
                                },
                                {
                                    "type": "TextBlock",
                                    "spacing": "None",
                                    "weight": "Lighter",
                                    "text": room.equipment.size === 0 ? "(ohne Equipment)" : Array.from(room.equipment).join(", "),
                                    "wrap": true
                                }
                            ],
                            "width": "stretch"
                        }
                    ]
                }
            ],
        }, RoomConfirmStep.roomOk, RoomConfirmStep.changeRoom)
    }

    public getActionTitleHandler(titleLower: string): ActionTitleHandler | undefined {
        return this.actionHandlers[titleLower]
    }
}

class RoomSearchStep extends AdaptiveBaseStep {
    public start(): void {
        this.emitCardJson({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.0",
            "type": "AdaptiveCard",
            "body": [
                {
                    "type": "TextBlock",
                    "color": "Accent",
                    "text": "Raum - Anpassung"
                },
                {
                    "type": "TextBlock",
                    "wrap": true,
                    "text": "Wie viele Teilnehmer erwartest du?"
                },
                {
                    "type": "Input.Number",
                    "id": "participantsCount",
                    "value": 5,
                    "min": "1",
                    "max": "100"
                },
                {
                    "type": "TextBlock",
                    "wrap": true,
                    "text": "Welches Equipment benötigst du im Raum?"
                },
                {
                    "type": "Input.ChoiceSet",
                    "id": "equipment",
                    "isMultiSelect": true,
                    "value": Array.from(this.context.builder.room.equipment).join(","),
                    "choices": AppointmentEquipment.ALL.map((equipment: string) => ({
                        "title": equipment,
                        "value": equipment
                    }))
                }
            ]
        }, "Auswählen")
    }

    public handleMessage(message: UserChatMessage): boolean {
        const participantsCount: number | undefined = this.readPositiveInt(message, "participantsCount")
        if (participantsCount == null) return false
        const equipment: string | undefined = AdaptiveBaseStep.readString(message, "equipment")
        const equipmentValues: string[] = equipment != null ? equipment.split(",") : []
        this.context.builder.room = AppointmentRoom.getRecommended(participantsCount, equipmentValues)
        this.finish()
        return true
    }
}

class ParticipantsStep extends AdaptiveBaseStep {
    public start(): void {
        this.emitCardJson({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.0",
            "type": "AdaptiveCard",
            "body": [
                {
                    "type": "TextBlock",
                    "color": "Accent",
                    "text": "Teilnehmer"
                },
                {
                    "type": "TextBlock",
                    "wrap": true,
                    "text": "Bitte sende mir die Teilnehmer durch Komma getrennt."
                },
                {
                    "type": "TextBlock",
                    "wrap": true,
                    "size": "small",
                    "text": "Später wird es hierfür Autovervollständigung in der Eingabeleiste geben"
                }
            ]
        })
    }

    public handleMessage(message: UserChatMessage): boolean {
        const participants: string[] = message.text.split(",")
            .map((participant: string) => participant.trim())
            .filter(Utils.isNotEmpty)
        this.context.builder.participants = participants
        this.emitCardJson({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.0",
            "type": "AdaptiveCard",
            "body": [
                {
                    "type": "TextBlock",
                    "wrap": true,
                    "text": `Du hast folgende ${participants.length} Teilnehmer registriert: ${participants.join(", ")}`
                }
            ]
        })
        this.finish()
        return true
    }
}

class AllDataStep extends AdaptiveActionHandlerStep {
    private static createAppointment = "Termin speichern"
    private static cancelAppointment = "Termin stornieren"
    private static changeBasicData = "Basisdaten"
    private static changeParticipants = "Teilnehmer"
    private static changeRoom = "Raum"
    private static changeCatering = "Catering"

    private actionHandlers: { [text: string]: ActionTitleHandler } = {
        [AllDataStep.createAppointment.toLowerCase()]: () => this.finish(),
        [AllDataStep.cancelAppointment.toLowerCase()]: () => this.push(new CancelAppointmentStep(this.context)),
        [AllDataStep.changeBasicData.toLowerCase()]: () => this.push(new BasicDataStep(this.context)),
        [AllDataStep.changeParticipants.toLowerCase()]: () => this.push(new ParticipantsStep(this.context)),
        [AllDataStep.changeRoom.toLowerCase()]: () => this.push(new RoomConfirmStep(this.context)),
        [AllDataStep.changeCatering.toLowerCase()]: () => this.context.stack.pushAll(new DrinkCateringStep(this.context), new FoodCateringStep(this.context)),
    }

    public start(): void {
        const {title, description, start, end, participants, room, food, drinks} = this.context.builder

        const editActions: any[] = [
            {
                "type": "Action.Submit",
                "title": AllDataStep.changeRoom
            },
            {
                "type": "Action.Submit",
                "title": AllDataStep.changeCatering
            }
        ]

        if (this.context.config.entryPoint === EntryPointConfig.CHATBOT) {
            editActions.push({
                "type": "Action.Submit",
                "title": AllDataStep.changeBasicData
            })
            editActions.push({
                "type": "Action.Submit",
                "title": AllDataStep.changeParticipants
            })
        }

        this.emitCardJson({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.0",
            "type": "AdaptiveCard",
            "body": [
                {
                    "type": "TextBlock",
                    "color": "Accent",
                    "text": "Zusammenfassung"
                },
                {
                    "type": "TextBlock",
                    "separator": true,
                    "weight": "Lighter",
                    "text": "Titel"
                },
                {
                    "type": "TextBlock",
                    "text": title
                },
                {
                    "type": "TextBlock",
                    "separator": true,
                    "weight": "Lighter",
                    "text": "Beschreibung"
                },
                {
                    "type": "TextBlock",
                    "text": description
                },
                {
                    "type": "TextBlock",
                    "separator": true,
                    "weight": "Lighter",
                    "text": "Zeitraum",
                    "wrap": true
                },
                {
                    "type": "FactSet",
                    "facts": [
                        {
                            "title": "Beginn:",
                            "value": this.formatDateTime(start!)
                        },
                        {
                            "title": "Ende:",
                            "value": this.formatDateTime(end!)
                        }
                    ]
                },
                {
                    "type": "TextBlock",
                    "separator": true,
                    "weight": "Lighter",
                    "text": `Teilnehmer (${participants.length})`
                },
                {
                    "type": "FactSet",
                    "facts": participants.map((participant: string) => ({
                        "title": "-",
                        "value": participant
                    })),
                },
                {
                    "type": "TextBlock",
                    "separator": true,
                    "weight": "Lighter",
                    "text": "Raum"
                },
                {
                    "type": "ColumnSet",
                    "separator": true,
                    "horizontalAlignment": "Left",
                    "columns": [
                        {
                            "type": "Column",
                            "items": [
                                {
                                    "type": "Image",
                                    "url": room.imageUrl
                                }
                            ],
                            "width": "stretch"
                        },
                        {
                            "type": "Column",
                            "items": [
                                {
                                    "type": "TextBlock",
                                    "spacing": "None",
                                    "weight": "Bolder",
                                    "text": room.name,
                                    "wrap": true
                                },
                                {
                                    "type": "TextBlock",
                                    "spacing": "None",
                                    "weight": "Lighter",
                                    "text": "Karlsruhe"
                                },
                                {
                                    "type": "TextBlock",
                                    "spacing": "None",
                                    "weight": "Lighter",
                                    "text": `max. ${room.maxPeople} Personen`,
                                    "wrap": true
                                },
                                {
                                    "type": "TextBlock",
                                    "spacing": "None",
                                    "weight": "Lighter",
                                    "text": room.equipment.size === 0 ? "ohne Equipment" : "mit " + Array.from(room.equipment).join(", "),
                                    "wrap": true
                                }
                            ],
                            "width": "stretch"
                        }
                    ]
                },
                {
                    "type": "TextBlock",
                    "separator": true,
                    "weight": "Lighter",
                    "text": "Catering",
                    "wrap": true
                },
                {
                    "type": "FactSet",
                    "facts": [
                        {
                            "title": "Essen:",
                            "value": food.length === 0 ? "(keins)" : food.join(", ")
                        },
                        {
                            "title": "Getränke:",
                            "value": drinks.length === 0 ? "(keine)" : drinks.join(", ")
                        }
                    ]
                },
                {
                    "type": "TextBlock",
                    "wrap": true,
                    "spacing": "Medium",
                    "text": "Sind diese Daten korrekt?"
                }
            ],
            "actions": [
                {
                    "type": "Action.ShowCard",
                    "title": "Daten ändern",
                    "card": {
                        "type": "AdaptiveCard",
                        "body": [
                            {
                                "type": "TextBlock",
                                "wrap": true,
                                "text": "Zu ändernde Daten wählen:"
                            }
                        ],
                        "actions": editActions
                    }
                }
            ]
        }, AllDataStep.createAppointment, this.context.config.entryPoint === EntryPointConfig.CHATBOT ? AllDataStep.cancelAppointment : undefined)
    }

    public getActionTitleHandler(titleLower: string): ActionTitleHandler | undefined {
        return this.actionHandlers[titleLower]
    }
}

class CancelAppointmentStep extends AdaptiveActionHandlerStep {
    private static cancelAppointment = "Besprechung stornieren"
    private static cancel = "Abbrechen"

    private actionHandlers: { [text: string]: ActionTitleHandler } = {
        [CancelAppointmentStep.cancelAppointment.toLowerCase()]: () => {
            this.context.repository.delete(this.context.builder.id)
            this.returnToRoot()
        },
        [CancelAppointmentStep.cancel.toLowerCase()]: () => this.finish(),
    }

    public start(): void {
        const {title, start, end, participants, room} = this.context.builder
        this.emitCardJson({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.0",
            "type": "AdaptiveCard",
            "body": [
                {
                    "type": "TextBlock",
                    "color": "Accent",
                    "text": "Stornierung"
                },
                {
                    "type": "TextBlock",
                    "separator": true,
                    "text": `Soll die Besprechung "${title}" wirklich storniert werden?`,
                    "wrap": true
                },
                {
                    "type": "ColumnSet",
                    "spacing": "Small",
                    "columns": [
                        {
                            "type": "Column",
                            "items": [
                                {
                                    "type": "TextBlock",
                                    "spacing": "None",
                                    "text": `- Von ${this.formatDateTime(start!)} bis ${this.formatDateTime(end!)}`,
                                    "wrap": true,
                                },
                                {
                                    "type": "TextBlock",
                                    "spacing": "None",
                                    "text": `- ${participants.length} Teilnehmer (${participants.length} Zusagen, 0 Absagen)`,
                                    "wrap": true,
                                },
                                {
                                    "type": "TextBlock",
                                    "spacing": "None",
                                    "text": `- Raum ${room.name} (max. ${room.maxPeople} Personen, ${room.equipment.size === 0 ? "ohne Equipment" : "mit " + Array.from(room.equipment).join(", ")})`,
                                    "wrap": true,
                                },
                            ],
                            "width": "stretch"
                        }
                    ]
                },
                {
                    "type": "TextBlock",
                    "separator": true,
                    "color": "Attention",
                    "text": "Wird diese Besprechung storniert, dann wird der Termin in Outlook abgesagt, die Teilnehmer werden benachrichtigt und die Raumbuchung wird storniert!",
                    "wrap": true
                }
            ],
        }, CancelAppointmentStep.cancelAppointment, CancelAppointmentStep.cancel)
    }

    public getActionTitleHandler(titleLower: string): ActionTitleHandler | undefined {
        return this.actionHandlers[titleLower]
    }
}

class FoodCateringStep extends AdaptiveBaseStep {
    public start(): void {
        this.emitCardJson({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.0",
            "type": "AdaptiveCard",
            "body": [
                {
                    "type": "TextBlock",
                    "color": "Accent",
                    "text": "Catering - Essen"
                },
                {
                    "type": "TextBlock",
                    "wrap": true,
                    "text": "Welches Essen möchtest du hinzufügen?"
                },
                {
                    "type": "Input.ChoiceSet",
                    "id": "food",
                    "isMultiSelect": true,
                    "value": this.context.builder.food.join(","),
                    "choices": [
                        {
                            "title": "Brezeln",
                            "value": "Brezeln"
                        },
                        {
                            "title": "Butterbrezeln",
                            "value": "Butterbrezeln"
                        },
                        {
                            "title": "Pizzen",
                            "value": "Pizzen"
                        }
                    ]
                }
            ]
        }, "Auswählen")
    }

    public handleMessage(message: UserChatMessage): boolean {
        const foodValues: string | undefined = AdaptiveBaseStep.readString(message, "food")
        this.context.builder.food = foodValues != null ? foodValues.split(",") : []
        this.finish()
        return true
    }
}

class DrinkCateringStep extends AdaptiveBaseStep {
    public start(): void {
        this.emitCardJson({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.0",
            "type": "AdaptiveCard",
            "body": [
                {
                    "type": "TextBlock",
                    "color": "Accent",
                    "text": "Catering - Getränke"
                },
                {
                    "type": "TextBlock",
                    "wrap": true,
                    "text": "Welche Getränke möchtest du hinzufügen?"
                },
                {
                    "type": "Input.ChoiceSet",
                    "id": "drinks",
                    "isMultiSelect": true,
                    "value": this.context.builder.drinks.join(","),
                    "choices": [
                        {
                            "title": "Wasser",
                            "value": "Wasser"
                        },
                        {
                            "title": "Cola",
                            "value": "Cola"
                        },
                        {
                            "title": "Apfelsaft",
                            "value": "Apfelsaft"
                        },
                        {
                            "title": "Orangensaft",
                            "value": "Orangensaft"
                        }
                    ]
                }
            ]
        }, "Auswählen")
    }

    public handleMessage(message: UserChatMessage): boolean {
        const drinkValues: string | undefined = AdaptiveBaseStep.readString(message, "drinks")
        this.context.builder.drinks = drinkValues != null ? drinkValues.split(",") : []
        this.finish()
        return true
    }
}

class AppointmentCreatedStep extends AdaptiveActionHandlerStep {
    private static goToRoot = "Zurück zum Hauptmenü"

    private actionHandlers: { [text: string]: ActionTitleHandler } = {
        [AppointmentCreatedStep.goToRoot.toLowerCase()]: this.returnToRoot
    }

    public start(): void {
        this.emitCardJson({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.0",
            "type": "AdaptiveCard",
            "body": [
                {
                    "type": "TextBlock",
                    "color": "Accent",
                    "text": "Bestätigung"
                },
                {
                    "type": "TextBlock",
                    "separator": true,
                    "text": `Deine Besprechung "${this.context.builder.title}" wurde erfolgreich ${this.context.builder.stored ? "aktualisiert" : "erstellt"}!`,
                    "wrap": true
                },
                {
                    "type": "TextBlock",
                    "color": "Good",
                    "text": "- Der Termin wurde in Outlook eingetragen"
                },
                {
                    "type": "TextBlock",
                    "color": "Good",
                    "text": "- Die Teilnehmer wurden per E-Mail benachrichtigt"
                },
                {
                    "type": "TextBlock",
                    "color": "Good",
                    "text": "- Der Raum wurde gebucht"
                }
            ],
        }, AppointmentCreatedStep.goToRoot)
        console.log("Created appointment:", this.context.builder)
        this.context.repository.save(this.context.builder)
        this.context.builder = new AppointmentBuilder()
    }

    public getActionTitleHandler(titleLower: string): ActionTitleHandler | undefined {
        return this.actionHandlers[titleLower]
    }
}

export class ReturnToMainStep extends AdaptiveActionHandlerStep {
    private static yes = "Ja"
    private static no = "Nein"

    private actionHandlers: { [text: string]: ActionTitleHandler } = {
        [ReturnToMainStep.yes.toLowerCase()]: this.returnToRoot,
        [ReturnToMainStep.no.toLowerCase()]: () => this.finish(),
    }

    public start(): void {
        this.emitCardJson({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.0",
            "type": "AdaptiveCard",
            "body": [
                {
                    "type": "TextBlock",
                    "wrap": true,
                    "text": "Zurück zum Hauptmenü? Dadurch gehen die aktuell eingegebenen Daten verloren."
                }
            ]
        }, ReturnToMainStep.yes, ReturnToMainStep.no)
    }

    public getActionTitleHandler(titleLower: string): ActionTitleHandler | undefined {
        return this.actionHandlers[titleLower]
    }
}
