<script>
  import { cn } from '../utils.js';
  
  let className = '';
  export { className as class };
  
  export let showLogo = true;
  export let logoClickable = true;

  function goToMainMenu() {
    if (logoClickable) {
      window.location.href = "/";
    }
  }
</script>

<div class={cn('min-h-screen bg-background text-foreground', className)}>
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2427220674328875"
    crossorigin="anonymous"></script>
  {#if showLogo}
    <header class="bg-card border-b border-border">
      <div class="container mx-auto px-4 py-3">
        <div class="flex justify-center">
          <button 
            class={cn(
              'transition-transform duration-200 bg-transparent border-none p-0',
              logoClickable && 'cursor-pointer hover:scale-105'
            )}
            on:click={goToMainMenu}
            on:keydown={(e) => e.key === 'Enter' && goToMainMenu()}
            tabindex={logoClickable ? 0 : -1}
            disabled={!logoClickable}
          >
            <img 
              src="/assets/logobanner.png" 
              alt="O Xadrez Logo" 
              class="h-12 w-auto"
            />
          </button>
        </div>
      </div>
    </header>
  {/if}
  
  <main class="container mx-auto px-4 py-6">
    <slot></slot>
  </main>
</div>
