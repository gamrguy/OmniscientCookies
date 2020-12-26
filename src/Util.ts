import * as Logger from './Logger'

export enum ButtonType {
	SHIFT = 16,
	CTRL = 17
}

interface BuyBulkData {
	/** The total price of buying this many buildings */
	readonly totalPrice: number

	/** The maximum price that can be afforded by the player */
	readonly maxPrice: number

	/** The maximum amount of buildings that can be afforded by the player */
	readonly maxAmount: number
}

/**
 * Calculates the price and maximum buildings that can be bought from buying in bulk
 * 
 * @param {Game.Object} building Building to buy
 * @param {number} amount Number of buildings to buy
 * @returns {BuyBulkData} Total and maximum affordable price and number of buildings
 */
export function calcMaxBuyBulk(building: Game.Object, amount: number, scaling: number = Game.priceIncrease): BuyBulkData {
	let totalPrice = 0;
	let maxPrice = 0;
	let maxAmount = 0;
	if(amount == -1) amount = Infinity;

	// if you have infinity, you can get infinity. yep
	// will you have infinity? if you're cheating maybe lol
	// oh but please don't do this while the vanilla game still uses for loops
	// you'll just crash anyways
	if(Game.cookies == Infinity && amount == Infinity) {
		return { totalPrice: Infinity, maxPrice: Infinity, maxAmount: amount };
	}
	
	totalPrice = quickCalcBulkPrice(building, amount, scaling);
	maxAmount = Math.min(amount, quickCalcMaxBuy(building, scaling) + building.free);
	maxPrice = quickCalcBulkPrice(building, maxAmount, scaling);
	
	return { totalPrice: totalPrice, maxPrice: maxPrice, maxAmount: maxAmount };
}

/**
 * Calculates the maximum number of buildings that can be currently bought in O(1) time.
 * Thanks to staticvariablejames on the Discord server!
 * @param {Game.Object} building Game.Object to calculate maximum buy count of
 * @returns {number} Maximum number of this building that can be bought
 */
export function quickCalcMaxBuy(building: Game.Object, scaling: number = Game.priceIncrease): number {
	let cookies = Game.cookies;
	cookies /= Game.modifyBuildingPrice(building.name, building.basePrice);
	let boughtCount = building.amount - building.free;
	return Math.floor(Math.log(scaling**boughtCount + (scaling - 1)*cookies)/Math.log(scaling) - building.amount);
}

/**
 * Calculates the price of buying buildings in O(1) time.
 * Starts from the current number of buildings.
 * @param {Game.Object} building Building to calculate price of
 * @param {number} bulk Number of buildings to buy
 * @param {boolean} sell Whether to instead calculate selling the buildings
 * @returns {number} Amount of cookies this many buildings is worth
 */
export function quickCalcBulkPrice(building: Game.Object, bulk: number, scaling: number = Game.priceIncrease, sell?: boolean): number {
	let buildingCount = Math.max(0, building.amount - building.free);
	let sum: number;
	if(sell) {
		if(buildingCount <= 0) return 0;
		buildingCount--;
		sum = powerSumRange(scaling, Math.max(0, buildingCount-bulk), buildingCount);
	} else {
		sum = powerSumRange(scaling, buildingCount, buildingCount + bulk-1);
	}
	sum = Game.modifyBuildingPrice(building.name, sum*building.basePrice);
	if(sell) sum *= building.getSellMultiplier();
	return Math.ceil(sum);
}

/**
 * 
 * @param {number} x Base
 * @param {number} start Starting exponent
 * @param {number} end Ending exponent
 * @returns {number} Sum of exponents x^start to x^end, inclusive
 */
export function powerSumRange(x: number, start: number, end: number): number {
	if(x < 0) return -1;           // please don't
	if(x == 0) return 0;           // obviously
	if(x == 1) return end - start; // come on man
	if(start == end) return x**start; // really, this is getting old
	
	let sum1 = (x**(start) - 1)/(x - 1); // sum from 0 to start-1
	let sum2 = (x**(end+1) - 1)/(x - 1);   // sum from 0 to end
	return sum2 - sum1; // sum from start to end
}

/**
 * Returns the progress of a cycle, starting from Jan 1, 1970, 00:00:00, UTC time.
 * @param {number} interval Length of cycle in hours
 * @param {boolean} zoned Whether to offset the cycle as though it were GMT+1 time
 * @returns {number} Rotation of current cycle in radians
 */
