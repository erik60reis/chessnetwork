<script>
  import { cn } from '../utils.js';
  
  let className = '';
  export { className as class };
</script>

<h3 class={cn('text-2xl font-semibold leading-none tracking-tight', className)}>
  <slot></slot>
</h3>
