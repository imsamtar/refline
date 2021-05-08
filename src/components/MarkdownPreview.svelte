<script lang="ts">
  import type Page from "$stores/classes/Page";
  import { editorStore } from "$stores/editor";

  import { pages } from "$stores/pages";

  import marked from "marked";
  export let markdown = "";

  function click(event: Event) {
    const element = event.target as HTMLAnchorElement;
    if (element.tagName === "A") {
      event.preventDefault();
      const path = element.href.replace(`${element.origin}/`, "");
      if (path.match(/\w+#\w+/)) {
        const [pageName, lineId] = path.split("#");
        if (pageName && lineId) {
          const page = <Page>pages.get()[pageName];
          if (page) {
            $editorStore.setValue(page.get().map(l => l.content).join("\n"));
            const lineNo = page.get().findIndex((l) => l.id === lineId);
            $editorStore.setPosition({ lineNumber: lineNo + 1, column: 200 });
            $editorStore.focus();
          }
        }
      } else {
        console.log(path);
      }
    }
  }
</script>

<section on:click={click}>
  {@html marked(markdown)}
</section>

<style>
  section {
    width: 100%;
    padding: 1rem;
    background: #eee;
    color: #111;
  }
</style>
