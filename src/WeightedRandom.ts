export interface WeightedEntry {
	result: any
	weight: number
}

export class WeightedRandom {
	entries: WeightedEntry[]
	totalWeight: number

	constructor(entries: WeightedEntry[]) {
		this.entries = entries;
		this.totalWeight = 0;
		entries.forEach((e) => this.totalWeight += e.weight);
	}

	add(entry: WeightedEntry): void
	add(entry: WeightedEntry[]): void
	add(entry: any): void {
		if(entry[0] != undefined) {
			this.entries.push(...entry);
			entry.forEach((e: WeightedEntry) => this.totalWeight += e.weight);
		} else {
			this.entries.push(entry);
			this.totalWeight += entry.weight;
		}
	}

	remove(idx: number): boolean {
		if(!this.entries[idx]) return false;
		this.totalWeight -= this.entries[idx].weight;
		this.entries = this.entries.splice(idx, 1);
		return true;
	}

	get(): any {
		let rand = Math.random() * this.totalWeight;
		let rollover = 0;
		for(let entry of this.entries) {
			if(rand <= (entry.weight+rollover)) return entry.result;
			rollover += entry.weight;
		}

		throw new Error("Unable to decide an outcome!");
	}
}