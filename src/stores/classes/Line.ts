import { generateId } from "$utils/id";

export default class Line {
    id = generateId();
    content: string = "";
    constructor(content = "", id = undefined) {
        if (id) this.id = id;
        this.content = content;
    }
}