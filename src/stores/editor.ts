import { mapStore, Store } from "chstore";

export const editorStore = new Store<monaco.editor.IStandaloneCodeEditor>(null);

export const editorConfig = mapStore<EditorConfig>(JSON.parse(localStorage.getItem('editor-config')) || {
    width: 1000,
    opened: true,
    language: "",
    theme: "vs-dark"
});

editorConfig.subscribe(cfg => localStorage.setItem('editor-config', JSON.stringify(cfg)));

export function editorResize(node: HTMLElement) {
    let lastWidth = 0;
    node.addEventListener('pointerdown', (event) => {
        lastWidth = event.clientX;
        let moved = false;
        if (!editorConfig.opened) {
            editorConfig.opened = true;
            return;
        }
        window.addEventListener('pointermove', pointerMove, { passive: true })
        window.addEventListener('pointerup', event => {
            window.removeEventListener('pointermove', pointerMove);
            if (!moved) editorConfig.opened = false;
        }, { once: true });
        function pointerMove(event: MouseEvent) {
            moved = true;
            editorConfig.width = Math.max(100, Math.min(1000, event.clientX));
        }
    });
    window.addEventListener('keydown', event => {
        if (event.ctrlKey && event.key === "b") {
            editorConfig.opened = !editorConfig.opened;
        }
    });
}
