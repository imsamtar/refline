<script lang="ts">
  import { editor } from "monaco-editor";
  import * as monaco from "monaco-editor";
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { editorStore, editorConfig, editorResize } from "$stores/editor";

  export let value = "";
  export let codeEditor: editor.IStandaloneCodeEditor = null;
  export let language = undefined;
  export let theme = "vs-dark";

  const dispatch = createEventDispatcher();
  let editorElement: HTMLDivElement;
  let model: editor.ITextModel;

  $: if (model) {
    monaco.editor.setModelLanguage(model, language);
    monaco.editor.setTheme(theme);
  }

  $: if (model) {
    model.onDidChangeContent((event) => {
      value = codeEditor.getValue();
      dispatch("change", { ...event, codeEditor });
    });
  }

  onMount(async () => {
    const response = await fetch("/markdown.md");
    value = await response.text();
    codeEditor = editor.create(editorElement, {
      value,
      language,
      theme,
      automaticLayout: true,
    });
    model = codeEditor.getModel();
    editorStore.set(codeEditor);
    dispatch("change", { codeEditor });
  });

  onDestroy(() => {
    if (codeEditor) codeEditor.dispose();
    editorStore.set(null);
    codeEditor = null;
    model = null;
  });
</script>

<div
  class="editor"
  id="container"
  style="--width: {$editorConfig['opened'] ? $editorConfig['width'] : 0}px;"
  bind:this={editorElement}
/>
<div class="resize" use:editorResize />

<style>
  .editor {
    width: var(--width);
    min-width: var(--width);
    max-width: 90vw;
    height: 100vh;
  }

  .resize {
    background: #2a61c5;
    height: 100vh;
    min-width: 10px;
    max-width: 10px;
    cursor: col-resize;
  }
</style>
