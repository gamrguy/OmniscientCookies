/// <reference types="cookieclicker" />
interface StockAverage {
    avgValue: number;
    totalValue: number;
}
export declare class SaveData {
    version: string;
    stockAverages: StockAverage[];
    frozenWrinks: Game.Wrinkler[];
    constructor();
    save(): this;
    load(obj: SaveData): void;
    reset(): void;
    /** Saves wrinklers to saveData if preserveWrinklers is on */
    cryosleepWrinklers(): void;
    /**
     * Attempts to restore wrinklers from cryosleep
     * Does not restore wrinklers if total sucked cookies > 0.1% difference
     *
     * @todo Add some kind of offline wrinkler support?
     */
    thawWrinklers(): void;
}
export declare let saveData: SaveData;
export {};
