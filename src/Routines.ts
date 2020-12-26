import * as Util from './Util'
import { saveData } from './SaveData'
import { settings } from './Settings'
import { vars } from './Vars'

declare global {
	interface Window {
		Spice: any
		SimpleBeautify: Function // WHYYYYYYYYYYYYY
	}
}

class RoutineFunction {
	func: () => void
	enabled: () => boolean
	constructor(func: () => void, enabled: () => boolean = function() { return true; }) {
		this.func = func;
		this.enabled = enabled;
	}
}

class Routine {
	routines: Record<string, RoutineFunction>
	constructor(routines: Record<string, RoutineFunction> = {}) { this.routines = routines }
	run() {
		for(let r in this.routines) {
			if(this.routines[r].enabled && this.routines[r].enabled()) {
				this.routines[r].func();
			}
		}
	}
	register(name: string, func: () => void) {
		this.routines[name] = new RoutineFunction(func);
	}
}

class RoutineCollection implements Record<string, RoutineFunction> {
	[routine: string]: RoutineFunction
}

class LogicRoutineCollection extends RoutineCollection {
	/**
	 * Very fancy ascend meter
	 * Basically has to recalculate everything. Thanks game.
	 * At least there's no loops involved so it's not too slow.
	 */
	improveAscendMeter = new RoutineFunction(function() {
		let ascendMeter = Game.ascendMeter as HTMLElement; // y o
		let ascendNumber = Game.ascendNumber as HTMLElement;

		// Recalculate everything. Thanks game...
		let chipsOwned=Game.HowMuchPrestige(Game.cookiesReset);
		let ascendNowToOwn=Math.floor(Game.HowMuchPrestige(Game.cookiesReset+Game.cookiesEarned));
		let ascendNowToGet=ascendNowToOwn-Math.floor(chipsOwned);

		let Spice = window.Spice;
		// Spiced cookies
		if(typeof Spice != 'undefined' && Spice.settings.numericallyStableHeavenlyChipGains) {
			ascendNowToGet = Spice.stableHeavenlyChipGains();
		}

		let nextChipAt=Game.HowManyCookiesReset(Math.floor(chipsOwned+ascendNowToGet+1))-Game.HowManyCookiesReset(Math.floor(chipsOwned+ascendNowToGet));
		let cookiesToNext=Game.HowManyCookiesReset(ascendNowToOwn+1)-(Game.cookiesEarned+Game.cookiesReset);
		let percent=1-(cookiesToNext/nextChipAt);
		
		if(!vars.ascendMeterPercent) vars.ascendMeterPercent = percent;
		if(!vars.ascendMeterLevel) vars.ascendMeterLevel = ascendNowToGet;
		if(ascendNowToGet != vars.ascendMeterLevel) {
			vars.levelDiff += ascendNowToGet - vars.ascendMeterLevel;
			vars.ascendMeterLevel = ascendNowToGet;
		}

		Game.ascendMeterPercent = vars.ascendMeterPercent;

		// Adjust by 10% of the level difference each tick
		let velocity = (vars.levelDiff + percent - Game.ascendMeterPercent) * 0.1;
		Game.ascendMeterPercent += velocity;

		// Stay at maximum or minimum when going more than a whole bar in a single frame
		let superspeed = false;
		let superspeedRev = false;
		if(Game.ascendMeterPercent >= 2) superspeed = true;
		if(Game.ascendMeterPercent <= -1) superspeedRev = true; 

		// Update level difference and fix negative meter values
		if(Game.ascendMeterPercent >= 1) vars.levelDiff -= Math.floor(Game.ascendMeterPercent);
		if(Game.ascendMeterPercent < 0) vars.levelDiff -= Math.floor(Game.ascendMeterPercent);
		if(Game.ascendMeterPercent < 0) Game.ascendMeterPercent = (1 - Math.abs(Game.ascendMeterPercent));

		Game.ascendMeterPercent %= 1;
		ascendMeter.style.transform = '';

		let perc = Game.ascendMeterPercent * 100;
		perc = superspeed ? 100 : perc;
		perc = superspeedRev ? 0 : perc;

		ascendMeter.style.width = (perc+'%');
		ascendNumber.textContent='+'+window.SimpleBeautify(ascendNowToGet - vars.levelDiff);

		vars.ascendMeterPercent = Game.ascendMeterPercent;
	}, () => {
		if(settings.improveAscendMeter) {
			return true;
		} else {
			let ascendMeter = Game.ascendMeter as HTMLElement;
			ascendMeter.style.removeProperty('width');
			return false;
		}
	});
	/**
	 * If enabled, Skruuia modifies wrinkler cookie consumption.
	 * This increases the amount of cookies that get multiplied by the wrinklers.
	 * Mathematically it's the same, but needs Skruuia to stay slotted in.
	 */
	updateSkruuiaRebalance = new RoutineFunction(function() {
		let godEff = 1;
		if(settings.skruuiaRebalance && Game.hasGod) {
			let godLvl = Game.hasGod('scorn');
			switch(godLvl) {
				case 1: godEff = 1.15; break;
				case 2: godEff = 1.10; break;
				case 3: godEff = 1.05; break;
			}
		}

		let pantheon = Game.Objects['Temple'].minigame;
		if(pantheon) {
			if(typeof pantheon.effs == 'undefined') pantheon.effs = ({} as any);
			if(godEff != pantheon.effs['wrinklerEat']) Game.recalculateGains = 1;
			pantheon.effs['wrinklerEat'] = godEff;
		}
	});

