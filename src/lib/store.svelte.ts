import BigNumber from "bignumber.js";
import { bigNumberSerializer, manage, upgradeArraySerializer } from "./localStore.svelte";

export class Worker {

    static priceIncrease = BigNumber(1.1);

    readonly id: string;
    readonly name: string;
    readonly pluralName: string;
    readonly basePrice: BigNumber = BigNumber(0);
    readonly pps: BigNumber = BigNumber(0);
    
    count: BigNumber = $state(BigNumber(0));
    upgrades: Upgrade[] = $state([]);

    constructor(id: string, name: string, pluralName: string, basePrice: number, pps: number, upgrades: Upgrade[]) {
        this.id = id;
        this.name = name;
        this.pluralName = pluralName;
        this.basePrice = BigNumber(basePrice);
        this.pps = BigNumber(pps);
        
        this.count = BigNumber(0);
        manage<BigNumber>(`${id}_count`, () => this.count, v => { this.count = v; }, BigNumber(0), bigNumberSerializer);

        this.upgrades = upgrades;
        manage<Upgrade[]>(`${id}_upgrades`, () => this.upgrades, v => { this.upgrades = v }, upgrades, upgradeArraySerializer);
    }

    getUpgradePrice() {
        return this.basePrice.times(BigNumber(1.25).pow(this.count)).integerValue();
    }

    getUpgradeInfluence(): BigNumber {
        let influence: BigNumber = BigNumber(1);
        this.upgrades.forEach(upgrade => {
            if (upgrade.unlocked) {
                influence = influence.plus(upgrade.value);
            }
        });
        
        return influence;
    }
}

export class Upgrade {
    
    readonly value: BigNumber;
    readonly priceToUnlock: BigNumber;
    readonly name?: string;
    unlocked: boolean = $state(false);

    constructor (value: BigNumber, priceToUnlock: BigNumber, name?: string) {
        this.value = value;
        this.priceToUnlock = priceToUnlock;
        this.unlocked = false;
        this.name = name;
    }

    static createUpgrades(...prices: BigNumber[]): Upgrade[] {
        const upgrades = new Array<Upgrade>(prices.length);
        for (let i = 0; i < prices.length; i++) {
            upgrades[i] = new Upgrade(BigNumber(0.05), prices[i]);
        }
        return upgrades;
    }
}