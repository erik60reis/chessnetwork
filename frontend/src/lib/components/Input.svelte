<script>
  export let value = '';
  export let placeholder = '';
  export let type = 'text';
  export let disabled = false;
  export let fullWidth = false;
  export let error = '';

  let inputElement;

  export const focus = () => {
    inputElement?.focus();
  };
</script>

<div class="input-container" class:full-width={fullWidth}>
  <input
    bind:this={inputElement}
    bind:value
    {type}
    {placeholder}
    {disabled}
    class="input"
    class:error={error}
    on:input
    on:change
    on:focus
    on:blur
    on:keydown
  />
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
</div>

<style>
  .input-container {
    display: inline-block;
    position: relative;
  }

  .input-container.full-width {
    width: 100%;
  }

  .input {
    border-radius: 6px;
    padding: 8px 12px;
    border: 2px solid #262522;
    background-color: #302e2b;
    color: #ffffff;
    font-size: 14px;
    transition: all 0.2s ease;
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
  }

  .input:focus {
    outline: none;
    border-color: #7fa650;
    box-shadow: 0 0 0 2px rgba(127, 166, 80, 0.2);
  }

  .input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .input.error {
    border-color: #c33;
  }

  .input.error:focus {
    border-color: #c33;
    box-shadow: 0 0 0 2px rgba(204, 51, 51, 0.2);
  }

  .error-message {
    color: #c33;
    font-size: 12px;
    margin-top: 4px;
    position: absolute;
    left: 0;
    right: 0;
  }

  @media (max-width: 768px) {
    .input {
      padding: 12px 16px;
      font-size: 16px; /* Prevents zoom on iOS */
    }
  }
</style>
