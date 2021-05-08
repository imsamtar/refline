export class SingleFile {
    name = "";
    _text = "";
    versions: { commitId: string, message: string, text: string }[] = [];
    constructor(text = "", { name }: { name: string }) {
        this._text = text;
        this.name = name;
    }
    set text(text) { this._text = text; }
    get text() { return this._text; }
    commit({ message = "" }) {
        this.versions.push({
            commitId: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36),
            message,
            text: this._text
        });
    }
}