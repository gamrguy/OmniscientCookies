import { Settings, settings } from './Settings'
import { name, vars, version } from './Vars'
import * as Util from './Util'
import * as Patches from './Patches'

export interface ButtonOption {
	/** Text to display while this option is selected */
	text: string

	/** Function to run when this option is selected */
	func?: () => void

	/** Whether this option should display as "off" */
	off?: boolean
}

export interface ConfigElement {
	display: () => HTMLElement
}

export class OptionedButton<T extends keyof Settings> implements ConfigElement {
	settingName: T
	options: ButtonOption[]
	desc: string
	id: string
	constructor(settingName: T, options: ButtonOption[], desc: string) {
		this.settingName = settingName;
		this.options = options;
		this.desc = desc;
		this.id = "OmniCookiesButton_" + this.settingName;
	}
	display(): HTMLDivElement {
		let div = document.createElement('div');
	
		let set = Number(settings[this.settingName]);
		let selected = this.options[set];
		if(!selected) selected = { text: `ERROR! No option ${set}`, off: true }
		let a = document.createElement('a');
		a.id = this.id;
		a.className = 'option' + (selected.off ? ' off' : '');
		a.onclick = this.toggleFunction();
		a.innerHTML = selected.text;
		div.appendChild(a);

		let label = document.createElement('label');
		label.innerHTML = this.desc;
		div.appendChild(label);

		return div;
	}
	toggleFunction(): () => void {
		let settingName = (this.settingName as string);
		let options = this.options;
		let buttonId = this.id;
		return () => {
			settings[settingName]++;
			if(settings[settingName] >= options.length) settings[settingName] = 0;
			let element = document.getElementById(buttonId);
			let selected = options[settings[settingName]];
			if(selected.off) element.classList.add('off');
			else element.classList.remove('off');
			if(selected.func) selected.func();
			element.innerHTML = selected.text;
			PlaySound('snd/tick.mp3');
		}
	}
}

export class BooleanButton<T extends keyof Settings> extends OptionedButton<T> {
	onOption: ButtonOption
	offOption: ButtonOption
	constructor(settingName: T, onOption: ButtonOption, offOption: ButtonOption, desc: string) {
		super(settingName, [offOption, onOption], desc);
		this.onOption = onOption;
		this.offOption = offOption;
		offOption.off = true;
	}
}

export class Slider<T extends keyof Settings> implements ConfigElement {
	title: string
	settingName: T
	min: number
	max: number
	step: number
	format: (num: number) => string
	constructor(settingName: T, title: string, min: number, max: number, step: number, format: (num: number) => string) {
		this.settingName = settingName;
		this.title = title;
		this.min = min;
		this.max = max;
		this.step = step;
		this.format = format;
	}
	display() {
		let value = (settings[this.settingName] as number);
		let box = document.createElement('div');
		box.className = 'sliderBox';

		let title = document.createElement('div');
		title.style.float = 'left';
		title.innerHTML = this.title;
		box.appendChild(title);

		let sliderRightText = document.createElement('div');
		sliderRightText.id = `OmniCookiesSlider_${this.settingName}RightText`
		sliderRightText.style.float = 'right';
		sliderRightText.innerHTML = this.format(value);
		box.appendChild(sliderRightText);

		let input = document.createElement('input');
		input.id = `OmniCookiesSlider_${this.settingName}Slider`
		input.style.clear = 'both';
		input.type = 'range';
		input.min = this.min.toString();
		input.max = this.max.toString();
		input.step = this.step.toString();
		input.value = value.toString();
		let format = this.format;
		let settingName = this.settingName;
		input.onchange = (ev) => {
			let slider = (ev.target as HTMLInputElement);
			settings[settingName] = (Math.round(Number(slider.value)) as any);
			sliderRightText.innerHTML = format(Number(slider.value));
		}
		input.oninput = (ev) => {
			let slider = (ev.target as HTMLInputElement);
			settings[settingName] = (Math.round(Number(slider.value)) as any);
			sliderRightText.innerHTML = format(Number(slider.value));
		}
		input.onmouseup = () => {
			PlaySound('snd/tick.mp3');
		}
		box.appendChild(input);

		return box;
	}
}

