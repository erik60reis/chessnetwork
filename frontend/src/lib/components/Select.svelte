<script>
  export let value = '';
  export let options = [];
  export let placeholder = '';
  export let disabled = false;
  export let fullWidth = false;
</script>

<div class="select-container" class:full-width={fullWidth}>
  <select bind:value {disabled} class="select" on:change>
    {#if placeholder}
      <option value="" disabled>{placeholder}</option>
    {/if}
    {#each options as option}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
  <div class="select-arrow">
    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
      <path d="M1 1L6 6L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
</div>

<style>
  .select-container {
    position: relative;
    display: inline-block;
  }

  .select-container.full-width {
    width: 100%;
  }

  .select {
    appearance: none;
    border-radius: 6px;
    padding: 8px 32px 8px 12px;
    border: 2px solid #262522;
    background-color: #302e2b;
    color: #ffffff;
    font-size: 14px;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
    box-sizing: border-box;
  }

  .select:focus {
    outline: none;
    border-color: #7fa650;
    box-shadow: 0 0 0 2px rgba(127, 166, 80, 0.2);
  }

  .select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .select-arrow {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: #9c9c9c;
    transition: transform 0.2s ease;
  }

  .select:focus + .select-arrow {
    transform: translateY(-50%) rotate(180deg);
  }

  @media (max-width: 768px) {
    .select {
      padding: 12px 36px 12px 16px;
      font-size: 16px; /* Prevents zoom on iOS */
    }

    .select-arrow {
      right: 12px;
    }
  }
</style>
