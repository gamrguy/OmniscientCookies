import { version } from "./Vars"
import { settings } from "./Settings"
import { loadData } from "./Util";

interface StockAverage {
	avgValue: number,
	totalValue: number
}

export class SaveData {
	version: string
	stockAverages: StockAverage[]
	frozenWrinks: Game.Wrinkler[]

	constructor() {
		this.version = version;
		this.stockAverages = [];
		this.frozenWrinks = null;
	}

	save() {
		this.cryosleepWrinklers();
		return this;
	}

	load(obj: SaveData) {
		loadData(obj, this);
		this.thawWrinklers();
	}

	reset() {
		this.stockAverages = [];
		this.frozenWrinks = null;
	}

	/** Saves wrinklers to saveData if preserveWrinklers is on */
	cryosleepWrinklers() {
		if(settings.preserveWrinklers) {
			this.frozenWrinks = Game.wrinklers
		} else {
			this.frozenWrinks = null
		}
	}

	/**
	 * Attempts to restore wrinklers from cryosleep
	 * Does not restore wrinklers if total sucked cookies > 0.1% difference
	 * 
	 * @todo Add some kind of offline wrinkler support?
	 */
	thawWrinklers() {
		if(settings.preserveWrinklers && this.frozenWrinks) {
			let realWrinks = Game.wrinklers;
			let currentWrinks = Game.SaveWrinklers();
			Game.wrinklers = this.frozenWrinks;
			let thawedWrinks = Game.SaveWrinklers();

			// If our number of wrinklers has changed, don't run
			if(currentWrinks.number != thawedWrinks.number || currentWrinks.shinies != thawedWrinks.shinies)
				return;
			
			// Update thawed wrinkler values for how long the game was running
			for(let wrinkler of Game.wrinklers) {
				if(wrinkler.phase == 2) {
					wrinkler.sucked += (Game.cookiesPs/Game.fps)*Game.cpsSucked*Game.loopT;
				}
			}

			thawedWrinks = Game.SaveWrinklers();

			let normalRatio = (currentWrinks.amount == 0 || thawedWrinks.amount == 0)
				? (currentWrinks.amount == thawedWrinks.amount ? 1 : 0)
				: Math.min(currentWrinks.amount/thawedWrinks.amount, thawedWrinks.amount/currentWrinks.amount);
			let shinyRatio = (currentWrinks.amountShinies == 0 || thawedWrinks.amountShinies == 0) 
				? (currentWrinks.amountShinies == thawedWrinks.amountShinies ? 1 : 0)
				: Math.min(currentWrinks.amountShinies/thawedWrinks.amountShinies, thawedWrinks.amountShinies/currentWrinks.amountShinies)
			//console.log(Game.T+' '+Game.loopT);
			//console.log(currentWrinks.amount + ' ' + thawedWrinks.amount);
			//console.log(normalRatio + ' ' + shinyRatio);

			// Allow wrinkler loading if values are within 1% of expected
			let threshold = 0.99;
			if(normalRatio < threshold || shinyRatio < threshold) {
				Game.wrinklers = realWrinks;
				return;
			}
		}
	}
}

export let saveData = new SaveData();