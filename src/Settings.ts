import { version } from "./Vars";
import { loadData } from "./Util";

export enum BypassFancySetting {
	Default, Fast, Fancy
}

export enum CursorStyleSetting {
	Default,
	Dark,
	Retro,
	DarkRetro,
	Plain,
	Tiered
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
	buildingsBypassFancy: BypassFancySetting

	/** How cursors will override the Fancy setting */
	cursorsBypassFancy: BypassFancySetting

	/** How wrinklers will override the Fancy setting */
	wrinklersBypassFancy: BypassFancySetting

	/** Whether buildings will attempt to skip unnecessary frames */
	optimizeBuildings: boolean

	/** Whether to attempt to restore wrinklers to exact specifications */
	preserveWrinklers: boolean

	/** Whether to show Cyclius' cycles in his tooltip */
	detailedCyclius: boolean

	/** Whether to offset Cyclius as though it were always GMT+1 time */
	zonedCyclius: boolean

	/** Whether to make Cyclius' sprite rotate with his cycles */
	trueCyclius: boolean

	/** Whether to display information about average bought stock values */
	stockValueData: boolean

	/** Whether buying or selling on the stock market will affect total cookies baked */
	dangerousStocks: boolean

	/** Whether to use the tooltip wobble animation */
	tooltipWobble: boolean

	/** Whether the milk selector's icon will reflect the current milk */
	fancyMilkSelect: boolean

	/** Whether to apply slight graphical improvements to the Grimoire's magic meter */
	improveMagicMeter: boolean

	/** Whether Skruuia's bonus should affect wrinkler suck rate rather than wrinkler pop multiplier */
	skruuiaRebalance: boolean

	/** Whether to apply a graphical overhaul to the ascend meter */
	improveAscendMeter: boolean

	/** Whether to display seasonal requirements on related upgrades */
	displaySeasons: boolean

	/** Whether to give seasonal upgrades their own stats category */
	separateSeasons: boolean

	/** Whether to show grandmas at work */
	bringGrandmaToWork: boolean

	/**
	 * Whether to rework Cursed Finger to:
	 * - Not snapshot
	 * - Count as true passive CpS
	 */
	cursedFinger: boolean

	/** Whether to apply experimental performance enhancements */
	optiCookies: boolean

	/** Whether to make stock brokers decrease Stock Market profits */
	dangerousBrokers: boolean

	/** Whether to allow certain heavenly upgrades to add their icons to the cookie pool */
	heavenlyCookies: boolean

	/** Whether to make building price multipliers instead affect the price scaling */
	buildingPriceBuff: boolean

	/** Exponent of 10 to aim for when the ascend meter fills */
	//ascendMeterPrecision: number

	/** Whether to fix the positioning of Timer.say for Game.Draw */
	drawTimerFix: boolean

	/** Whether to use an alternative stock market layout */
	alternateStockMarket: boolean

	/** Selected cursor style */
	colorfulCursors: CursorStyleSetting

	/** Initializes to the default settings */
	constructor() {
		this.version = version;
		this.autoScrollbar = true;
		this.scrollingBuildings = true;
		this.smoothBuildings = true;
		this.buffTooltipDuration = true;
		this.betterBuildingTooltips = true;
		this.betterGrandmas = true;
		this.separateTechs = true;
		this.enhancedBulk = true;
		this.buildingsBypassFancy = BypassFancySetting.Default;
		this.cursorsBypassFancy = BypassFancySetting.Default;
		this.wrinklersBypassFancy = BypassFancySetting.Default;
		this.optimizeBuildings = false;
		this.preserveWrinklers = false;
		this.detailedCyclius = true;
		this.zonedCyclius = false;
		this.trueCyclius = false;
		this.stockValueData = true;
		this.dangerousStocks = false;
		this.tooltipWobble = false;
		this.fancyMilkSelect = true;
		this.improveMagicMeter = true;
		this.skruuiaRebalance = false;
		this.improveAscendMeter = true;
		this.displaySeasons = true;
		this.separateSeasons = false;
		this.bringGrandmaToWork = true;
		this.cursedFinger = false;
		this.optiCookies = false;
		this.dangerousBrokers = false;
		this.heavenlyCookies = true;
		this.buildingPriceBuff = false;
		//this.ascendMeterPrecision = 0;
		this.drawTimerFix = false;
		this.alternateStockMarket = false;
		this.colorfulCursors = CursorStyleSetting.Default;
	}

	set(setting: string, value: any) {
		if(typeof value == typeof this[setting]) this[setting] = value;
	}

	get(setting: string) {
		return this[setting];
	}

	save() {
		return this;
	}

	load(obj: Settings) {
		if(!obj.version) return;
		// In the future, if settings change, test against save version
		else {
			loadData(obj, this);
		}
	}
}

export let settings = new Settings();