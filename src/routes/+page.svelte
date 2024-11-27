<script lang="ts">
    import BigNumber from "bignumber.js";
    import { onMount } from "svelte";
    import {
        manage,
        type StateManager,
        type StateSerializer,
        bigNumberSerializer,
        upgradeArraySerializer,
    } from "$lib/localStore.svelte";

    import { Upgrade, Worker } from "$lib/store.svelte";

    let pastries: BigNumber = $state(BigNumber(0));
    manage<BigNumber>(
        "count",
        () => pastries,
        (v: BigNumber) => (pastries = v),
        BigNumber(0),
        bigNumberSerializer,
    );

    let workers = $state({
        cursor: new Worker(
            "cursor",
            "Cursor",
            "Cursors",
            20,
            0.5,
            Upgrade.createUpgrades(
                BigNumber(100),
                BigNumber(1000),
                BigNumber(2000),
            ),
        ),
        baker: new Worker(
            "baker",
            "Baker",
            "Bakers",
            100,
            5,
            Upgrade.createUpgrades(
                BigNumber(1000),
                BigNumber(5000),
                BigNumber(10000),
            ),
        ),
        farm: new Worker(
            "bakery",
            "Bakery",
            "Bakeries",
            1500,
            50,
            Upgrade.createUpgrades(
                BigNumber(15000),
                BigNumber(30000),
                BigNumber(100000),
            ),
        ),
        bank: new Worker(
            "factory",
            "Factories",
            "Factories",
            10000,
            750,
            Upgrade.createUpgrades(
                BigNumber(100000),
                BigNumber(250000),
                BigNumber(1000000),
            ),
        ),
    });

    let workersValues = $derived(Object.values(workers));

    let pastryUpgrades: Upgrade[] = $state([
        new Upgrade(BigNumber(0.1), BigNumber(1000), "Croissant"),
        new Upgrade(BigNumber(0.1), BigNumber(10000), "Cookie"),
        new Upgrade(BigNumber(0.1), BigNumber(30000), "Brownie"),
        new Upgrade(BigNumber(0.1), BigNumber(70000), "Muffin"),
        new Upgrade(BigNumber(0.1), BigNumber(100000), "Cupcake"),
        new Upgrade(BigNumber(0.1), BigNumber(250000), "Donut"),
    ]);
    manage<Upgrade[]>(
        "pastry_upgrades",
        () => pastryUpgrades,
        (v) => pastryUpgrades = v,
        (()=>pastryUpgrades)(),
        upgradeArraySerializer,
    );

    function canBuyWorker(worker: Worker) {
        return pastries.gte(worker.getUpgradePrice());
    }

    function canBuyUpgrade(upgrade: Upgrade) {
        return pastries.gte(upgrade.priceToUnlock);
    }

    function buyWorker(worker: Worker) {
        if (canBuyWorker(worker)) {
            pastries = pastries.minus(worker.getUpgradePrice());
            worker.count = worker.count.plus(1);
        }
    }

    function buyUpgrade(upgrade: Upgrade) {
        if (canBuyUpgrade(upgrade)) {
            pastries = pastries.minus(upgrade.priceToUnlock);
            upgrade.unlocked = true;
        }
    }

    let getTotalPPS = $derived(() => {
        let total: BigNumber = BigNumber(0);
        for (let worker of Object.values(workers)) {
            total = total.plus(worker.pps.times(worker.count)).times(worker.getUpgradeInfluence());
        }
        for (let upgrade of pastryUpgrades) {
            if (upgrade.unlocked) {
                total = total.times(upgrade.value.plus(BigNumber(1)));
            }
        }
        return total;
    });

    setInterval(() => {
        pastries = pastries.plus(getTotalPPS().div(8));
    }, 1000 / 8);
</script>

{#snippet workerShop(worker: Worker)}
    <div>
        {worker.count}
        {worker.count.eq(1) ? worker.name : worker.pluralName}
    </div>
    {#if canBuyWorker(worker)}
        <button onclick={() => buyWorker(worker)}
            >+1 {worker.name}: {worker.getUpgradePrice()}</button
        >
    {:else}
        <button disabled onclick={() => buyWorker(worker)}
            >+1 {worker.name}: {worker.getUpgradePrice()}</button
        >
    {/if}
{/snippet}

{#snippet upgradeShop(upgrade: Upgrade, upgradeName: string)}
    {#if !upgrade.unlocked}
        <div class="upgrade-shop">
            {#if canBuyUpgrade(upgrade)}
                <button class="upgrade" onclick={() => buyUpgrade(upgrade)}
                    >{upgradeName} x{upgrade.value}: {upgrade.priceToUnlock}</button
                >
            {:else}
                <button
                    class="upgrade"
                    disabled
                    onclick={() => buyUpgrade(upgrade)}
                    >{upgradeName} x{upgrade.value}: {upgrade.priceToUnlock}</button
                >
            {/if}
        </div>
    {:else}
        <!-- <button class="upgrade">Unlocked</button> -->
    {/if}
{/snippet}

<div id="mainui">
    <div class="ui" id="pastrybar">
        <h1>{pastries.toFixed(3)} pastries</h1>
        <h3>{getTotalPPS()} pastries per second</h3>
        <button onclick={() => (pastries = pastries.plus(1))}>Click!</button>
    </div>
    <div class="ui" id="centerbar"></div>
    <div class="ui" id="upgradebar">
        <h3>Upgrades</h3>
        <div class="upgrade-shop">
            {#each pastryUpgrades as upgrade}
                {@render upgradeShop(upgrade, upgrade.name || "")}
            {/each}
            {#each workersValues as worker}
                {#each worker.upgrades as upgrade}
                    {@render upgradeShop(upgrade, worker.name)}
                {/each}
            {/each}
        </div>

        <h3>Workers</h3>
        {#each workersValues as worker}
            {@render workerShop(worker)}
        {/each}
    </div>
</div>

<style>
    :global(body, html) {
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

    .upgrade {
        width: 80px;
        height: 80px;
        border-radius: 5px;
    }

    .upgrade-shop {
        max-height: 200px;
        overflow: auto;
        padding: 5px;
        background: rgba(255, 255, 255, 0.5);
        display: flex;
        flex-wrap: wrap;
    }
</style>
