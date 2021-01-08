export interface WeightedEntry {
    result: any;
    weight: number;
}
export declare class WeightedRandom {
    entries: WeightedEntry[];
    totalWeight: number;
    constructor(entries: WeightedEntry[]);
    add(entry: WeightedEntry): void;
    add(entry: WeightedEntry[]): void;
    remove(idx: number): boolean;
    get(): any;
}
