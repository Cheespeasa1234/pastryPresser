<script lang="ts">

    import BigNumber from "bignumber.js";
    import { onMount } from "svelte";
    import { manage, type StateManager, type StateSerializer, bigNumberSerializer } from "$lib/localStore.svelte";
    
    import { Worker } from "$lib/store.svelte";

    let pastries: BigNumber = $state(BigNumber(0));
    let pastryGetter = () => pastries;
    let pastrySetter = (v: BigNumber) => pastries = v;
    manage<BigNumber>("count", pastryGetter, pastrySetter, bigNumberSerializer);

    let workers = $state({
        cursor: new Worker("cursor", "Cursor", "Cursors", 20, 0.1),
        baker: new Worker("baker", "Baker", "Bakers", 100, 5),
        farm: new Worker("bakery", "Bakery", "Bakeries", 1500, 50),
        bank: new Worker("factory", "Factories", "Factories", 10000, 750),
    });

    let workersValues = $derived(Object.values(workers));

    function canBuy(worker: Worker) {
        return pastries.gte(worker.getUpgradePrice());
    }

    function buy(worker: Worker) {
        if (canBuy(worker)) {
            pastries = pastries.minus(worker.getUpgradePrice());
            worker.count = worker.count.plus(1);
        }
    }
    
    let totalPPS = $derived(() =>
        Object.values(workers).reduce(
            (sum, worker) => sum.plus(worker.pps.times(worker.count)),
            BigNumber(0)
        )
    );

    setInterval(() => {
        pastries = pastries.plus(totalPPS().div(8));
    }, 1000 / 8);
</script>

{#snippet workerShop(worker: Worker)}
    <div>{worker.count} {worker.count.eq(1) ? worker.name: worker.pluralName}</div>
    {#if canBuy(worker)}
        <button onclick={() => buy(worker)}>+1 {worker.name}: {worker.getUpgradePrice()}</button>
    {:else}
        <button disabled onclick={() => buy(worker)}>+1 {worker.name}: {worker.getUpgradePrice()}</button>
    {/if}
{/snippet}

<div id="mainui">
	<div class="ui" id="pastrybar">
		<h1>{pastries.toFixed(3)} pastries</h1>
        <h3>{totalPPS()} pastries per second</h3>
        <button onclick={() => pastries = pastries.plus(1)}>Click!</button>
	</div>
	<div class="ui" id="centerbar"></div>
    <div class="ui" id="upgradebar">
        <h3>Upgrades</h3>
        
        
        <h3>Workers</h3>
        {#each workersValues as worker}
            {@render workerShop(worker)}
        {/each}
    </div>
</div>
<style>

	:global(body,html) {
		margin: 0;
        width: 100%;
        height: 100%;
	}
	
	.ui {
		margin: 0;
        padding: 10px;
	}
    
	#mainui {
        width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		background: red;
        color: white;
        font-family: Verdana, Geneva, Tahoma, sans-serif;
	}

	#pastrybar {
		height: 100%;
		width: 25%;
		background: brown;
        display: flex;
        align-items: center;
        flex-direction: column;
	}

	#centerbar {
		height: 100%;
		width: 50%;
		background: blue;
	}

	#upgradebar {
		height: 100%;
		width: 25%;
		background: green;
	}
</style>