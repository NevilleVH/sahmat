<script lang="ts">
	import favicon from '$lib/assets/favicon.png';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>


{@render children()}

<style >
  :global(html), :global(body) {
	background-color: aliceblue;
    /* min-height: 100vh; */
  }

  
</style>
