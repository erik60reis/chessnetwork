<script>
  import { cn } from '../utils.js';
  
  let className = '';
  export { className as class };
</script>

<div class={cn('p-6 pt-0', className)}>
  <slot></slot>
</div>
