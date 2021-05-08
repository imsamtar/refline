// import { addBlock } from "$stores/blocks";
import { editorConfig } from "$stores/editor";

export function parse(value: string) {
    value.replace(/^\s*#\s*(\w+)/, (match, ...args) => {
        const pageName = args[0];
        editorConfig.language = pageName;
        return match;
    });
    const lines = value.split('\n');
    lines.forEach(line => {
        console.log(line);
        // addBlock(line, type);
    });
    // const store = map.get(type);
    // console.log(type);
}