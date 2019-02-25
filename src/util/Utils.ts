export class Utils {

    public static isPresent<TValue>(value: TValue | null | undefined): value is TValue {
        return value != null
    }

    public static isNotEmpty(value: string | null | undefined): boolean {
        return value != null && value.length > 0
    }

}
