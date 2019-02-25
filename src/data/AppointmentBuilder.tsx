import {LocalDateTime} from "js-joda";
import {AppointmentRoom} from "./AppointmentRepository";

export class AppointmentBuilder {
    readonly id: number = (Date.now() * 1000) + Math.trunc(Math.random() * 1000)
    stored: boolean = false
    title?: string
    description?: string
    start?: LocalDateTime
    end?: LocalDateTime
    participantsCount?: number
    participants: string[] = []
    room: AppointmentRoom = AppointmentRoom.A401
    food: string[] = []
    drinks: string[] = []
}
