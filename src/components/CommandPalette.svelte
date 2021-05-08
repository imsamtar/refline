<script lang="ts">
  import { commandPaletteShown } from "$stores/config";
  import { createEventDispatcher } from "svelte";

  export let placeholder = "";
  export let value = "";
  export let options = [];
  let selectedOption = 0;
  const dispatch = createEventDispatcher();

  $: filteredOptions = value ? options.filter((option) => option.name.match(new RegExp(value, "i"))) : options;

  function autofocus(element: HTMLInputElement) {
    element.focus();
  }

  function windowKeydown(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === "p") {
      event.preventDefault();
      $commandPaletteShown = !$commandPaletteShown;
    } else if ($commandPaletteShown) {
      if (event.key === "Escape") {
        $commandPaletteShown = false;
      } else if (event.key === "ArrowUp") {
        selectedOption = Math.max(0, (selectedOption - 1) % filteredOptions.length);
      } else if (event.key === "ArrowDown") {
        selectedOption = Math.max(0, (selectedOption + 1) % filteredOptions.length);
      } else if (event.key === "Enter") {
        const option = filteredOptions[Math.min(filteredOptions.length - 1, selectedOption)];
        if (option) {
          const temp = option.action();
          if (typeof temp !== "undefined") {
            value = temp;
          }
        }
        dispatch("submit", { value, option, options });
        $commandPaletteShown = false;
      }
    }
  }

  $: if (!$commandPaletteShown) {
    value = "";
  }

  $: selectedOption = Math.max(0, Math.min(filteredOptions.length - 1, selectedOption));
</script>

<svelte:window on:keydown={windowKeydown} />

{#if $commandPaletteShown}
  <div class="command-palette">
    <input type="text" {placeholder} bind:value use:autofocus on:keyup spellcheck="false" />
    <div class="suggestions">
      {#each filteredOptions as option, index}
        <div class="suggestion" class:active={selectedOption === index}>
          <div class="command-name">{option.name}</div>
          <div class="keyboard-shortcut">{option.keyboard || ""}</div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .command-palette {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans",
      "Helvetica Neue", sans-serif;
    top: 0;
    left: 50%;
    position: fixed;
    z-index: 100;
    transform: translateX(-50%);
    outline: 3px solid #333;
  }
  input {
    width: 400px;
    max-width: 90vw;
    padding: 0.5rem;
    font-size: 1rem;
    color: #eee;
    background: #333;
    border: none;
    outline: none;
  }
  .suggestions {
    display: flex;
    flex-direction: column;
    background: #333;
    gap: 0.1rem;
  }
  .suggestion {
    background: #222;
    font-size: 1rem;
    padding: 0.5rem;
    display: flex;
    justify-content: space-between;
  }
  .command-name {
    color: #ddd;
  }
  .keyboard-shortcut {
    color: #ffffff88;
  }
  .suggestion.active {
    background: #2a61c5;
    color: #ddd;
  }
</style>
