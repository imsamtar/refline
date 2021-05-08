import { ObjectStore, Store } from "chstore";
import Page from "$stores/classes/Page";
import { editorConfig, editorStore } from "$stores/editor";
import Line from "./classes/Line";
import { Pages } from "../Pages";
import { editorValue } from "./config";

export const pages = new ObjectStore({});
export const activePage = new Store("");

export function handleChange(event: monaco.editor.IModelContentChangedEvent) {
    const editor = editorStore.get();
    const source = editor.getValue();
    const lines = source.split('\n');
    if (source.trim().split('\n').length < 2) return;
    let pageName = '';
    source.replace(/#!(\w+)/, (m, name) => {
        pageName = name;
        switchLanguage(pageName);
        return '';
    });
    if (!pageName) return;
    const page: Page = pages.prop(pageName) || new Page(lines);
    if (!pages.prop(pageName)) {
        pages.prop(pageName, page);
        return;
    }
    if (event.isFlush) return;
    for (const change of event.changes || []) {
        const { startLineNumber, endLineNumber } = change.range;
        const changedLines = change.text.split('\n');
        const endLine = endLineNumber + changedLines.length - 2;
        page.update((page: Line[]) => {
            if (changedLines.length < 2) {
                if (page[endLine])
                    page[endLine].content = lines[endLine];
            } else if (page[startLineNumber - 1]) {
                page[startLineNumber - 1].content += changedLines[0];
                console.log("append:", changedLines[0]);
                for (let i = 1; i < changedLines.length; i++) {
                    const linesBefore = page.slice(0, startLineNumber);
                    const linesAfter = page.slice(endLine);
                    const lineBefore = linesBefore[linesBefore.length - 1];
                    if (lineBefore) {
                        lineBefore.content += changedLines[0];
                    }
                    return [...linesBefore, changedLines.slice(1), ...linesAfter];
                }
            } else {
                return [...page, new Line(lines[endLine])];
            }
            return page;
        });
        console.log(page.get().map(line => line.content).join('\n'));
    }
}

export function switchLanguage(name: string) {
    activePage.set(name);
    editorConfig.set("language", getLanguage(name));
}

export function getLanguage(name = Pages.getPageName(editorValue.get())) {
    if (name.match(/schema|graphql/)) {
        return "graphql";
    } else if (name.match(/(svelte|html)/)) {
        return "html";
    } else if (name.match(/js/)) {
        return "javascript";
    } else if (name.match(/ts/)) {
        return "typescript";
    } else {
        return "markdown";
    }
}

export function getActivePage(): Page {
    return pages.prop(activePage.get());
}