export class Header implements ConfigElement {
	text: string
	constructor(text: string) {
		this.text = text;
	}
	display(): HTMLDivElement {
		var div = document.createElement('div');
		div.className = 'listing';
		div.style.padding = '5px 16px';
		div.style.opacity = '0.7';
		div.style.fontSize = '17px';
		div.style.fontFamily = '\"Kavoon\", Georgia, serif';
		div.appendChild(document.createTextNode(this.text));
		return div;
	}
}

export class Title implements ConfigElement {
	text: string
	constructor(text: string) {
		this.text = text;
	}
	display(): HTMLDivElement {
		let title = document.createElement('div');
		title.className = 'title';
		title.innerHTML = this.text;
		return title;
	}
}

export class Listing implements ConfigElement {
	elements: ConfigElement[]
	constructor(elements: ConfigElement[]) {
		this.elements = elements;
	}
	display(): HTMLDivElement {
		let div = document.createElement('div');
		div.className = 'listing';
		for(let element of this.elements) {
			div.appendChild(element.display());
		}
		return div;
	}
}

/** Returns an empty div if not in open sesame mode */
export class SesameListing extends Listing {
	display() {
		let div = super.display();
		div.style.display = Game.sesame ? div.style.display : 'none';
		return div;
	}
}

export class SesameHeader extends Header {
	display() {
		let div = super.display();
		div.style.display = Game.sesame ? div.style.display : 'none';
		return div;
	}
}

export class ConfigMenu {
	elements: ConfigElement[]
	constructor(elements: ConfigElement[]) {
		this.elements = elements;
	}
	display(): DocumentFragment {
		let frag = document.createDocumentFragment();
		for(let element of this.elements) {
			frag.appendChild(element.display());
		}
		return frag;
	}
}

