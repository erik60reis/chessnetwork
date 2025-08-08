<script>
  export let showLogo = true;
  export let logoClickable = true;

  function goToMainMenu() {
    if (logoClickable) {
      window.location.href = "/";
    }
  }
</script>

<div class="layout">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2427220674328875"
    crossorigin="anonymous"></script>
  {#if showLogo}
    <header class="header">
      <div class="logo-container">
        <img 
          src="/assets/logobanner.png" 
          alt="O Xadrez Logo" 
          class="logo"
          class:clickable={logoClickable}
          on:click={goToMainMenu}
          on:keydown={(e) => e.key === 'Enter' && goToMainMenu()}
          tabindex={logoClickable ? 0 : -1}
        />
      </div>
    </header>
  {/if}
  
  <main class="main-content">
    <slot></slot>
  </main>
</div>

<style>
  .layout {
    min-height: 100vh;
    background-color: #302e2b;
    color: #ffffff;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }

  .header {
    background-color: #262522;
    padding: 8px 16px;
    border-radius: 0 0 8px 8px;
    margin-bottom: 16px;
  }

  .logo-container {
    display: flex;
    justify-content: center;
  }

  .logo {
    height: 60px;
    width: auto;
    transition: transform 0.2s ease;
  }

  .logo.clickable {
    cursor: pointer;
  }

  .logo.clickable:hover {
    transform: scale(1.05);
  }

  .main-content {
    padding: 0 16px 16px;
    max-width: 1200px;
    margin: 0 auto;
  }

  @media (max-width: 768px) {
    .header {
      padding: 6px 12px;
      margin-bottom: 12px;
    }

    .logo {
      height: 48px;
    }

    .main-content {
      padding: 0 12px 12px;
    }
  }

  @media (max-width: 480px) {
    .header {
      padding: 4px 8px;
      margin-bottom: 8px;
    }

    .logo {
      height: 40px;
    }

    .main-content {
      padding: 0 8px 8px;
    }
  }
</style>
