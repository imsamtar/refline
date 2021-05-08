import type monaco from "monaco-editor";

declare global {
    interface EditorConfig {
        width: number;
        opened: Boolean;
        language: "" | "graphql" | "markdown" | "html" | "css" | "javascript" | "typescript";
        theme: "vs-dark" | "vs-light";
    }
    interface Block {
        _id: string;
        type: "page" | "line";
    }

    interface Page extends Block {
        lines: string[];
    }

    interface Line extends Block {
        page: string;
        content: string;
        tokens: string[];
        ref: [string, string][];
    }

    type Optional<T> = {
        [p in keyof T]?: T[p]
    };

    type Types = Page | Line;
    type ListenerFunction = (blocks: (Types)[]) => void;
    type Listener<T> = {
        filter: Optional<T>;
        listener: ListenerFunction;
    }
    interface Token {
        lineId: string;
        word: string;
    }
}