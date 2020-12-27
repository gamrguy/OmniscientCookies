/// <reference types="cookieclicker" />
export declare enum ButtonType {
    SHIFT = 16,
    CTRL = 17
}
interface BuyBulkData {
    /** The total price of buying this many buildings */
    readonly totalPrice: number;
    /** The maximum price that can be afforded by the player */
    readonly maxPrice: number;
    /** The maximum amount of buildings that can be afforded by the player */
    readonly maxAmount: number;
}
/**
 * Calculates the price and maximum buildings that can be bought from buying in bulk
 *
 * @param {Game.Object} building Building to buy
 * @param {number} amount Number of buildings to buy
 * @returns {BuyBulkData} Total and maximum affordable price and number of buildings
 */
export declare function calcMaxBuyBulk(building: Game.Object, amount: number, scaling?: number): BuyBulkData;
/**
 * Calculates the maximum number of buildings that can be currently bought in O(1) time.
 * Thanks to staticvariablejames on the Discord server!
 * @param {Game.Object} building Game.Object to calculate maximum buy count of
 * @returns {number} Maximum number of this building that can be bought
 */
export declare function quickCalcMaxBuy(building: Game.Object, scaling?: number): number;
/**
 * Calculates the price of buying buildings in O(1) time.
 * Starts from the current number of buildings.
 * @param {Game.Object} building Building to calculate price of
 * @param {number} bulk Number of buildings to buy
 * @param {boolean} sell Whether to instead calculate selling the buildings
 * @returns {number} Amount of cookies this many buildings is worth
 */
export declare function quickCalcBulkPrice(building: Game.Object, bulk: number, scaling?: number, sell?: boolean): number;
/**
 *
 * @param {number} x Base
 * @param {number} start Starting exponent
 * @param {number} end Ending exponent
 * @returns {number} Sum of exponents x^start to x^end, inclusive
 */
export declare function powerSumRange(x: number, start: number, end: number): number;
/**
 * Returns the progress of a cycle, starting from Jan 1, 1970, 00:00:00, UTC time.
 * @param {number} interval Length of cycle in hours
 * @param {boolean} zoned Whether to offset the cycle as though it were GMT+1 time
 * @returns {number} Rotation of current cycle in radians
 */
export declare function cycliusCalc(interval: number, zoned?: boolean): number;
/**
 * Loads data from an object into another object.
 * @param {object} data Data to be loaded from
 * @param {object} into Object to load data into
 */
export declare function loadData(data: object, into: object): void;
/**
 * Switches the milk selector's icon to the given milk type
 * @param {number} milkID
 */
export declare function switchMilkIcon(milkID: number): void;
/**
 * Gets the number of grandmas from this building's synergy upgrade.
 * @param {Game.Object} building
 * @returns {number} Number of synergy grandmas
 */
export declare function getNumSynergyGrandmas(building: Game.Object): number;
/**
 * Instantly applies the given amount of passive CpS.
 * This includes updating wrinkler bellies and building stats.
 * Used by the revamped Cursed Finger.
 * @param {number} seconds
 */
export declare function gainInstantPassiveCpS(seconds: number): void;
/**
 * Changes the overflowY styling of the center scrollbar
 * @param style overflowY styling to use
 */
export declare function scrollbarStyle(style: string): void;
/**
 * Performs the given function when the given building's minigame has loaded
 * @param obj Name of building
 * @param func Function to run
 */
export declare function onMinigameLoaded(obj: string, func: () => void): void;
/**
 * Queues loading of a custom image asset
 * @param img URL of image to load
 */
export declare function loadCustomAsset(img: string): void;
/** Returns whether the given button is being held */
export declare function holdingButton(btn: ButtonType): number;
/** Whether the mouse is within a given rectangle. Used for UpdateWrinklers */
export declare function inRect(x: number, y: number, rect: any): boolean;
export {};
