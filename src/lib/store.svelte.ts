import BigNumber from "bignumber.js";
import { bigNumberSerializer, manage } from "./localStore.svelte";

export class Worker {
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
        this.count = BigNumber(0);

        manage<BigNumber>(`${id}_count`, () => this.count, v => { this.count = v; }, bigNumberSerializer);
    }

    getUpgradePrice() {
        return this.basePrice.times(BigNumber(1.25).pow(this.count)).integerValue();
    }
}