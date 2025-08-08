<script>
  export let variant = 'primary'; // primary, secondary, danger
  export let size = 'medium'; // small, medium, large
  export let disabled = false;
  export let onClick = () => {};
</script>

<button 
  class="btn btn-{variant} btn-{size}" 
  {disabled}
  on:click={onClick}
>
  <slot></slot>
</button>

<style>
  .btn {
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    font-family: inherit;
  }

  .btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  .btn:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  /* Variants */
  .btn-primary {
    background-color: #7fa650;
    color: #ffffff;
  }

  .btn-primary:hover:not(:disabled) {
    background-color: #8fb760;
  }

  .btn-secondary {
    background-color: #75716c;
    color: #ffffff;
  }

  .btn-secondary:hover:not(:disabled) {
    background-color: #85817c;
  }

  .btn-danger {
    background-color: #c33;
    color: #ffffff;
  }

  .btn-danger:hover:not(:disabled) {
    background-color: #d44;
  }

  /* Sizes */
  .btn-small {
    padding: 6px 12px;
    font-size: 12px;
  }

  .btn-medium {
    padding: 10px 20px;
    font-size: 14px;
  }

  .btn-large {
    padding: 14px 28px;
    font-size: 16px;
  }

  @media (max-width: 768px) {
    .btn {
      padding: 12px 16px;
      font-size: 14px;
    }
    
    .btn-small {
      padding: 8px 12px;
      font-size: 12px;
    }
    
    .btn-large {
      padding: 16px 24px;
      font-size: 16px;
    }
  }
</style>
