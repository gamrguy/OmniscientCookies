import { saveData as _saveData } from "./SaveData"
import { settings as _settings } from "./Settings"
import * as _Logger from './Logger'
import * as _Util from './Util'
import * as _Config from './Config'
import * as _Patches from './Patches'
import * as _Vars from "./Vars"
import * as _Routines from "./Routines"
import * as _GrandmaSupport from "./GrandmaSupport"
import Cppkies from 'cppkies'

export let name = _Vars.name
export let version = _Vars.version

export let Util = _Util
export let Config = _Config
export let Patches = _Patches
export let Logger = _Logger
export let Routines = _Routines
export let GrandmaSupport = _GrandmaSupport

export let vars = _Vars.vars
export let settings = _settings
export let saveData = _saveData

//#region easter eggs lul
let grandmaDesc = [
	choose([`nice grandmas`, `hard-working grandmas`, `old ladies`]),
	`farmers`,
	`miners`,
	`workers`,
	choose([`bankers`, `brokers`, `financial advisors`, `accountants`]),
	`priestesses`,
	`witches`,
	choose([`aliens`, `bounty hunters`, `spice traders`, `kessel runners`]),
	choose([`full-cookie alchemists`, `golden grans`]),
	choose([`elder abominations`, `flesh piles`, `doughy beings`]),
	choose([`time policemas`, `nice old lady's nice old ladies`]),
	`antimatter constructs`,
	`living rainbows`,
	`leprechauns`,
	`Cyriak wannabes`,
	choose([`NaNnies`, `[Error: cookie is not defined]s`, `['g','r','a','n']s`]),
	choose([`spaghetti bakers`, `pancake flippers`, `not-cookie productionists`, `pastry panhandlers`])
]
let buildingChoice = choose(Game.ObjectsById.slice(0, 18)); //no modded buildings sorry
if(buildingChoice == Game.Objects['Cursor']) buildingChoice = Game.Objects['Grandma'];
let numGrandmas = 0;
if(buildingChoice == Game.Objects['Grandma']) numGrandmas = Game.Objects['Grandma'].amount;
else numGrandmas = Util.getNumSynergyGrandmas(buildingChoice);
let grandmaMessage = `Your <b>${numGrandmas} ${grandmaDesc[buildingChoice.id-1]}</b> missed you!`
if(buildingChoice.amount == 0 || numGrandmas <= 0) {
	grandmaMessage = `. . . but nobody came`
}
let startupMessages = [
	`And then he said,<br>'Let there be cookies'`,
	`Some dude called ${choose(['theGameMaster1234', 'RobotLucca', 'gamrguy', 'theMineMaster2', 'DeadlyFez'])} made this`,
	`That ascend meter was getting antsy`,
	grandmaMessage,
	`The cookies have eyes.<br>Watch yourself out there`,
	`Over the river and through the cookies`,
	//`Originally, the name was referring to the building scroll feature, which was the first feature I made. Now it probably more accurately refers to the large and slightly random scope of this mod. Despite this I don't think the name is going to change anytime soon, so you had better get used to it. I wonder if anyone can read this fast? If you're reading this and can, how's your day been? It's lonely back here.`,
	`Thank you for choosing the ${choose(['Typescript', 'Cppkies'])} edition of Omniscient Cookies!<br>(No warranties, no refunds)`,
	`What do Omniscient Cookies taste like?<br>Study reveals a flavor 'somewhere between amateur Javascript and messy programming'`,
	`Also try <a href="https://github.com/staticvariablejames/SpicedCookies/" target="_blank">Spiced Cookies</a>!`,
	`You stared into the cookie,<br>and the cookie stared back`,
	`Check out the <a href="https://github.com/gamrguy/OmniscientCookies/" target="_blank">GitHub page</a>!`
]
//#endregion

export let mod: Game.Mod = {
	init: function() {
		Patches.smoothBuildings.apply();
		Patches.scrollingBuildings.apply();
		Patches.buffTooltips.apply();
		Patches.tooltipWobble.apply();
		Patches.cycliusGains.apply();
		Patches.stockInfo.apply();
		Patches.fancyBuildings.apply();
		Patches.fancyCursors.apply();
		Patches.fancyWrinklers.apply();
		Patches.skruuiaRebalance.apply();
		Patches.dangerousStocks.apply();
		Patches.cycliusInfo.apply();

		Cppkies.on('draw', () => Routines.drawRoutine.run());
		Cppkies.on('logic', () => Routines.logicRoutine.run());
		Cppkies.on('reset', () => Routines.resetRoutine.run());
		Cppkies.on('optionsMenu', () => Config.customOptionsMenu());

		Game.Notify(`Loaded ${name} ${version}`, '<q>' + choose(startupMessages) + '</q>', [10, 31], 6);
	},
	
	save: function() {
		return JSON.stringify({
			settings: settings.save(),
			saveData: saveData.save()
		});
	},
	
	load: function(str) {
		let data = JSON.parse(str);
		settings.load(data.settings);
		saveData.load(data.saveData);
	
		Patches.buySellBulk.apply();
	
		Patches.scrollbarStyle.toggle(settings.autoScrollbar);
		Patches.buildingTooltips.toggle(settings.betterBuildingTooltips);
		Patches.miscGrandmaFixes.toggle(settings.betterGrandmas);
		Patches.cursedFingerTweaks.toggle(settings.cursedFinger);
		Patches.displaySeasonUnlock.toggle(settings.displaySeasons);
		Patches.statsUpgradeCategories.toggle(settings.separateTechs || settings.separateSeasons);
		Patches.optiCookies.toggle(settings.optiCookies);
		Patches.dangerousBrokers.toggle(settings.dangerousBrokers);
		Patches.heavenlyCookies.toggle(settings.heavenlyCookies);
		Patches.buildingPriceBuff.toggle(settings.buildingPriceBuff);
	}
}