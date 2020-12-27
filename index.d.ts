declare module 'omnicookies/Config' {
  export function customOptionsMenu(): void;

}
declare module 'omnicookies/GrandmaSupport' {
  /// <reference types="cookieclicker" />
  export interface Icon {
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
  export interface Properties {
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
  export function registerSupport(props: Properties, granToBan?: string): void;
  /**
   * Attempts to draw a synergy grandma on supported buildings.
   *
   * @param building Building to draw grandmas on
   * @param basePic Base building sprite
   * @param id Which building this is
   * @returns Grandma icons to draw
   */
  export function tryDrawGrandmas(building: Game.Object, basePic: Icon, id: number): Icon[];
  export let grandmaProperties: Record<string, Properties>;

}
declare module 'omnicookies/index' {
  global {
      interface Window {
          OmniCookies: object;
      }
  }
  let OmniCookiesExport: any;
  export default OmniCookiesExport;

}
declare module 'omnicookies/Logger' {
  export function log(message: any): void;
  export function warn(message: any): void;
  export function error(message: any): void;

}
declare module 'omnicookies/OmniCookies' {
  /// <reference types="cookieclicker" />
  import * as _Logger from 'omnicookies/Logger';
  import * as _Util from 'omnicookies/Util';
  import * as _Config from 'omnicookies/Config';
  import * as _Patches from 'omnicookies/Patches';
  import * as _Vars from "omnicookies/Vars";
  import * as _Routines from "omnicookies/Routines";
  import * as _GrandmaSupport from "omnicookies/GrandmaSupport";
  export let name: string;
  export let version: string;
  export let Util: typeof _Util;
  export let Config: typeof _Config;
  export let Patches: typeof _Patches;
  export let Logger: typeof _Logger;
  export let Routines: typeof _Routines;
  export let GrandmaSupport: typeof _GrandmaSupport;
  export let vars: _Vars.Vars;
  export let settings: import("omnicookies/Settings").Settings;
  export let saveData: import("omnicookies/SaveData").SaveData;
  export let mod: Game.Mod;

}
declare module 'omnicookies/Patches' {
  export class Patch {
      patchFunc: () => void;
      removeFunc: () => void;
      applied: boolean;
      constructor(patchFunc: () => void, removeFunc?: () => void);
      apply(): void;
      remove(): void;
      toggle(force?: boolean): void;
  }
  /** Toggles the center view's scrollbar style */
  export let scrollbarStyle: Patch;
  /** Patches DrawBuildings to perform the smoothBuildings setting */
  export let smoothBuildings: Patch;
  /**
   * Patches buildings to support the scroll feature.
   * Also contains the necessary patches for BYGTWD.
   * Because reasons.
   */
  export let scrollingBuildings: Patch;
  /** Patches building tooltips to look a bit better in some cases */
  export let buildingTooltips: Patch;
  /** Patches buff tooltips to show remaining time */
  export let buffTooltips: Patch;
  /**
   * Adds a line break to grandma synergy upgrades
   * Fixes the ordering of grandma upgrades in the stats menu
   * Makes Script grannies trigger a redraw when bought
   */
  export let miscGrandmaFixes: Patch;
  /** Adds support for Tech and Seasonal upgrade categories */
  export let statsUpgradeCategories: Patch;
  /** Enables displaying seasonal unlock sources */
  export let displaySeasonUnlock: Patch;
  /** Allows disabling the Skruuia wrinkler popping bonus */
  export let skruuiaRebalance: Patch;
  /**
   * Reworks Cursed Finger a bit
   * - Removes the "snapshotting" behavior
   * - Gain seconds of true passive CpS
   */
  export let cursedFingerTweaks: Patch;
  /** Enable tooltip wobbling */
  export let tooltipWobble: Patch;
  /** Replaces cyclius gain function with our own */
  export let cycliusGains: Patch;
  /** Displays information about how much you bought your stocks for */
  export let stockInfo: Patch;
  /** Allows buildings to bypass the Fancy graphics setting */
  export let fancyBuildings: Patch;
  /** Allows cursors to bypass the Fancy graphics setting */
  export let fancyCursors: Patch;
  /** Allows wrinklers to bypass the Fancy graphics setting */
  export let fancyWrinklers: Patch;
  /**
   * Properly displays the (seemingly intended) feature of partial buying in bulk.
   * Also makes the ALL button worth ALL, not 1000
   * Also allows using the ALL button in buy mode.
   */
  export let buySellBulk: Patch;
  /** Updates the bulk buy selection for when the option is toggled */
  export let updateBulkAll: () => void;
  /**
   * Fix stock market to use established cookie manipulation options
   * You can now lose some of your earned cookies this way - or gain them!
   */
  export let dangerousStocks: Patch;
  /** Adds a displayed value for each of Cyclius' cycles. */
  export let cycliusInfo: Patch;
  export let toggleCyclius: () => void;
  /** Miscellaneous performance enhancements */
  export let optiCookies: Patch;
  export let dangerousBrokers: Patch;
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
  export let heavenlyCookies: Patch;
  export let buildingPriceBuff: Patch;

}
declare module 'omnicookies/Routines' {
  global {
      interface Window {
          Spice: any;
          SimpleBeautify: Function;
      }
  }
  class RoutineFunction {
      func: () => void;
      enabled: () => boolean;
      constructor(func: () => void, enabled?: () => boolean);
  }
  class Routine {
      routines: Record<string, RoutineFunction>;
      constructor(routines?: Record<string, RoutineFunction>);
      run(): void;
      register(name: string, func: () => void): void;
  }
  class RoutineCollection implements Record<string, RoutineFunction> {
      [routine: string]: RoutineFunction;
  }
  class LogicRoutineCollection extends RoutineCollection {
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
  class LogicRoutine extends Routine {
      routines: LogicRoutineCollection;
  }
  export let logicRoutine: LogicRoutine;
  class DrawRoutineCollection extends RoutineCollection {
      /** Update icon of milk selector when switching milk types */
      updateMilkIcon: RoutineFunction;
      /** Fixes the graphics on the grimoire magic meter */
      grimoireMeterFix: RoutineFunction;
      /** Rotates Cyclius along with his current cycle */
      trueCyclius: RoutineFunction;
  }
  class DrawRoutine extends Routine {
      routines: DrawRoutineCollection;
  }
  export let drawRoutine: DrawRoutine;
  class ResetRoutineCollection extends RoutineCollection {
      /** Resets the save-specific data */
      resetSaveData: RoutineFunction;
      /** Sets the scroll of all buildings to 0 */
      resetScroll: RoutineFunction;
  }
  class ResetRoutine extends Routine {
      routines: ResetRoutineCollection;
  }
  export let resetRoutine: ResetRoutine;
  export {};

}
declare module 'omnicookies/SaveData' {
  /// <reference types="cookieclicker" />
  interface StockAverage {
      avgValue: number;
      totalValue: number;
  }
  export class SaveData {
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
  export let saveData: SaveData;
  export {};

}
declare module 'omnicookies/Settings' {
  export enum BypassFancySetting {
      Default = 0,
      Fast = 1,
      Fancy = 2
  }
  export class Settings {
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
  export let settings: Settings;

}
declare module 'omnicookies/Util' {
  /// <reference types="cookieclicker" />
  export enum ButtonType {
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
  export function calcMaxBuyBulk(building: Game.Object, amount: number, scaling?: number): BuyBulkData;
  /**
   * Calculates the maximum number of buildings that can be currently bought in O(1) time.
   * Thanks to staticvariablejames on the Discord server!
   * @param {Game.Object} building Game.Object to calculate maximum buy count of
   * @returns {number} Maximum number of this building that can be bought
   */
  export function quickCalcMaxBuy(building: Game.Object, scaling?: number): number;
  /**
   * Calculates the price of buying buildings in O(1) time.
   * Starts from the current number of buildings.
   * @param {Game.Object} building Building to calculate price of
   * @param {number} bulk Number of buildings to buy
   * @param {boolean} sell Whether to instead calculate selling the buildings
   * @returns {number} Amount of cookies this many buildings is worth
   */
  export function quickCalcBulkPrice(building: Game.Object, bulk: number, scaling?: number, sell?: boolean): number;
  /**
   *
   * @param {number} x Base
   * @param {number} start Starting exponent
   * @param {number} end Ending exponent
   * @returns {number} Sum of exponents x^start to x^end, inclusive
   */
  export function powerSumRange(x: number, start: number, end: number): number;
  /**
   * Returns the progress of a cycle, starting from Jan 1, 1970, 00:00:00, UTC time.
   * @param {number} interval Length of cycle in hours
   * @param {boolean} zoned Whether to offset the cycle as though it were GMT+1 time
   * @returns {number} Rotation of current cycle in radians
   */
  export function cycliusCalc(interval: number, zoned?: boolean): number;
  /**
   * Loads data from an object into another object.
   * @param {object} data Data to be loaded from
   * @param {object} into Object to load data into
   */
  export function loadData(data: object, into: object): void;
  /**
   * Switches the milk selector's icon to the given milk type
   * @param {number} milkID
   */
  export function switchMilkIcon(milkID: number): void;
  /**
   * Gets the number of grandmas from this building's synergy upgrade.
   * @param {Game.Object} building
   * @returns {number} Number of synergy grandmas
   */
  export function getNumSynergyGrandmas(building: Game.Object): number;
  /**
   * Instantly applies the given amount of passive CpS.
   * This includes updating wrinkler bellies and building stats.
   * Used by the revamped Cursed Finger.
   * @param {number} seconds
   */
  export function gainInstantPassiveCpS(seconds: number): void;
  /**
   * Changes the overflowY styling of the center scrollbar
   * @param style overflowY styling to use
   */
  export function scrollbarStyle(style: string): void;
  /**
   * Performs the given function when the given building's minigame has loaded
   * @param obj Name of building
   * @param func Function to run
   */
  export function onMinigameLoaded(obj: string, func: () => void): void;
  /**
   * Queues loading of a custom image asset
   * @param img URL of image to load
   */
  export function loadCustomAsset(img: string): void;
  /** Returns whether the given button is being held */
  export function holdingButton(btn: ButtonType): number;
  /** Whether the mouse is within a given rectangle. Used for UpdateWrinklers */
  export function inRect(x: number, y: number, rect: any): boolean;
  export {};

}
declare module 'omnicookies/Vars' {
  /// <reference types="cookieclicker" />
  export let name: string;
  export let version: string;
  export interface Vars {
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
  export let vars: Vars;

}
declare module 'omnicookies' {
  import main = require('omnicookies/index');
  export = main;
}