import {AppointmentBuilder} from "./AppointmentBuilder";
import {LocalDate, LocalDateTime, LocalTime} from "js-joda";

export class AppointmentRepository {

    public appointments: { [appointmentId: number]: AppointmentBuilder } = AppointmentRepository.buildDummyAppointments()

    public static buildDummyOutlookAppointment(): AppointmentBuilder {
        const tomorrow = LocalDate.now().plusDays(1).atTime(LocalTime.of(13, 0))
        const builder = new AppointmentBuilder()
        builder.stored = true
        builder.title = "Teammeeting Netze BW"
        builder.description = "Besprechung der weiteren Schritte"
        builder.start = tomorrow
        builder.end = tomorrow.plusHours(2)
        return builder
    }

    public getAll(): AppointmentBuilder[] {
        return Object.keys(this.appointments)
        // @ts-ignore
            .map((id: string) => this.appointments[id])
    }

    public getById(id: number): AppointmentBuilder | undefined {
        return this.appointments[id]
    }

    public getByTitle(title: string): AppointmentBuilder | undefined {
        return this.getAll().find((a: AppointmentBuilder) => a.title!.toLowerCase() === title)
    }

    public save(appointment: AppointmentBuilder) {
        appointment.stored = true
        this.appointments[appointment.id] = appointment
    }

    public delete(id: number) {
        delete this.appointments[id]
    }

    private static buildDummyAppointments(): { [appointmentId: number]: AppointmentBuilder } {
        const result: { [appointmentId: number]: AppointmentBuilder } = {}
        for (let index = 0; index < 5; index++) {
            const appointment = AppointmentRepository.buildDummyAppointment(`Termin ${index}`)
            result[appointment.id] = appointment
        }
        return result
    }

    private static buildDummyAppointment(title: string): AppointmentBuilder {
        const builder = new AppointmentBuilder()
        builder.stored = true
        builder.title = title
        builder.description = "Wichtige Besprechung"
        builder.start = LocalDateTime.now()
        builder.end = LocalDateTime.now()
        builder.participants = ["Johannes", "Marius", "Peter"]
        builder.room = AppointmentRoom.E32
        builder.food = ["Brezeln"]
        builder.drinks = ["Wasser", "Apfelsaft"]
        return builder
    }

}

export class AppointmentEquipment {

    public static readonly BEAMER = "Beamer"
    public static readonly LASERPOINTER = "Laserpointer"
    public static readonly TV = "Fernseher"

    public static readonly ALL: string[] = [AppointmentEquipment.BEAMER, AppointmentEquipment.LASERPOINTER, AppointmentEquipment.TV]

}

export class AppointmentRoom {

    private constructor(
        public readonly name: string,
        public readonly maxPeople: number,
        public readonly equipment: Set<string>,
        public readonly imageUrl: string
    ) {
    }

    public static readonly A401 = new AppointmentRoom("A401", 8, new Set(), `${window.location.origin}/rooms/8.jpg`)
    public static readonly B201 = new AppointmentRoom("B201", 10, new Set([AppointmentEquipment.TV]), `${window.location.origin}/rooms/10.jpg`)
    public static readonly E32 = new AppointmentRoom("E32", 16, new Set([AppointmentEquipment.BEAMER, AppointmentEquipment.LASERPOINTER]), `${window.location.origin}/rooms/16.jpg`)
    public static readonly Z550 = new AppointmentRoom("Z550", 50, new Set(AppointmentEquipment.ALL), `${window.location.origin}/rooms/50.jpg`)

    private static readonly ALL: AppointmentRoom[] = [AppointmentRoom.A401, AppointmentRoom.B201, AppointmentRoom.E32, AppointmentRoom.Z550]

    public fulfillsConditions(peopleCount: number, requiredEquipment: string[]) {
        return peopleCount <= this.maxPeople && requiredEquipment.every((e: string) => this.equipment.has(e))
    }

    public static getRecommended(peopleCount: number, requiredEquipment: string[]) {
        return this.ALL.find((room: AppointmentRoom) => room.fulfillsConditions(peopleCount, requiredEquipment)) || this.Z550
    }

}
