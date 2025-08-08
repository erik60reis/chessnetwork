<script>
  import { onMount } from 'svelte';

  export let text = '';
  export let size = 150;

  let qrContainer;

  onMount(() => {
    generateQRCode();
  });

  function generateQRCode() {
    if (typeof window !== 'undefined' && window.QRCode && qrContainer && text) {
      // Clear existing QR code
      qrContainer.innerHTML = '';
      
      new window.QRCode(qrContainer, {
        text: text,
        width: size,
        height: size,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: window.QRCode.CorrectLevel.H
      });
    }
  }

  // Regenerate QR code when text or size changes
  $: if (qrContainer && text) {
    generateQRCode();
  }
</script>

<div class="qr-container">
  <div bind:this={qrContainer} class="qr-code"></div>
</div>

<style>
  .qr-container {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #ffffff;
    border-radius: 8px;
    padding: 16px;
    margin: 16px auto;
    width: fit-content;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .qr-code {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .qr-code :global(table) {
    border-collapse: collapse;
  }

  .qr-code :global(td) {
    padding: 0;
    margin: 0;
  }

  @media (max-width: 480px) {
    .qr-container {
      padding: 12px;
      margin: 12px auto;
    }
  }
</style>
