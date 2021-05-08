import { generateId } from "$utils/id";
import { Store } from "chstore";
import Line from "./Line";

export default class Page extends Store<{ id: string, content: string }[]> {
    id = generateId();
    constructor(lines: string[] = [], id = undefined) {
        super(Array.from(lines).map(line => {
            if (typeof line === "string") {
                return new Line(line);
            }
            return line;
        }));
        if (id) this.id = id;
    }
}