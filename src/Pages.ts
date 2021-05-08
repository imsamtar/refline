import fastDiff from "fast-diff";
import { generateId } from "$utils/id";
import { ListStore, Store } from "chstore";
import * as monaco from "monaco-editor";

export const beforeRegex = /^(\<!--|[#]|\/\/)\s+/g;
export const pageNameRegexp = /^(\<!--|[#]|\/\/)\s+[\w.]+:?/g;

export class Blocks {
    _id = generateId();
    private listeners = new Set<Listener<Types>>();
    constructor(id: string = undefined) {
        this._id = id || this._id;
    }
    private notify(listeners = Array.from(this.listeners)) {
        for (const { filter, listener } of listeners) {
            const filterEntries = Object.entries(filter)
                .filter(entry => typeof entry[1] !== "undefined");
            const blocks = this.blocks.filter(block =>
                filterEntries.reduce((res, [key, value]) => res && block[key] === value, true)
            );
            listener(blocks);
        }
    }
    subscribe(listener: ListenerFunction, filter: Optional<Types> = {}) {
        const symbol: Listener<Types> = {
            filter,
            listener
        };
        this.listeners.add(symbol);
        this.notify([symbol]);
        return () => this.listeners.delete(symbol);
    }
    get jsonLines(): string {
        const jsonLines = localStorage.getItem(`blocks-${this._id}`);
        if (jsonLines === null) localStorage.setItem(`blocks-${this._id}`, '');
        return jsonLines || '';
    }
    set jsonLines(jsonLines: string) {
        localStorage.setItem(`blocks-${this._id}`, jsonLines);
        this.notify();
    }
    static jsonLinesToTextBlocks(string: string) {
        return string.trim().split('\n').filter(Boolean);
    }
    get blocks(): (Types)[] {
        const jsonLinesTextBlocks = Blocks.jsonLinesToTextBlocks(this.jsonLines);
        const jsonLinesBlocks = jsonLinesTextBlocks.map(textBlock => JSON.parse(textBlock));
        return jsonLinesBlocks;
    }
    set blocks(blocks) {
        if (blocks instanceof Array) {
            let textBlocks = '';
            for (const block of blocks) {
                textBlocks += JSON.stringify(block) + '\n';
            }
            this.jsonLines = textBlocks;
        }
    }
    getBlock(id: string): Types {
        return this.blocks.find(block => block._id === id);
    }
    insertBlock(block: Types) {
        if (!block._id) block._id = generateId();
        this.jsonLines = (this.jsonLines.trim() ? this.jsonLines + '\n' : '') + JSON.stringify(block);
        return block;
    }
    patchBlock(id: string, patch: Optional<Types>) {
        const block = this.getBlock(id);
        if (block) {
            Object.assign(block, patch);
            if (block.type === "line") {
                block['tokens'] = handleTokens(<Line>block);
            }
            this.blocks = this.blocks.map(_block => {
                if (_block._id === id) {
                    return block
                } else {
                    return _block
                }
            });
            return true;
        }
    }
    removeBlock(id: string) {
        const { length } = this.blocks;
        this.blocks = this.blocks.filter(block => block._id !== id);
        return length > this.blocks.length;
    }
    static jsonLinesToBlocks(string: string) {
        return Blocks
            .jsonLinesToTextBlocks(string)
            .map(textBlock => JSON.parse(textBlock));
    }
}

export class Pages extends Blocks {
    constructor(id: string = undefined) {
        super(id);
    }
    get pages() {
        return <Page[]>this.blocks.filter(block => block.type === "page");
    }
    getPage(id: string) {
        return <Page | undefined>this.blocks.find(block => block._id === id && block.type === "page")
    }
    getLine(id: string) {
        return <Line>this.getBlock(id);
    }
    static getPageName(string: string) {
        string = string || "";
        string = string.split('\n')[0];
        return string.trim().replace(beforeRegex, '').split(' ')[0];
    }
    getPageByName(name: string) {
        return this.pages.find(page => {
            const line = this.getLine(page.lines[0]);
            if (line) return Pages.getPageName(line.content) === name;
        });
    }
    insertPage(str: string) {
        const lines = str.split('\n');
        const pageName = Pages.getPageName((lines[0].trim().match(pageNameRegexp) || [""])[0]);
        if (!pageName) return;
        let page = this.getPageByName(pageName);
        if (!page) {
            page = {
                _id: generateId(),
                type: "page",
                lines: [],
            };
            page.lines = lines.map(line => this.insertLine(page._id, { page: page._id, content: line })._id);
            console.log("insert:", page.lines.length);
            return this.insertBlock(page);
        }
    }
    patchPage(str: string) {
        const lines = str.split('\n');
        const pageName = Pages.getPageName((lines[0].trim().match(pageNameRegexp) || [""])[0]);
        if (!pageName) return;
        let page: Page = this.getPageByName(pageName);
        if (page) {
            let changes: any[] = fastDiff(page.lines.join('\n'), str);
            changes = changes.reduce((list, value) => [...list, ...value], []);
            changes = changes.map(value => typeof value === "string" ? value.split('\n') : value);
            let newLines: any[] = [""]
            let flag = 0;
            for (const value of changes) {
                if (typeof value === "number") {
                    flag = value;
                } else if (value instanceof Array && flag >= 0) {
                    if (value.length < 2) {
                        newLines[newLines.length - 1] += value.join('');
                    } else {
                        newLines[newLines.length - 1] += value[0];
                        for (const _line of value.slice(1)) {
                            newLines.push(flag === 0 ? _line : [_line]);
                        }
                    }
                }
            }
            let lineIds = [...page.lines];
            let lastDone = 0;
            newLines.forEach((newLine, index) => {
                if (typeof newLine === "string") {
                    const lineId = lineIds[index];
                    this.patchBlock(lineId, { content: newLine });
                } else if (newLine instanceof Array) {
                    const lineId = this.insertLine(page._id, { content: newLine[0] })._id;
                    lineIds = [...lineIds.slice(0, index), lineId, ...lineIds.slice(index)];
                }
                lastDone = index;
            });
            const newLineIds = lineIds.slice(0, lastDone + 1);
            this.patchBlock(page._id, { lines: newLineIds });
            lineIds.slice(lastDone + 1).forEach(id => this.removeBlock(id));
            return page;
        }
    }
    getPageBlocks(id: string) {
        const page = <Page | undefined>this.blocks.find(block => block._id === id && block.type === "page")
        if (page) {
            return page.lines.map(lineId =>
                this.blocks.filter(block => block.type === "line" && block._id === lineId)
            );
        }
        return [];
    }
    insertLine(pageId: string, linePatch: Optional<Line> = {}, atIndex = -1) {
        const newLine: Line = {
            _id: generateId(),
            type: "line",
            page: pageId,
            content: "",
            tokens: [],
            ref: [],
        };
        Object.assign(newLine, linePatch);
        newLine['tokens'] = handleTokens(newLine);
        const page = this.getPage(pageId);
        this.insertBlock(newLine);
        if (page) {
            if (atIndex === -1) atIndex = page.lines.length;
            const lines = page.lines;
            page.lines = [...lines.slice(0, atIndex - 1), newLine._id, ...lines.slice(atIndex - 1)];
            this.patchBlock(pageId, page);
        }
        return newLine;
    }
    insertLineAfter(lineId: string, linePatch: Optional<Line> = {}) {
        const anchorLine = <Line | undefined>this.blocks.find(block =>
            block.type === "line" && block._id === lineId
        );
        if (anchorLine) {
            const page = <Page | undefined>this.blocks.find(block =>
                block.type === "page" && block._id === anchorLine.page
            );
            if (page) {
                const index = page.lines.indexOf(anchorLine._id);
                return this.insertLine(page._id, linePatch, index + 1);
            }
        }
    }
    static from(string: string, id: string = undefined) {
        const pages = new Pages(id);
        Blocks.jsonLinesToBlocks(string).map(block => pages.insertBlock(block));
        return pages;
    }
    pageToString(id: string) {
        const idList = this.getPage(id).lines;
        const lines = <Line[]>idList.map(lineId => newPages.getBlock(lineId)).filter(Boolean);
        return lines.map(line => line.content).join('\n');
    }
}

export const lastActivePageId = localStorage.getItem('active-list');
export const tokens = new ListStore<Token>([]);
export const newPages = new Pages(lastActivePageId);
localStorage.setItem('active-list', newPages._id);


const EXCEPTION = [
    "var", "const", "let", "function", "return", "switch",
    "number", "string", "Object", "Number", "Function",
    "function", "bigint", "try", "catch", "throw", "if",
    "else", "break", "continue", "for", "while", "do"
];

let alltokens = {};
function handleTokens(line: Line) {
    let tokens: string[] = line.content.match(/[$@]?[A-Za-z][\w]+/g) || [];
    tokens = tokens.filter(t => EXCEPTION.indexOf(t) === -1);
    alltokens[line._id] = tokens;
    return tokens;
}

["html", "css", "javascript", "typescript", "markdown", "svelte", "xml"]
    .forEach(language => {
        monaco.languages.registerCompletionItemProvider(language, {
            provideCompletionItems: function (model, position) {
                var word = model.getWordUntilPosition(position);
                var range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn
                };
                let suggestions = [];
                Object.entries(alltokens).map(([id, tokens]: [string, string[]]) => {
                    const lineTokens = tokens.map(token => ({
                        label: token,
                        kind: monaco.languages.CompletionItemKind.Function,
                        documentation: token,
                        insertText: `$ref(${id},${token})`,
                        range: range
                    }));
                    suggestions = [...suggestions, ...lineTokens];
                });
                return {
                    suggestions
                };
            }
        })
    })