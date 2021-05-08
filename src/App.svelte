<script lang="ts">
  import { editorConfig, editorStore } from "$stores/editor";
  import { getActivePage, handleChange, pages, switchLanguage } from "$stores/pages";
  import Screen from "$ui/screens/Screen.svelte";
  import { onMount } from "svelte";
  import CommandPalette from "./components/CommandPalette.svelte";
  import Editor from "./components/Editor.svelte";
  import MarkdownPreview from "./components/MarkdownPreview.svelte";
  import { newPages, pageNameRegexp, Pages } from "./Pages";

  let editorValue = newPages.pages.length ? newPages.pageToString(newPages.pages[0]._id) : "";
  let newPageName = "";

  $: if ($editorStore) {
    const newValue = (editorValue || "").replace(/\$ref\((\w+)\,(\w+)\)/g, (m, id: string, word: string, index) => {
      const lineNo = editorValue.slice(0, index).split("\n").length - 1;
      const pageName = Pages.getPageName(editorValue.split("\n")[0]);
      const page = newPages.getPageByName(pageName);
      if (page) {
        const lineId = page.lines[lineNo];
        const line = newPages.getLine(lineId);
        const refs = [...line.ref, [word, id]];
        newPages.patchBlock(lineId, { ref: <any>refs });
        console.log(newPages.getLine(lineId));
      }
      return word;
    });
    if (newValue !== editorValue) {
      const pos = $editorStore.getPosition();
      $editorStore.setValue(newValue);
      $editorStore.setPosition(pos);
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey && event.altKey && event.key === "n") {
      $editorStore.setValue("# ");
      $editorStore.setPosition({ lineNumber: 1, column: 5 });
    } else if (event.key === "Enter") {
      const lines = editorValue.split("\n");
      if (lines.length === 1 && editorValue.startsWith("# ")) {
        const page = newPages.getPageByName(Pages.getPageName(editorValue));
        if (page) {
          const pageContent = newPages.pageToString(page._id);
          setTimeout(() => {
            $editorStore.setValue(pageContent);
            editorValue = pageContent;
          }, 50);
        }
      }
    } else if (event.ctrlKey && event.key === "Delete") {
      const page = newPages.getPageByName(Pages.getPageName(editorValue));
      if (page) {
        page.lines.forEach((lineId) => newPages.removeBlock(lineId));
        newPages.removeBlock(page._id);
      }
    }
  }

  onMount(trigger);

  let options = newPages.pages
    .map((page) => Pages.getPageName(newPages.getLine(page.lines[0]).content))
    .map((name, index) => ({
      name,
      action: () => name,
      keyboard: "ctrl + " + index,
    }));

  function trigger() {
    let page: Page = <any>newPages.getPageByName(Pages.getPageName(editorValue));
    const lines = editorValue.split("\n");
    if (lines.length > 1 && Pages.getPageName(lines[0])) {
      if (page) {
        newPages.patchPage(editorValue);
      } else {
        page = <Page>newPages.insertPage(editorValue);
      }
    }
  }

  function handleSubmit(event: CustomEvent<{}>) {
    let value = "";
    value = <any>event.detail["value"];
    console.log(value);
    const page = newPages.getPageByName(value);
    if (page) {
      const pageContent = newPages.pageToString(page._id);
      setTimeout(() => {
        $editorStore.setValue(pageContent);
        editorValue = pageContent;
      }, 50);
    } else {
      let line = `# ${value}:`;
      if (value.match(/.(ts|js)$/)) {
        line = `// ${value}`;
      } else if (value.match(/.(svelte|html|xhtml|xml)/)) {
        line = `<!-- ${value} -->`;
      }
      setTimeout(() => {
        $editorStore.setValue(`${line}\n`);
        editorValue = `${line}\n`;
        $editorStore.setPosition({ lineNumber: 2, column: 10 });
        $editorStore.focus();
      }, 50);
    }
  }

  let schedule;
  $: {
    clearTimeout(schedule);
    schedule = setTimeout(trigger, 500);
  }

  $: if (editorValue) {
    switchLanguage(Pages.getPageName(editorValue.split("\n")[0]));
  }
</script>

<svelte:head>
  <title>{Pages.getPageName(editorValue)}</title>
</svelte:head>

<main>
  <CommandPalette placeholder="Create Page" {options} on:submit={handleSubmit} bind:value={newPageName} />
  <div class="editor-wrapper" on:keydown={handleKeyDown} on:keyup={trigger}>
    <!-- <textarea bind:value spellcheck="false" /> -->
    <Editor
      bind:value={editorValue}
      language={$editorConfig["language"]}
      theme={$editorConfig["theme"]}
      on:change={(event) => {
        handleChange(event.detail);
      }}
    />
  </div>
  {#if $editorConfig.language === "markdown"}
    <MarkdownPreview markdown={editorValue.split("\n").slice(1).join("\n")} />
  {:else}
    <Screen />
  {/if}
</main>

<style>
  /* textarea {
    min-width: 600px;
    width: 100%;
    height: 100%;
    background: #222;
    color: white;
    font-family: Verdana, Geneva, Tahoma, sans-serif;
  } */
  main {
    height: 100%;
    max-height: 100vh;
    display: flex;
  }
  .editor-wrapper {
    display: flex;
  }
</style>
