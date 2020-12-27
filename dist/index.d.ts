/// <reference types="cookieclicker" />
interface StockAverage {
    avgValue: number;
    totalValue: number;
}
declare class SaveData {
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

declare enum BypassFancySetting {
    Default = 0,
    Fast = 1,
    Fancy = 2
}
declare class Settings {
    /** Current Omniscient Cookies version */
    version: string;
    /** Whether the scrollbar will automatically hide itself */
    autoScrollbar: boolean;
    /** Whether buildings will scroll when hovering over the outer 100px */
    scrollingBuildings: boolean;
    /** Whether buildings will draw every frame (instead of every 3 frames) */
    smoothBuildings: boolean;
    /** Whether to show buff duration in buff tooltips */
    buffTooltipDuration: boolean;
    /** Whether to improve building tooltips */
    betterBuildingTooltips: boolean;
    /** Whether to fix various grandma-related nitpicks */
    betterGrandmas: boolean;
    /** Whether to give tech upgrades their own stats category */
    separateTechs: boolean;
    /** Whether to enhance the bulk buy/sell experience */
    enhancedBulk: boolean;
    /** How buildings will override the Fancy setting */
    buildingsBypassFancy: BypassFancySetting;
    /** How cursors will override the Fancy setting */
    cursorsBypassFancy: BypassFancySetting;
    /** How wrinklers will override the Fancy setting */
    wrinklersBypassFancy: BypassFancySetting;
    /** Whether buildings will attempt to skip unnecessary frames */
    optimizeBuildings: boolean;
    /** Whether to attempt to restore wrinklers to exact specifications */
    preserveWrinklers: boolean;
    /** Whether to show Cyclius' cycles in his tooltip */
    detailedCyclius: boolean;
    /** Whether to offset Cyclius as though it were always GMT+1 time */
    zonedCyclius: boolean;
    /** Whether to make Cyclius' sprite rotate with his cycles */
    trueCyclius: boolean;
    /** Whether to display information about average bought stock values */
    stockValueData: boolean;
    /** Whether buying or selling on the stock market will affect total cookies baked */
    dangerousStocks: boolean;
    /** Whether to use the tooltip wobble animation */
    tooltipWobble: boolean;
    /** Whether the milk selector's icon will reflect the current milk */
    fancyMilkSelect: boolean;
    /** Whether to apply slight graphical improvements to the Grimoire's magic meter */
    improveMagicMeter: boolean;
    /** Whether Skruuia's bonus should affect wrinkler suck rate rather than wrinkler pop multiplier */
    skruuiaRebalance: boolean;
    /** Whether to apply a graphical overhaul to the ascend meter */
    improveAscendMeter: boolean;
    /** Whether to display seasonal requirements on related upgrades */
    displaySeasons: boolean;
    /** Whether to give seasonal upgrades their own stats category */
    separateSeasons: boolean;
    /** Whether to show grandmas at work */
    bringGrandmaToWork: boolean;
    /**
     * Whether to rework Cursed Finger to:
     * - Not snapshot
     * - Count as true passive CpS
     */
    cursedFinger: boolean;
    /** Whether to apply experimental performance enhancements */
    optiCookies: boolean;
    /** Whether to make stock brokers decrease Stock Market profits */
    dangerousBrokers: boolean;
    /** Whether to allow certain heavenly upgrades to add their icons to the cookie pool */
    heavenlyCookies: boolean;
    /** Whether to make building price multipliers instead affect the price scaling */
    buildingPriceBuff: boolean;
    /** Exponent of 10 to aim for when the ascend meter fills */
    /** Initializes to the default settings */
    constructor();
    set(setting: string, value: any): void;
    get(setting: string): any;
    save(): this;
    load(obj: Settings): void;
}

declare function log(message: any): void;
declare function warn(message: any): void;
declare function error(message: any): void;

declare const _Logger_log: typeof log;
declare const _Logger_warn: typeof warn;
declare const _Logger_error: typeof error;
declare namespace _Logger {
  export {
    _Logger_log as log,
    _Logger_warn as warn,
    _Logger_error as error,
  };
}

declare enum ButtonType {
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
declare function calcMaxBuyBulk(building: Game.Object, amount: number, scaling?: number): BuyBulkData;
/**
 * Calculates the maximum number of buildings that can be currently bought in O(1) time.
 * Thanks to staticvariablejames on the Discord server!
 * @param {Game.Object} building Game.Object to calculate maximum buy count of
 * @returns {number} Maximum number of this building that can be bought
 */
declare function quickCalcMaxBuy(building: Game.Object, scaling?: number): number;
/**
 * Calculates the price of buying buildings in O(1) time.
 * Starts from the current number of buildings.
 * @param {Game.Object} building Building to calculate price of
 * @param {number} bulk Number of buildings to buy
 * @param {boolean} sell Whether to instead calculate selling the buildings
 * @returns {number} Amount of cookies this many buildings is worth
 */
declare function quickCalcBulkPrice(building: Game.Object, bulk: number, scaling?: number, sell?: boolean): number;
/**
 *
 * @param {number} x Base
 * @param {number} start Starting exponent
 * @param {number} end Ending exponent
 * @returns {number} Sum of exponents x^start to x^end, inclusive
 */
declare function powerSumRange(x: number, start: number, end: number): number;
/**
 * Returns the progress of a cycle, starting from Jan 1, 1970, 00:00:00, UTC time.
 * @param {number} interval Length of cycle in hours
 * @param {boolean} zoned Whether to offset the cycle as though it were GMT+1 time
 * @returns {number} Rotation of current cycle in radians
 */
declare function cycliusCalc(interval: number, zoned?: boolean): number;
/**
 * Loads data from an object into another object.
 * @param {object} data Data to be loaded from
 * @param {object} into Object to load data into
 */
declare function loadData(data: object, into: object): void;
/**
 * Switches the milk selector's icon to the given milk type
 * @param {number} milkID
 */
declare function switchMilkIcon(milkID: number): void;
/**
 * Gets the number of grandmas from this building's synergy upgrade.
 * @param {Game.Object} building
 * @returns {number} Number of synergy grandmas
 */
declare function getNumSynergyGrandmas(building: Game.Object): number;
/**
 * Instantly applies the given amount of passive CpS.
 * This includes updating wrinkler bellies and building stats.
 * Used by the revamped Cursed Finger.
 * @param {number} seconds
 */
declare function gainInstantPassiveCpS(seconds: number): void;
/**
 * Changes the overflowY styling of the center scrollbar
 * @param style overflowY styling to use
 */
declare function scrollbarStyle(style: string): void;
/**
 * Performs the given function when the given building's minigame has loaded
 * @param obj Name of building
 * @param func Function to run
 */
declare function onMinigameLoaded(obj: string, func: () => void): void;
/**
 * Queues loading of a custom image asset
 * @param img URL of image to load
 */
declare function loadCustomAsset(img: string): void;
/** Returns whether the given button is being held */
declare function holdingButton(btn: ButtonType): number;
/** Whether the mouse is within a given rectangle. Used for UpdateWrinklers */
declare function inRect(x: number, y: number, rect: any): boolean;

type _Util_ButtonType = ButtonType;
declare const _Util_ButtonType: typeof ButtonType;
declare const _Util_calcMaxBuyBulk: typeof calcMaxBuyBulk;
declare const _Util_quickCalcMaxBuy: typeof quickCalcMaxBuy;
declare const _Util_quickCalcBulkPrice: typeof quickCalcBulkPrice;
declare const _Util_powerSumRange: typeof powerSumRange;
declare const _Util_cycliusCalc: typeof cycliusCalc;
declare const _Util_loadData: typeof loadData;
declare const _Util_switchMilkIcon: typeof switchMilkIcon;
declare const _Util_getNumSynergyGrandmas: typeof getNumSynergyGrandmas;
declare const _Util_gainInstantPassiveCpS: typeof gainInstantPassiveCpS;
declare const _Util_scrollbarStyle: typeof scrollbarStyle;
declare const _Util_onMinigameLoaded: typeof onMinigameLoaded;
declare const _Util_loadCustomAsset: typeof loadCustomAsset;
declare const _Util_holdingButton: typeof holdingButton;
declare const _Util_inRect: typeof inRect;
declare namespace _Util {
  export {
    _Util_ButtonType as ButtonType,
    _Util_calcMaxBuyBulk as calcMaxBuyBulk,
    _Util_quickCalcMaxBuy as quickCalcMaxBuy,
    _Util_quickCalcBulkPrice as quickCalcBulkPrice,
    _Util_powerSumRange as powerSumRange,
    _Util_cycliusCalc as cycliusCalc,
    _Util_loadData as loadData,
    _Util_switchMilkIcon as switchMilkIcon,
    _Util_getNumSynergyGrandmas as getNumSynergyGrandmas,
    _Util_gainInstantPassiveCpS as gainInstantPassiveCpS,
    _Util_scrollbarStyle as scrollbarStyle,
    _Util_onMinigameLoaded as onMinigameLoaded,
    _Util_loadCustomAsset as loadCustomAsset,
    _Util_holdingButton as holdingButton,
    _Util_inRect as inRect,
  };
}

declare function customOptionsMenu(): void;

declare const _Config_customOptionsMenu: typeof customOptionsMenu;
declare namespace _Config {
  export {
    _Config_customOptionsMenu as customOptionsMenu,
  };
}

declare class Patch {
    patchFunc: () => void;
    removeFunc: () => void;
    applied: boolean;
    constructor(patchFunc: () => void, removeFunc?: () => void);
    apply(): void;
    remove(): void;
    toggle(force?: boolean): void;
}
/** Toggles the center view's scrollbar style */
declare let scrollbarStyle$1: Patch;
/** Patches DrawBuildings to perform the smoothBuildings setting */
declare let smoothBuildings: Patch;
/**
 * Patches buildings to support the scroll feature.
 * Also contains the necessary patches for BYGTWD.
 * Because reasons.
 */
declare let scrollingBuildings: Patch;
/** Patches building tooltips to look a bit better in some cases */
declare let buildingTooltips: Patch;
/** Patches buff tooltips to show remaining time */
declare let buffTooltips: Patch;
/**
 * Adds a line break to grandma synergy upgrades
 * Fixes the ordering of grandma upgrades in the stats menu
 * Makes Script grannies trigger a redraw when bought
 */
declare let miscGrandmaFixes: Patch;
/** Adds support for Tech and Seasonal upgrade categories */
declare let statsUpgradeCategories: Patch;
/** Enables displaying seasonal unlock sources */
declare let displaySeasonUnlock: Patch;
/** Allows disabling the Skruuia wrinkler popping bonus */
declare let skruuiaRebalance: Patch;
/**
 * Reworks Cursed Finger a bit
 * - Removes the "snapshotting" behavior
 * - Gain seconds of true passive CpS
 */
declare let cursedFingerTweaks: Patch;
/** Enable tooltip wobbling */
declare let tooltipWobble: Patch;
/** Replaces cyclius gain function with our own */
declare let cycliusGains: Patch;
/** Displays information about how much you bought your stocks for */
declare let stockInfo: Patch;
/** Allows buildings to bypass the Fancy graphics setting */
declare let fancyBuildings: Patch;
/** Allows cursors to bypass the Fancy graphics setting */
declare let fancyCursors: Patch;
/** Allows wrinklers to bypass the Fancy graphics setting */
declare let fancyWrinklers: Patch;
/**
 * Properly displays the (seemingly intended) feature of partial buying in bulk.
 * Also makes the ALL button worth ALL, not 1000
 * Also allows using the ALL button in buy mode.
 */
declare let buySellBulk: Patch;
/** Updates the bulk buy selection for when the option is toggled */
declare let updateBulkAll: () => void;
/**
 * Fix stock market to use established cookie manipulation options
 * You can now lose some of your earned cookies this way - or gain them!
 */
declare let dangerousStocks: Patch;
/** Adds a displayed value for each of Cyclius' cycles. */
declare let cycliusInfo: Patch;
declare let toggleCyclius: () => void;
/** Miscellaneous performance enhancements */
declare let optiCookies: Patch;
declare let dangerousBrokers: Patch;
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
declare let heavenlyCookies: Patch;
declare let buildingPriceBuff: Patch;

type _Patches_Patch = Patch;
declare const _Patches_Patch: typeof Patch;
declare const _Patches_smoothBuildings: typeof smoothBuildings;
declare const _Patches_scrollingBuildings: typeof scrollingBuildings;
declare const _Patches_buildingTooltips: typeof buildingTooltips;
declare const _Patches_buffTooltips: typeof buffTooltips;
declare const _Patches_miscGrandmaFixes: typeof miscGrandmaFixes;
declare const _Patches_statsUpgradeCategories: typeof statsUpgradeCategories;
declare const _Patches_displaySeasonUnlock: typeof displaySeasonUnlock;
declare const _Patches_skruuiaRebalance: typeof skruuiaRebalance;
declare const _Patches_cursedFingerTweaks: typeof cursedFingerTweaks;
declare const _Patches_tooltipWobble: typeof tooltipWobble;
declare const _Patches_cycliusGains: typeof cycliusGains;
declare const _Patches_stockInfo: typeof stockInfo;
declare const _Patches_fancyBuildings: typeof fancyBuildings;
declare const _Patches_fancyCursors: typeof fancyCursors;
declare const _Patches_fancyWrinklers: typeof fancyWrinklers;
declare const _Patches_buySellBulk: typeof buySellBulk;
declare const _Patches_updateBulkAll: typeof updateBulkAll;
declare const _Patches_dangerousStocks: typeof dangerousStocks;
declare const _Patches_cycliusInfo: typeof cycliusInfo;
declare const _Patches_toggleCyclius: typeof toggleCyclius;
declare const _Patches_optiCookies: typeof optiCookies;
declare const _Patches_dangerousBrokers: typeof dangerousBrokers;
declare const _Patches_heavenlyCookies: typeof heavenlyCookies;
declare const _Patches_buildingPriceBuff: typeof buildingPriceBuff;
declare namespace _Patches {
  export {
    _Patches_Patch as Patch,
    scrollbarStyle$1 as scrollbarStyle,
    _Patches_smoothBuildings as smoothBuildings,
    _Patches_scrollingBuildings as scrollingBuildings,
    _Patches_buildingTooltips as buildingTooltips,
    _Patches_buffTooltips as buffTooltips,
    _Patches_miscGrandmaFixes as miscGrandmaFixes,
    _Patches_statsUpgradeCategories as statsUpgradeCategories,
    _Patches_displaySeasonUnlock as displaySeasonUnlock,
    _Patches_skruuiaRebalance as skruuiaRebalance,
    _Patches_cursedFingerTweaks as cursedFingerTweaks,
    _Patches_tooltipWobble as tooltipWobble,
    _Patches_cycliusGains as cycliusGains,
    _Patches_stockInfo as stockInfo,
    _Patches_fancyBuildings as fancyBuildings,
    _Patches_fancyCursors as fancyCursors,
    _Patches_fancyWrinklers as fancyWrinklers,
    _Patches_buySellBulk as buySellBulk,
    _Patches_updateBulkAll as updateBulkAll,
    _Patches_dangerousStocks as dangerousStocks,
    _Patches_cycliusInfo as cycliusInfo,
    _Patches_toggleCyclius as toggleCyclius,
    _Patches_optiCookies as optiCookies,
    _Patches_dangerousBrokers as dangerousBrokers,
    _Patches_heavenlyCookies as heavenlyCookies,
    _Patches_buildingPriceBuff as buildingPriceBuff,
  };
}

interface Vars {
    lastMilk: number;
    lastAutoMilk: any;
    buffsById: Game.Buff[];
    cursedPs: number;
    cursedPsMult: number;
    ascendMeterLevel: number;
    ascendMeterPercent: number;
    levelDiff: number;
    patchedTrueCyclius: boolean;
    prevShortcut: 0 | 1 | 2 | 3;
    GetBuffTooltipFunc?: Function;
    prestigeCookies: Record<string, boolean>;
    skipModifyPrice: boolean;
    bannedGrandmas: Record<string, boolean>;
}

declare global {
    interface Window {
        Spice: any;
        SimpleBeautify: Function;
    }
}
declare class RoutineFunction {
    func: () => void;
    enabled: () => boolean;
    constructor(func: () => void, enabled?: () => boolean);
}
declare class Routine {
    routines: Record<string, RoutineFunction>;
    constructor(routines?: Record<string, RoutineFunction>);
    run(): void;
    register(name: string, func: () => void): void;
}
declare class RoutineCollection implements Record<string, RoutineFunction> {
    [routine: string]: RoutineFunction;
}
declare class LogicRoutineCollection extends RoutineCollection {
    /**
     * Very fancy ascend meter
     * Basically has to recalculate everything. Thanks game.
     * At least there's no loops involved so it's not too slow.
     */
    improveAscendMeter: RoutineFunction;
    /**
     * If enabled, Skruuia modifies wrinkler cookie consumption.
     * This increases the amount of cookies that get multiplied by the wrinklers.
     * Mathematically it's the same, but needs Skruuia to stay slotted in.
     */
    updateSkruuiaRebalance: RoutineFunction;
    /** In enhanced bulk mode, refresh store every 10 frames */
    bulkStoreRefresh: RoutineFunction;
}
declare class LogicRoutine extends Routine {
    routines: LogicRoutineCollection;
}
declare let logicRoutine: LogicRoutine;
declare class DrawRoutineCollection extends RoutineCollection {
    /** Update icon of milk selector when switching milk types */
    updateMilkIcon: RoutineFunction;
    /** Fixes the graphics on the grimoire magic meter */
    grimoireMeterFix: RoutineFunction;
    /** Rotates Cyclius along with his current cycle */
    trueCyclius: RoutineFunction;
}
declare class DrawRoutine extends Routine {
    routines: DrawRoutineCollection;
}
declare let drawRoutine: DrawRoutine;
declare class ResetRoutineCollection extends RoutineCollection {
    /** Resets the save-specific data */
    resetSaveData: RoutineFunction;
    /** Sets the scroll of all buildings to 0 */
    resetScroll: RoutineFunction;
}
declare class ResetRoutine extends Routine {
    routines: ResetRoutineCollection;
}
declare let resetRoutine: ResetRoutine;

declare const _Routines_logicRoutine: typeof logicRoutine;
declare const _Routines_drawRoutine: typeof drawRoutine;
declare const _Routines_resetRoutine: typeof resetRoutine;
declare namespace _Routines {
  export {
    _Routines_logicRoutine as logicRoutine,
    _Routines_drawRoutine as drawRoutine,
    _Routines_resetRoutine as resetRoutine,
  };
}

interface Icon {
    frame: number;
    /** ID of the image (should be unique) */
    id: number;
    /** Asset name to use */
    pic: string;
    /** Horizontal offset */
    x: number;
    /** Vertical offset */
    y: number;
    /** Depth offset */
    z: number;
    /** Whether this image is a hoverable grandma */
    grandma?: boolean;
}
/** Defines synergy grandma drawing behavior */
interface Properties {
    /** Building to tie in with */
    building: Game.Object;
    /**
     * Buildings-to-grandmas ratio
     * If this is less than 1, draw more per building
     * If this is greater than 1, draw less per building
     *
     * Must be greater than 0
     */
    frequency?: number;
    /**
     * @param {Icon} basePic Base building icon, for positioning grandmas
     * @param {number} id Unique identifier for this particular grandma
     * @returns {Icon|Icon[]} New images to draw for the drawn grandma
     */
    drawGrandma: (basePic: Icon, id: number) => Icon | Icon[];
}
/**
 * Registers support for a custom Bring Grandma to Work Day display
 *
 * @param props Grandma support properties
 * @param granToBan Grandma sprite to disallow appearing in normal grandma building
 */
declare function registerSupport(props: Properties, granToBan?: string): void;
/**
 * Attempts to draw a synergy grandma on supported buildings.
 *
 * @param building Building to draw grandmas on
 * @param basePic Base building sprite
 * @param id Which building this is
 * @returns Grandma icons to draw
 */
declare function tryDrawGrandmas(building: Game.Object, basePic: Icon, id: number): Icon[];
declare let grandmaProperties: Record<string, Properties>;

type _GrandmaSupport_Icon = Icon;
type _GrandmaSupport_Properties = Properties;
declare const _GrandmaSupport_registerSupport: typeof registerSupport;
declare const _GrandmaSupport_tryDrawGrandmas: typeof tryDrawGrandmas;
declare const _GrandmaSupport_grandmaProperties: typeof grandmaProperties;
declare namespace _GrandmaSupport {
  export {
    _GrandmaSupport_Icon as Icon,
    _GrandmaSupport_Properties as Properties,
    _GrandmaSupport_registerSupport as registerSupport,
    _GrandmaSupport_tryDrawGrandmas as tryDrawGrandmas,
    _GrandmaSupport_grandmaProperties as grandmaProperties,
  };
}

declare let name: string;
declare let version: string;
declare let Util: typeof _Util;
declare let Config: typeof _Config;
declare let Patches: typeof _Patches;
declare let Logger: typeof _Logger;
declare let Routines: typeof _Routines;
declare let GrandmaSupport: typeof _GrandmaSupport;
declare let vars: Vars;
declare let settings: Settings;
declare let saveData: SaveData;
declare let mod: Game.Mod;

declare const OmniCookies_name: typeof name;
declare const OmniCookies_version: typeof version;
declare const OmniCookies_Util: typeof Util;
declare const OmniCookies_Config: typeof Config;
declare const OmniCookies_Patches: typeof Patches;
declare const OmniCookies_Logger: typeof Logger;
declare const OmniCookies_Routines: typeof Routines;
declare const OmniCookies_GrandmaSupport: typeof GrandmaSupport;
declare const OmniCookies_vars: typeof vars;
declare const OmniCookies_settings: typeof settings;
declare const OmniCookies_saveData: typeof saveData;
declare const OmniCookies_mod: typeof mod;
declare namespace OmniCookies {
  export {
    OmniCookies_name as name,
    OmniCookies_version as version,
    OmniCookies_Util as Util,
    OmniCookies_Config as Config,
    OmniCookies_Patches as Patches,
    OmniCookies_Logger as Logger,
    OmniCookies_Routines as Routines,
    OmniCookies_GrandmaSupport as GrandmaSupport,
    OmniCookies_vars as vars,
    OmniCookies_settings as settings,
    OmniCookies_saveData as saveData,
    OmniCookies_mod as mod,
  };
}

declare global {
    interface Window {
        OmniCookies: typeof OmniCookies;
    }
}
declare let OmniCookiesExport: typeof OmniCookies;

export default OmniCookiesExport;
