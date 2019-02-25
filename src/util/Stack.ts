export class Stack<T> {

    private readonly values: T[] = []

    /** Tests if this stack is empty. */
    public empty(): boolean {
        return this.values.length === 0
    }

    /** Looks at the object at the top of this stack without removing it from the stack. */
    public peek(): T {
        if (this.empty()) throw new Error("Stack is empty")
        return this.values[this.values.length - 1]
    }

    /** Removes the object at the top of this stack and returns that object as the value of this function. */
    public pop(): T {
        if (this.empty()) throw new Error("Stack is empty")
        return this.values.pop() as T
    }

    public popWhile(predicate: (top: T) => boolean): void {
        while (!this.empty() && predicate(this.peek())) {
            this.pop()
        }
    }

    /** Pushes an item onto the top of this stack. */
    public push(item: T): T {
        this.values.push(item)
        return item
    }

    public pushAll(...items: T[]) {
        items.forEach((item: T) => this.values.push(item))
    }

}