let menuDisplay = new ConfigMenu([
	new Title(`${name} ${version}`),
	new Header("Graphical tweaks"),
	new Listing([
		new BooleanButton('autoScrollbar', 
			{ text: 'Autohide center scrollbar ON', func: () => Util.scrollbarStyle('auto') },
			{ text: 'Autohide center scrollbar OFF', func: () => Util.scrollbarStyle('scroll') },
			'(the scrollbar in the center view will hide itself when appropriate)'
		),
		new BooleanButton('scrollingBuildings',
			{ text: 'Scroll buildings ON' },
			{ text: 'Scroll buildings OFF' },
			'(hovering over the left/right edges of buildings produces a scroll effect)'
		),
		new BooleanButton('smoothBuildings',
			{ text: 'Smooth buildings ON' },
			{ text: 'Smooth buildings OFF' },
			'(buildings draw every frame, instead of every 3 frames)'
		),
		new BooleanButton('betterBuildingTooltips',
			{ text: 'Improved building tooltips ON', func: () => Patches.buildingTooltips.apply() },
			{ text: 'Improved building tooltips OFF' },
			'(building tooltips in the shop look a little better)'
		),
		new BooleanButton('betterGrandmas',
			{ text: 'Grandma fixes ON', func: () => Patches.miscGrandmaFixes.apply() },
			{ text: 'Grandma fixes OFf' },
			'(text and ordering fixes for grandma synergy upgrades; disabling requires refresh)'
		),
		new BooleanButton('bringGrandmaToWork',
			{ text: 'Bring grandma to work day ON' },
			{ text: 'Bring grandma to work day OFF' },
			'(synergy grandmas make an appearance in their respective building views)'
		),
		new BooleanButton('separateTechs',
			{ text: 'Separate techs ON', func: () => Patches.statsUpgradeCategories.apply() },
			{ text: 'Separate techs OFF' },
			'(gives tech upgrades their own upgrade category under cookies)'
		),
		new BooleanButton('separateSeasons',
			{ text: 'Separate seasons ON', func: () => Patches.statsUpgradeCategories.apply() },
			{ text: 'Separate seasons OFF' },
			'(gives seasonal upgrades their own upgrade category under cookies)'
		),
		new BooleanButton('displaySeasons',
			{ text: 'Display seasonal sources ON', func: () => Patches.displaySeasonUnlock.apply() },
			{ text: 'Display seasonal sources OFF' },
			'(shows source season in upgrade tooltips)'
		),
		new BooleanButton('fancyMilkSelect',
			{ text: 'Fancy milk select ON' },
			{ 
				text: 'Fancy milk select OFF',
				func: () => {
					Util.switchMilkIcon(1);
					vars.lastMilk = -1;
					vars.lastAutoMilk = -1;
				}
			},
			'(milk selector icon changes with selected milk)'
		),
		new BooleanButton('tooltipWobble',
			{ text: 'Tooltip wobble ON' },
			{ text: 'Tooltip wobble OFF', func: () => (Game.tooltip as any).tt.className = 'framed' },
			'(enables the tooltip wobble animation)'
		),
		new BooleanButton('improveAscendMeter',
			{ text: 'Fancy ascend meter ON' },
			{
				text: 'Fancy ascend meter OFF', 
				func: () => (Game.ascendMeter as HTMLElement).style.removeProperty('width') 
			},
			'(meter and number total update faster and smoother)'
		),
		// Not yet
		/*new Slider('ascendMeterPrecision', 'Ascend Meter Precision',
			0, 12, 1,
			(num: number) => Beautify(10**num)
		),*/
		new BooleanButton('heavenlyCookies',
			{ text: 'Heavenly cookies ON', func: () => Patches.heavenlyCookies.apply() },
			{ text: 'Heavenly cookies OFF' },
			'(certain heavenly upgrades act like cookie upgrades)'
		),
		new OptionedButton('buildingsBypassFancy',
			[
				{ text: 'Buildings always FANCY' },
				{ text: 'Buildings always FAST' },
				{ text: 'Buildings always DEFAULT', off: true }
			],
			'(buildings follow this setting rather than default)'
		),
		new OptionedButton('cursorsBypassFancy',
			[
				{ text: 'Cursors always FANCY' },
				{ text: 'Cursors always FAST' },
				{ text: 'Cursors always DEFAULT', off: true }
			],
			'(cursors follow this setting rather than default)'
		),
		new OptionedButton('wrinklersBypassFancy',
			[
				{ text: 'Wrinklers always FANCY' },
				{ text: 'Wrinklers always FAST' },
				{ text: 'Wrinklers always DEFAULT', off: true }
			],
			'(wrinklers follow this setting rather than default)'
		)
	]),
	new Header("Quality of Life"),
	new Listing([
		new BooleanButton('enhancedBulk',
			{ text: 'Enhanced bulk ON', func: () => Patches.updateBulkAll() },
			{ text: 'Enhanced bulk OFF', func: () => Patches.updateBulkAll() },
			'(allows partial and maximum bulk purchases)'
		),
		new BooleanButton('buffTooltipDuration',
			{ text: 'Show buff duration in tooltip ON' }, 
			{ text: 'Show buff duration in tooltip OFF' },
			'(buffs will show their current duration in their tooltip)'
		)
	]),
	new Header("Stock Market"),
	new Listing([
		new BooleanButton('stockValueData',
			{ text: 'Stock value data ON' },
			{ text: 'Stock value data OFF' },
			'(displays information about how profitable your stocks are)'
		),
		new BooleanButton('dangerousStocks',
			{ text: 'Dangerous stocks ON' },
			{ text: 'Dangerous stocks OFF' },
			'(stock market affects total cookies earned)'
		),
		new BooleanButton('dangerousBrokers',
			{ text: 'Dangerous brokers ON', func: () => Patches.dangerousBrokers.apply() },
			{ text: 'Dangerous brokers OFF' },
			'(hiring brokers reduces your Stock Market profits)'
		),
		new BooleanButton('alternateStockMarket',
			{ text: 'Alternate layout ON', func: () => Patches.alternateStockMarket.apply() },
			{ text: 'Alternate layout OFF' },
			'(a more compact layout for goods; disabling requires refresh)'
		)
	]),
	new Header("Pantheon"),
	new Listing([
		new BooleanButton('detailedCyclius',
			{ text: 'Cyclius details ON', func: () => Patches.toggleCyclius() },
			{ text: 'Cyclius details OFF', func: () => Patches.toggleCyclius() },
			'(shows Cyclius\' current cycles in his tooltip)'
		),
		new BooleanButton('zonedCyclius',
			{ text: 'Zoned Cyclius ON', func: () => Game.recalculateGains = 1 },
			{ text: 'Zoned Cyclius OFF', func: () => Game.recalculateGains = 1 },
			'(offsets Cyclius based on your time zone, towards GMT+1)'
		),
		new BooleanButton('trueCyclius',
			{ text: 'True Cyclius ON' },
			{ text: 'True Cyclius OFF' },
			'(cosmetic; Cyclius shows off his power with style)'
		),
		new BooleanButton('skruuiaRebalance',
			{ text: 'Skruuia rebalance ON' },
			{ text: 'Skruuia rebalance OFF' },
			'(Skruuia\'s bonus applies to wrinkler suck rate rather than wrinkler pop multiplier)'
		)
	]),
	new Header("Grimoire"),
	new Listing([
		new BooleanButton('improveMagicMeter',
			{ text: 'Improved magic meter ON' },
			{ text: 'Improved magic meter OFF' },
			'(slight improvements to the magic meter; disabling requires refresh)'
		)
	]),
	new Header("Experimental"),
	new Listing([
		new BooleanButton('optimizeBuildings',
			{ text: 'Buildings draw smart ON' },
			{ text: 'Buildings draw smart OFF' },
			'(buildings attempt to skip unnecessary draw frames)'
		),
		new BooleanButton('preserveWrinklers',
			{ text: 'Preserve wrinklers ON' },
			{ text: 'Preserve wrinklers OFF' },
			'(attempts to preserve all wrinkler data on game save/load)'
		),
		new BooleanButton('cursedFinger',
			{ text: 'Cursed Finger tweaks ON', func: () => Patches.cursedFingerTweaks.apply() },
			{ text: 'Cursed Finger tweaks OFF', func: () => Patches.cursedFingerTweaks.remove() },
			'(CF does not snapshot and counts as real passive CpS)'
		),
		new BooleanButton('buildingPriceBuff',
			{
				text: 'Building price buff ON', 
				func: () => {
					Patches.buildingPriceBuff.apply();
					Game.storeToRefresh = 1;
				} 
			},
			{
				text: 'Building price buff OFF',
				func: () => {
					Game.storeToRefresh = 1;
				}
			},
			'(building price modifiers instead affect price scaling; <span class="warning">balance warning</span>)'
		),
		new BooleanButton('optiCookies',
			{ text: 'OptiCookies ON', func: () => Patches.optiCookies.apply() },
			{ text: 'OptiCookies OFF' },
			'(a couple of small performance tweaks; disabling requires refresh)'
		)
	]),
	new SesameHeader('Debug'),
	new SesameListing([
		new BooleanButton('drawTimerFix',
			{ text: 'Draw timer fix ON', func: () => Patches.drawTimerFix.apply() },
			{ text: 'Draw timer fix OFF' },
			'(adjusts placement of Timer.say for Game.Draw)'
		)
	])
])

export function customOptionsMenu(): void {
	if(!(Game.onMenu == 'prefs')) return;

	let frag = menuDisplay.display();

	l('menu').childNodes[2].insertBefore(frag, l('menu').childNodes[2].childNodes[l('menu').childNodes[2].childNodes.length - 1]);
}