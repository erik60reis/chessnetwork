<script>
  import { cn } from '../utils.js';
  
  let className = '';
  export { className as class };
  
  export let value = '';
  export let placeholder = '';
  export let type = 'text';
  export let disabled = false;
  export let error = '';

  let inputElement;

  export const focus = () => {
    inputElement?.focus();
  };
</script>

<div class="relative">
  <input
    bind:this={inputElement}
    bind:value
    {type}
    {placeholder}
    {disabled}
    class={cn(
      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      error && 'border-destructive focus-visible:ring-destructive',
      className
    )}
    on:input
    on:change
    on:focus
    on:blur
    on:keydown
  />
  {#if error}
    <p class="text-sm text-destructive mt-1">{error}</p>
  {/if}
</div>
