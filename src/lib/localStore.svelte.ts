import BigNumber from "bignumber.js";
import { onMount } from "svelte";
import { Upgrade, Worker } from "./store.svelte";

export interface StateManager<T> {
    get value(): T;
    set value(T);
}

export interface StateSerializer<T> {
    serialize(value: T): string;
    deserialize(serial: string): T;
    isUndefined(value: T): boolean; 
}

export function manage<T>(key: string, getter: () => T, setter: (v: T) => void, defaultValue: T, stateSerializer: StateSerializer<T>) {
    $inspect(getter()).with((t,v) => {
        if (t === "update") {
            localStorage.setItem(key, stateSerializer.serialize(getter()));
        }
    });

    onMount(() => {
        // DEBUG 
        (window as any).__svelte[`${key}Getter`] = () => {
            return stateSerializer.serialize(getter());
        };
        (window as any).__svelte[`${key}Setter`] = (v: string) => {
            setter(stateSerializer.deserialize(v));
        };
        
        const fromStorage: string | null = localStorage.getItem(key);
        if (fromStorage) {
            const deserialized = stateSerializer.deserialize(fromStorage);
            if (stateSerializer.isUndefined(deserialized)) {
                setter(defaultValue);
            } else {
                setter(deserialized);
            }
        } else {
            setter(defaultValue);
        }
    });
}

export const bigNumberSerializer: StateSerializer<BigNumber> = {
    serialize: value => value.toFixed(3),
    deserialize: serial => BigNumber(serial),
    isUndefined: (value) => false,
}

export const upgradeArraySerializer: StateSerializer<Upgrade[]> = {
    serialize: value => {
        const ans = JSON.stringify(value);
        return ans;
    },
    deserialize: serial => {
        const ans = JSON.parse(serial);
        return ans;
    },
    isUndefined: (value) => value.length === 0,
}