	/** In enhanced bulk mode, refresh store every 10 frames */
	bulkStoreRefresh = new RoutineFunction(
		() => Game.storeToRefresh = 1, 
		() => settings.enhancedBulk && Game.T%10==0
	);
}
class LogicRoutine extends Routine { routines: LogicRoutineCollection }
export let logicRoutine = new LogicRoutine(new LogicRoutineCollection());

class DrawRoutineCollection extends RoutineCollection {
	/** Update icon of milk selector when switching milk types */
	updateMilkIcon = new RoutineFunction(function() {
		if(Game.milkType == 0 && Game.Milk != vars.lastAutoMilk) {
			Util.switchMilkIcon(0);
			vars.lastAutoMilk = Game.Milk;
		} else if(Game.milkType != vars.lastMilk) {
			Util.switchMilkIcon(Game.milkType);
			vars.lastMilk = Game.milkType;
		}
	}, () => settings.fancyMilkSelect)

	/** Fixes the graphics on the grimoire magic meter */
	grimoireMeterFix = new RoutineFunction(function() {
		this.hasRun = true;

		let magicBar = document.getElementById('grimoireBar');
		if(magicBar) {
			let magicMeter = document.getElementById('grimoireBarFull');
			if(magicBar.className.includes('meterContainer')) {
				// Apply horizontal scaling as well as vertical scaling
				magicMeter.style.height = '8px';
				magicMeter.style.transform = 'scale(2,2)';
				magicMeter.style.transformOrigin = '0 0';
				
				// Set up a new container element that can hide the overflow
				let div = document.createElement('div');
				div.className = magicBar.className;
				div.style.overflow = 'hidden';
				div.style.height = '100%';

				magicBar.className = '';
				magicBar.style.position = 'relative';
				magicBar.replaceChild(div, magicMeter);
				div.appendChild(magicMeter);
			}
			
			// Since we're using double width sprites now, better halve the real width
			magicMeter.style.width = Number.parseFloat(magicMeter.style.width)/2 + '%';
		}
	}, function() { return settings.improveMagicMeter || this.hasRun; })

	/** Rotates Cyclius along with his current cycle */
	trueCyclius = new RoutineFunction(function() {
		let cyclius = document.getElementById('templeGod3');
		if(cyclius) {
			let icon = (cyclius.getElementsByClassName('usesIcon')[0] as HTMLElement);
			let slot = Game.hasGod('ages');
			if(slot) {
				// Modify the icon styling so the drop shadow doesn't move
				// Simply places the animation on a div and puts the icon in it
				if(icon.classList.contains('shadowFilter')) {
					let div = document.createElement('div');
					div.classList.add('templeIcon');
					div.classList.add('shadowFilter');
					div.style.margin = 'unset';
					icon.classList.remove('shadowFilter');
					icon.style.animation = 'none';
					cyclius.removeChild(icon);
					cyclius.appendChild(div);
					div.appendChild(icon);
					vars.patchedTrueCyclius = true;
				}

				let interval = 0;
				let rotation = 0;
				if(settings.trueCyclius) {
					switch(slot) {
						case 1: interval = 3; break;
						case 2: interval = 12; break;
						case 3: interval = 24; break;
					}
					rotation = Util.cycliusCalc(interval, settings.zonedCyclius) - Math.PI/2;
					icon.style.setProperty('transform', `rotate(${rotation}rad)`);
				} else {
					icon.style.removeProperty('transform');
				}
			} else {
				if(vars.patchedTrueCyclius) icon.style.removeProperty('transform');
			}
		} else {
			vars.patchedTrueCyclius = false;
		}
	})
}
class DrawRoutine extends Routine { routines: DrawRoutineCollection }
export let drawRoutine = new DrawRoutine(new DrawRoutineCollection());

class ResetRoutineCollection extends RoutineCollection {
	/** Resets the save-specific data */
	resetSaveData = new RoutineFunction(() => saveData.reset())

	/** Sets the scroll of all buildings to 0 */
	resetScroll = new RoutineFunction(function() {
		for(let name in Game.Objects) {
			let obj: any = Game.Objects[name];
			if(obj.scrollOffX) obj.scrollOffX = 0;
		}
	})
}
class ResetRoutine extends Routine { routines: ResetRoutineCollection }
export let resetRoutine = new ResetRoutine(new ResetRoutineCollection());