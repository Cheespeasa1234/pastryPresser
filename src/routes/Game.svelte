<script lang="ts">

    import BigNumber from "bignumber.js";
    import { onMount } from "svelte";
    
	let pastries: BigNumber = $state(BigNumber(0));

    onMount(() => {
        pastries = BigNumber(localStorage.getItem("pp_count") || 0);
        $inspect(pastries).with((t,v) => {
            if (t === "update") {
                localStorage.setItem("pp_count", pastries.toFixed(3));
            }
        });
    });
    

    class Worker {
        static priceIncrease = BigNumber(1.1);

        readonly id: string;
        readonly name: string;
        readonly pluralName: string;

        basePrice = $state(BigNumber(0));
        pps = $state(BigNumber(0));
        count = $state(BigNumber(0));

        constructor(id: string, name: string, pluralName: string, basePrice: number, pps: number) {
            this.id = id;
            this.name = name;
            this.pluralName = pluralName;
            
            this.basePrice = BigNumber(basePrice);
            this.pps = BigNumber(pps);

            onMount(() => {
                this.count = BigNumber(localStorage.getItem(`pp_${id}_count`) || 0);
                $inspect(this.count).with((t,v) => {
                    if (t === "update") {
                        localStorage.setItem(`pp_${id}_count`, this.count.toFixed(3));
                    }
                })
            });
        }

        getUpgradePrice() {
            return this.basePrice.times(BigNumber(1.25).pow(this.count)).integerValue();
        }
    }

    let workers = $state({
        cursor: new Worker("cursor", "Cursor", "Cursors", 20, 0.1),
        gma: new Worker("gma", "Grandma", "Grandmas", 100, 5),
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
	<div id="pastrybar">
		<h1>{pastries.toFixed(3)} pastries</h1>
        <h3>{totalPPS()} pastries per second</h3>
        <button onclick={() => pastries = pastries.plus(1)}>Click!</button>
	</div>
	<div class="ui" id="centerbar"></div>
    <div id="upgradebar">
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
        display: flex;
		justify-content: center;
		margin: 0;
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