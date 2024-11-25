import BigNumber from "bignumber.js";
import { onMount } from "svelte";

export interface StateManager<T> {
    get value(): T;
    set value(T);
}

export interface StateSerializer<T> {
    serialize(value: T): string;
    deserialize(serial: string): T;
    defaultValue(): T;    
}

export function manage<T>(key: string, getter: () => T, setter: (v: T) => void, stateSerializer: StateSerializer<T>) {
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
        if (fromStorage !== null) {
            setter(stateSerializer.deserialize(fromStorage) || stateSerializer.defaultValue());
        } else {
            setter(stateSerializer.defaultValue());
        }
    });
}

export const bigNumberSerializer: StateSerializer<BigNumber> = {
    serialize: value => value.toFixed(3),
    deserialize: serial => BigNumber(serial),
    defaultValue: () => BigNumber(0),
}