<script lang="ts">
	import favicon from '$lib/assets/favicon.png';
	import { page } from '$app/state'; 
	
	let { children } = $props();

   let title = $derived.by(() => {
	
    const path = page.url.pathname.split("/").filter(Boolean);
	path.unshift("Sahmat")
    return path
      .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' - ');
  });
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{title}</title>
</svelte:head>


{@render children()}

<style >
  :global(html), :global(body) {
	background-color: aliceblue;
	/* height: 100%;
	margin: 0;
	overflow: hidden; */
  }


</style>
