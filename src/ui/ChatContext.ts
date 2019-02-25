import {Stack} from "../util/Stack";
import {AppointmentRepository} from "../data/AppointmentRepository";
import {AppointmentBuilder} from "../data/AppointmentBuilder";
import {BaseStep} from "./BaseStep";
import {Config} from "../Config";
import {Consumer} from "../util/Consumer";

export class ChatContext<M> {
    public constructor(
        public readonly config: Config,
        public readonly emitter: Consumer<M>,
        public readonly stack: Stack<BaseStep<M>>,
        public readonly repository: AppointmentRepository,
        public builder: AppointmentBuilder) {
    }
}
