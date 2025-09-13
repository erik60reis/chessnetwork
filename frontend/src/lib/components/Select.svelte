<script>
  import { cn } from '../utils.js';
  import { ChevronDown } from 'lucide-svelte';
  
  let className = '';
  export { className as class };
  
  export let value = '';
  export let options = [];
  export let placeholder = '';
  export let disabled = false;
</script>

<div class="relative">
  <select 
    bind:value 
    {disabled} 
    class={cn(
      'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none',
      className
    )}
    on:change
  >
    {#if placeholder}
      <option value="" disabled>{placeholder}</option>
    {/if}
    {#each options as option}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
  <ChevronDown class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
</div>