export function cycliusCalc(interval: number, zoned?: boolean): number {
	let cycle = (Date.now()/1000/(60*60*interval));
	if(zoned) {
		cycle += (new Date().getTimezoneOffset() + 60)/60/interval
	}
	cycle %= 1;
	return cycle*Math.PI*2;
}

/**
 * Loads data from an object into another object.
 * @param {object} data Data to be loaded from
 * @param {object} into Object to load data into
 */
export function loadData(data: object, into: object): void {
	if(data) {
		for(let key of Object.keys(data)) {
			if(key in into) {
				// convert from old boolean buttons to new optioned buttons
				// for these buttons in particular, 0 was "on" and 2 is now "off"
				if(typeof data[key] == 'boolean' && typeof into[key] == 'number') {
					data[key] = data[key] ? 0 : 2;
				}
				into[key] = data[key];
			}
		}
	}
}

/**
 * Switches the milk selector's icon to the given milk type
 * @param {number} milkID
 */
export function switchMilkIcon(milkID: number): void {
	let milkSelect = Game.Upgrades['Milk selector'] as Game.SelectorSwitch;
	if(milkID == 0) milkSelect.icon = Game.Milk.icon;
	else milkSelect.icon = milkSelect.choicesFunction()[milkID].icon;
	Game.upgradesToRebuild = 1;
}

/**
 * Gets the number of grandmas from this building's synergy upgrade.
 * @param {Game.Object} building 
 * @returns {number} Number of synergy grandmas
 */
export function getNumSynergyGrandmas(building: Game.Object): number {
	if(building.grandma && building.grandma.bought) {
		return Math.floor(Game.Objects['Grandma'].amount / (building.id - 1));
	}
	return -1;
}

/**
 * Instantly applies the given amount of passive CpS.
 * This includes updating wrinkler bellies and building stats.
 * Used by the revamped Cursed Finger.
 * @param {number} seconds 
 */
export function gainInstantPassiveCpS(seconds: number): void {
	let cookies = Game.cookiesPs * seconds;

	// Suck the cookies
	for(let wrinkler of Game.wrinklers) {
		if(wrinkler.phase == 2) {
			wrinkler.sucked += cookies * Game.cpsSucked;
			Game.cookiesSucked += cookies * Game.cpsSucked;
		}
	}
	cookies *= 1 - Game.cpsSucked;

	// Update building total cookies baked stats
	for (let obj of Game.ObjectsById) {
		obj.totalCookies += obj.storedTotalCps * Game.globalCpsMult * seconds;
	}

	Game.Earn(cookies);
}

/**
 * Changes the overflowY styling of the center scrollbar
 * @param style overflowY styling to use
 */
export function scrollbarStyle(style: string) {
	var center = document.getElementById('centerArea');
	center.style.overflowY = style;
}

/** 
 * Performs the given function when the given building's minigame has loaded 
 * @param obj Name of building
 * @param func Function to run
 */
export function onMinigameLoaded(obj: string, func: () => void) {
	let interval = setInterval(function() {
		if(Game.Objects[obj].minigameLoaded) {
			func();
			clearInterval(interval);
		}
	}, 250);
}

/**
 * Queues loading of a custom image asset
 * @param img URL of image to load
 */
export function loadCustomAsset(img: string) {
	if(!Game.Loader.assetsLoading[img] && !Game.Loader.assetsLoaded[img]) {
		Game.Loader.assets[img] = ({} as any);
		Game.Loader.Replace(img, img);
		Game.Loader.assetsLoading.push(img);
	}
}

/** Returns whether the given button is being held */
export function holdingButton(btn: ButtonType): number {
	return Game.keys[btn] == undefined ? 0 : Game.keys[btn];
}

/** Whether the mouse is within a given rectangle. Used for UpdateWrinklers */
export function inRect(x: number,y: number, rect: any): boolean {
	//find out if the point x,y is in the rotated rectangle rect{w,h,r,o} (width,height,rotation in radians,y-origin) (needs to be normalized)
	//I found this somewhere online I guess
	let dx = x+Math.sin(-rect.r)*(-(rect.h/2-rect.o)),dy=y+Math.cos(-rect.r)*(-(rect.h/2-rect.o));
	let h1 = Math.sqrt(dx*dx + dy*dy);
	let currA = Math.atan2(dy,dx);
	let newA = currA - rect.r;
	let x2 = Math.cos(newA) * h1;
	let y2 = Math.sin(newA) * h1;
	if (x2 > -0.5 * rect.w && x2 < 0.5 * rect.w && y2 > -0.5 * rect.h && y2 < 0.5 * rect.h) return true;
	return false;
};