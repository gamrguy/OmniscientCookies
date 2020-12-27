export declare class Patch {
    patchFunc: () => void;
    removeFunc: () => void;
    applied: boolean;
    constructor(patchFunc: () => void, removeFunc?: () => void);
    apply(): void;
    remove(): void;
    toggle(force?: boolean): void;
}
/** Toggles the center view's scrollbar style */
export declare let scrollbarStyle: Patch;
/** Patches DrawBuildings to perform the smoothBuildings setting */
export declare let smoothBuildings: Patch;
/**
 * Patches buildings to support the scroll feature.
 * Also contains the necessary patches for BYGTWD.
 * Because reasons.
 */
export declare let scrollingBuildings: Patch;
/** Patches building tooltips to look a bit better in some cases */
export declare let buildingTooltips: Patch;
/** Patches buff tooltips to show remaining time */
export declare let buffTooltips: Patch;
/**
 * Adds a line break to grandma synergy upgrades
 * Fixes the ordering of grandma upgrades in the stats menu
 * Makes Script grannies trigger a redraw when bought
 */
export declare let miscGrandmaFixes: Patch;
/** Adds support for Tech and Seasonal upgrade categories */
export declare let statsUpgradeCategories: Patch;
/** Enables displaying seasonal unlock sources */
export declare let displaySeasonUnlock: Patch;
/** Allows disabling the Skruuia wrinkler popping bonus */
export declare let skruuiaRebalance: Patch;
/**
 * Reworks Cursed Finger a bit
 * - Removes the "snapshotting" behavior
 * - Gain seconds of true passive CpS
 */
export declare let cursedFingerTweaks: Patch;
/** Enable tooltip wobbling */
export declare let tooltipWobble: Patch;
/** Replaces cyclius gain function with our own */
export declare let cycliusGains: Patch;
/** Displays information about how much you bought your stocks for */
export declare let stockInfo: Patch;
/** Allows buildings to bypass the Fancy graphics setting */
export declare let fancyBuildings: Patch;
/** Allows cursors to bypass the Fancy graphics setting */
export declare let fancyCursors: Patch;
/** Allows wrinklers to bypass the Fancy graphics setting */
export declare let fancyWrinklers: Patch;
/**
 * Properly displays the (seemingly intended) feature of partial buying in bulk.
 * Also makes the ALL button worth ALL, not 1000
 * Also allows using the ALL button in buy mode.
 */
export declare let buySellBulk: Patch;
/** Updates the bulk buy selection for when the option is toggled */
export declare let updateBulkAll: () => void;
/**
 * Fix stock market to use established cookie manipulation options
 * You can now lose some of your earned cookies this way - or gain them!
 */
export declare let dangerousStocks: Patch;
/** Adds a displayed value for each of Cyclius' cycles. */
export declare let cycliusInfo: Patch;
export declare let toggleCyclius: () => void;
/** Miscellaneous performance enhancements */
export declare let optiCookies: Patch;
export declare let dangerousBrokers: Patch;
/**
 * Allows certain prestige upgrades to act like cookie upgrades.
 * This makes them show the [Cookie] tag and appear as cookie particles.
 * Currently applies to:
 * - Heavenly cookies
 * - Wrinkly cookies
 * - Sugar crystal cookies
 *
 * Other mods can add such prestige cookies to `vars.prestigeCookies`.
 */
export declare let heavenlyCookies: Patch;
export declare let buildingPriceBuff: Patch;
