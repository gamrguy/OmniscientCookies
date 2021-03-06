import * as Util from './Util'
import { settings } from './Settings'
import { vars } from './Vars'
import Cppkies, { InjectParams } from 'cppkies'

export class Patch {
	patchFunc: () => void
	removeFunc: () => void
	applied: boolean
	constructor(patchFunc: () => void, removeFunc?: () => void) {
		this.patchFunc = patchFunc;
		this.removeFunc = removeFunc;
		this.applied = false;
	}
	apply() {
		if(this.applied) return;
		this.applied = true;
		this.patchFunc();
	}
	remove() {
		if(!this.applied || !this.removeFunc) return;
		this.applied = false;
		this.removeFunc();
	}
	toggle(force?: boolean) {
		let toState = !this.applied;
		if(typeof force != 'undefined') toState = force;
		if(toState) this.apply();
		else this.remove();
	}
}

/** Toggles the center view's scrollbar style */
export let scrollbarStyle = new Patch(
	() => Util.scrollbarStyle('auto'),
	() => Util.scrollbarStyle('scroll')
)

/** Patches DrawBuildings to perform the smoothBuildings setting */
export let smoothBuildings = new Patch(function() {
	Game.DrawBuildings = Cppkies.injectCode(Game.DrawBuildings,
		'Game.drawT%3==0',
		'OmniCookies.settings.smoothBuildings || ',
		'before'
	)
})

/** 
 * Patches buildings to support the scroll feature.  
 * Also contains the necessary patches for BYGTWD.  
 * Because reasons.
 */
export let scrollingBuildings = new Patch(function() {
	let drawPattern: InjectParams[] = [
		[   // Resize the canvas when it actually needs to
			'if (this.toResize)',
			'if (this.toResize || this.canvas.width != this.canvas.clientWidth || this.canvas.height != this.canvas.clientHeight)',
			'replace'
		],
		[   // Force draw on resize
			'this.toResize=false;',
			'$&;this.forceDraw=true;',
			'replace'
		],
		[   // Do some tracking and determine whether this canvas actually needs to redraw
			`if (typeof(bg)=='string') ctx.fillPattern`,
			`let synergyAmount = OmniCookies.settings.bringGrandmaToWork ? OmniCookies.Util.getNumSynergyGrandmas(this) : -1;
			if(OmniCookies.settings.optimizeBuildings && !this.hasUnloadedImages && !this.forceDraw && !this.lastMouseOn && !this.mouseOn && (this.lastAmount == this.amount) && (this.name == 'Grandma' ? true : this.lastSynergyAmount == synergyAmount)) return;
			this.forceDraw = false;
			this.lastAmount = this.amount;
			this.lastMouseOn = this.mouseOn;
			this.lastSynergyAmount = synergyAmount;
			this.hasUnloadedImages = Game.Loader.assetsLoaded.indexOf(this.art.bg) == -1;
			let hasGrandmas = false;\n`,
			'before'
		],
		[   // Check for unloaded building pics
			'var sprite=Pic(pic.pic);',
			'\nthis.hasUnloadedImages = this.hasUnloadedImages || sprite == Game.Loader.blank;',
			'after'
		],
		[   // Scroll the background with the scroll offset
			'0,0,this.canvas.width,this.canvas.height,128,128',
			',-this.scrollOffX',
			'after'
		],
		[   // Modify building image bounds based on scroll offset
			'var maxI=Math.floor(this.canvas.width',
			`var minI=Math.max(0, Math.floor((-50 + this.scrollOffX) / (w/rows)));
			var maxI=Math.floor((this.canvas.width + 50 + this.scrollOffX)`,
			'replace'
		],
		[   // Reset sprites
			'var i=this.pics.length;',
			'this.pics = [];\nvar i=minI;',
			'replace'
		],
	    [   // Offset sprites
			"var usedPic=(typeof(pic)=='string'?pic:pic(this,i));",
			"x-=this.scrollOffX;\n",
			'before'
		],
		[   // Scroll when mouse hovers over outer 100px of building view
			'var selected=-1;',
			`var speed = 20;
			if(!OmniCookies.settings.smoothBuildings) speed *= 3;
			if(this.mousePos[0] >= (this.canvas.width) - 100 && maxI <= this.amount + rows * 3) {
				this.scrollOffX += Math.floor(speed * ((this.mousePos[0] - (this.canvas.width - 100)) / 100));
			}
			if(this.mousePos[0] <= 100 && this.scrollOffX > 0) {
				this.scrollOffX -= Math.floor(speed * (1 - this.mousePos[0] / 100));
			}
			if(this.scrollOffX < 0 || !OmniCookies.settings.scrollingBuildings) this.scrollOffX = 0;\n`,
			'before'
		],
		[   // Reimplement delay on grandma hover shake
			'ctx.drawImage(sprite,Math.floor(pic.x+Math.random()*4-2),Math.floor(pic.y+Math.random()*4-2));',
			`if(Game.drawT%3==0) {
				this.lastRandX = Math.random()*4;
				this.lastRandY = Math.random()*4;
			}
			ctx.drawImage(sprite,Math.floor(pic.x+this.lastRandX-2),Math.floor(pic.y+this.lastRandY-2));`,
			'replace'
		],
		[   // Bring Grandma To Work Day
			'this.pics.push({x:Math.floor(x),y:Math.floor(y),z:y,pic:usedPic,id:i,frame:frame});',
			`\nif(OmniCookies.settings.bringGrandmaToWork) {
				let grandmas = OmniCookies.GrandmaSupport.tryDrawGrandmas(this, this.pics[this.pics.length-1], i);
				if(grandmas && grandmas.length > 0){
					hasGrandmas = true;
					this.pics = this.pics.concat(grandmas);
				}
			}`,
			'after'
		],
		[   // Enable grandma hovering on supported buildings
			`if (this.name=='Grandma')`,
			`if (this.name=='Grandma' || (OmniCookies.settings.bringGrandmaToWork && hasGrandmas))`,
			'replace'
		],
		[   // Count hovered grandmas as grandmas
			`if (selected==i && this.name=='Grandma')`,
			`if (selected==i && (this.name=='Grandma' || (OmniCookies.settings.bringGrandmaToWork && pic.grandma)))`,
			'replace'
		],
		[   // Don't let non-grandma things occlude hover detection
			`if (this.mousePos[0]>=pic.x-marginW && this.m`,
			`if(this.name == 'Grandma' ? false : !pic.grandma) continue;\n`,
			'before'
		],
		[   // Give grandma-supported buildings their own set of grandma seeds
			`/*+' '+pic.id*/`,
			`+(this.name == 'Grandma' ? '' : ' '+this.name)`,
			'replace'
		]
	];
	let mutePattern: InjectParams[] = [
		[   // Force draw on unmute
			'this.muted=val;',
			'\nthis.forceDraw=true;',
			'after'
		]
	];
	let redrawPattern: InjectParams[] = [
		[   // Force draw on "redraw"
			'me.pics=[];',
			`\nif(OmniCookies.settings.optimizeBuildings) {
				me.forceDraw = true;
			}`,
			'after'
		]
	];
	
	for(let i in Game.Objects) {
		let building = (Game.Objects[i] as any);
		if(building.id != 0) {
			building.scrollOffX = 0;
			building.lastRandX = 0;
			building.lastRandY = 0;
			building.lastOffX = 0;
			building.lastMouseOn = building.mouseOn;
			building.lastAmount = building.amount;
			building.lastSynergyAmount = 0;
			building.hasUnloadedImages = true;
			building.forceDraw = true;
		
			building.draw = Cppkies.injectCodes(building.draw, drawPattern);
			building.mute = Cppkies.injectCodes(building.mute, mutePattern);
			building.redraw = Cppkies.injectCodes(building.redraw, redrawPattern);
		}
	};

	// Inject into Object to affect all future building types
	Game.Object = Cppkies.injectCodes(Game.Object, drawPattern);
	Game.Object = Cppkies.injectCode(Game.Object,
		// Define variables
		'//building canvas',
		`this.scrollOffX = 0;
		this.lastRandX = 0;
		this.lastRandY = 0;
		this.lastOffX = 0;
		this.lastMouseOn = this.mouseOn;
		this.lastAmount = this.amount;
		this.lastSynergyAmount = 0;
		this.hasUnloadedImages = true;
		this.forceDraw = true;\n`,
		'before'
	);
	Game.Object = Cppkies.injectCodes(Game.Object, mutePattern);
	Game.Object = Cppkies.injectCodes(Game.Object, redrawPattern);

	// Bring Your Grandma to Work Day
	Game.Objects['Grandma'].art.pic = Cppkies.injectCode(
		(Game.Objects['Grandma'].art.pic as ((building: Game.Object, i: number) => string)),
		// Remove banned grandmas from the list, happens after Cppkies hook
		`return`,
		`for(let i = list.length; i > 0; i--) {
			let gran = list[i];
			if(gran in OmniCookies.vars.bannedGrandmas) {
				list.splice(i, 1);
			}
		}\n`,
		'before'
	);
	
	vars.bannedGrandmas = {
		'farmerGrandma': true,
		'workerGrandma': true,
		'minerGrandma': true,
		'cosmicGrandma': true,
		'transmutedGrandma': true,
		'alteredGrandma': true,
		'grandmasGrandma': true,
		'antiGrandma': true,
		'rainbowGrandma': true,
		'bankGrandma': true,
		'templeGrandma': true,
		'witchGrandma': true,
		'luckyGrandma': true,
		'metaGrandma': true,
		'alternateGrandma': true
	}
})

/** Patches building tooltips to look a bit better in some cases */
export let buildingTooltips = new Patch(function() {
	let tooltipPattern: InjectParams[] = [
		[
			`if (synergiesStr!='') synergiesStr+=', ';`,
			`if (OmniCookies.settings.betterBuildingTooltips || synergiesStr != '')
				synergiesStr += OmniCookies.settings.betterBuildingTooltips 
					? '<br>&nbsp;&nbsp;&nbsp;&nbsp;- '
					: ', ';`,
			'replace'
		],
		[
			`synergiesStr+=i+' +'+Beautify(synergiesWith[i]*100,1)+'%';`,
			`synergiesStr+=i+' '+
			(OmniCookies.settings.betterBuildingTooltips ? '<b>' : '')+
			'+'+Beautify(synergiesWith[i]*100,1)+'%'+
			(OmniCookies.settings.betterBuildingTooltips ? '</b>' : '');`,
			'replace'
		],
		[
			`synergiesStr=\'...also boosting some other buildings : '+synergiesStr+' - all`,
			`synergiesStr=\'...also boosting some other buildings'+
			(OmniCookies.settings.betterBuildingTooltips 
				? ': '+synergiesStr+'<br>&bull; ' 
				: ' : '+synergiesStr+' - ')+'all`,
			'replace'
		],
		[
			`<div class="data"`,
			`$& '+(OmniCookies.settings.betterBuildingTooltips ? 'style="white-space:nowrap;"' : '')+'`,
			'replace'
		]
	];

	for(var i in Game.Objects) {
		var building = Game.Objects[i];
		building.tooltip = Cppkies.injectCodes(building.tooltip, tooltipPattern);
	}

	Game.Object = Cppkies.injectCodes(Game.Object, tooltipPattern);
})

/** Patches buff tooltips to show remaining time */
export let buffTooltips = new Patch(function() {
	vars.buffsById = [];

	// *angry programmer noises*
	interface BuffWithID extends Game.Buff {
		id: number
	}

	// Edit existing buffs from loaded savegame
	// This is messy and I hate it
	for(let i in Game.buffs) {
		let buff = (Game.buffs[i] as BuffWithID);
		vars.buffsById[buff.id] = buff;
		let onmouseover = function() {
			if (!Game.mouseDown) {
				Game.setOnCrate(this);
				Game.tooltip.dynamic=1;
				Game.tooltip.draw(this, function(){return vars.GetBuffTooltipFunc(buff.id)();},'left');
				Game.tooltip.wobble();
			}
		}
		let buffL = (Game.buffsL.getElementsByClassName('crate enabled buff')[buff.id] as HTMLElement);
		buffL.removeAttribute('onmouseover');
		buffL.onmouseover = onmouseover;
	}

	Game.gainBuff = Cppkies.injectCodes(Game.gainBuff, [
		[   // Place buff somewhere we can access it later
			'Game.buffsL.innerHTML=',
			'OmniCookies.vars.buffsById[buff.id] = buff;\n',
			'before'
		],
		[   // Update buff desc to new max time
			'//new duration is set to new',
			`var tempBuff=type.func(buff.time/Game.fps,arg1,arg2,arg3);
			buff.desc = tempBuff.desc;`,
			'after'
		],
		[   // Use dynamic tooltip instead of static tooltip
			/Game\.getTooltip\([\s\S]+\):''\)\+' /,
			`Game.getDynamicTooltip('(OmniCookies.vars.GetBuffTooltipFunc('+buff.id+'))', 'left', true):'')+' `,
			'replace'
		]
	]);

	// Create a test for header width
	var div = document.createElement('div');
	div.className = 'prompt';
	var test = document.createElement('h3');
	div.id = 'OmniCookies_width_test';
	div.appendChild(test);
	div.style.visibility = 'hidden';
	document.getElementById('game').appendChild(div);

	// Why am I storing this on-demand? Better not to ask
	vars.GetBuffTooltipFunc = function(buffId: number) {
		return function() {
			let buff = (vars.buffsById[buffId] as any);

			// Use the test header to create buffer room for the feather images
			test.textContent = buff.name;
			let width = Math.max(200, test.clientWidth + 78);

			// Fix max time changes
			let buffDesc = buff.desc.replace(Game.sayTime(buff.maxTime,-1),'$&');

			// Fix Devastation
			if(buff.name == 'Devastation') {
				buff.desc = buff.desc.replace(/(\+)\d+(%)/, `$1${Math.floor((buff.multClick-1)*100)}$2`);
			}

			let text = '<div class="prompt" style="white-space:nowrap;min-width:'+width+'px;text-align:center;font-size:11px;margin:8px 0px;"><h3>'+buff.name+'</h3>'+'<div class="line"></div>'+buffDesc;
			
			// 
			if(settings.buffTooltipDuration) 
				text += '<div class="line"></div>'+Game.sayTime(buff.time,-1)+' left';
			
			text += '</div>';
			return text;
		};
	}

	// Patch Stretch Time success roll to update buff description
	let patchGrimoire = setInterval(function() {
		let grimoire = Game.Objects['Wizard tower'].minigame;
		if(grimoire) {
			grimoire.spells['stretch time'].win = Cppkies.injectCode(grimoire.spells['stretch time'].win,
				// Update all instances of the previous maximum time
				// This means it'll catch Cursed Finger
				'me.maxTime+=gain;',
				`let timePattern = RegExp(Game.sayTime(me.maxTime,-1), 'g');
				me.desc = me.desc.replace(timePattern, Game.sayTime(me.maxTime + gain,-1));\n`,
				'before'
			);
			clearInterval(patchGrimoire);
		}
	}, 250);
})

/** 
 * Adds a line break to grandma synergy upgrades
 * Fixes the ordering of grandma upgrades in the stats menu
 * Makes Script grannies trigger a redraw when bought
 */
export let miscGrandmaFixes = new Patch(function() {
	// Add a line break between the two effects
	for(let i of Game.GrandmaSynergies) {
		let upgrade = Game.Upgrades[i];
		upgrade.desc = upgrade.desc.replace(/(efficient\.) /, '$1<br>');
		upgrade.baseDesc = upgrade.desc;
	}

	// Fix the appearance order of these upgrades in the stats menu
	Game.Upgrades["Cosmic grandmas"].order += 0.2;
	Game.Upgrades["Transmuted grandmas"].order += 0.2;
	Game.Upgrades["Altered grandmas"].order += 0.2;
	Game.Upgrades["Grandmas' grandmas"].order += 0.2;

	// Fix the appearance order of buildings in the synergy tooltip list
	Game.GrandmaSynergies.sort(function(a, b) {
		return Game.Upgrades[a].order - Game.Upgrades[b].order;
	});

	// Script grannies trigger a redraw
	let scriptGrannies = Game.Upgrades['Script grannies'];
	if(!scriptGrannies.buyFunction) {
		scriptGrannies.buyFunction = function() {
			Game.Objects['Grandma'].redraw();
		}
	} else {
		scriptGrannies.buyFunction = Cppkies.injectCode(scriptGrannies.buyFunction,
			// CCSE injects a buy function into every upgrade for mod hooks
			null,
			`Game.Objects['Grandma'].redraw();`,
			'before'
		);
	}

	// Fix Portals and Grandmas not reporting their synergy status
	Game.Objects['Portal'].tooltip = Cppkies.injectCode(Game.Objects['Portal'].tooltip,
		`synergiesWith[other.plural]+=boost/(other.storedTotalCps*Game.globalCpsMult);`,
		`synergiesWith[other.plural]+=(me.amount*0.05)/other.baseCps;`,
		'replace'
	)
	Game.Objects['Grandma'].tooltip = Cppkies.injectCode(Game.Objects['Grandma'].tooltip,
		`for (var i in Game.GrandmaSynergies)`,
		`let selfBoost = 0;
		if(Game.Has('One mind')) selfBoost += (me.amount * 0.02)/me.baseCps;
		if(Game.Has('Communal brainsweep')) selfBoost += (me.amount * 0.02)/me.baseCps;
		if(selfBoost > 0) {
			if(!synergiesWith[me.plural]) synergiesWith[me.plural] = 0;
			synergiesWith[me.plural] += selfBoost;
		}
		synergyBoost += selfBoost;\n`,
		'before'
	)
})

/** Adds support for Tech and Seasonal upgrade categories */
export let statsUpgradeCategories = new Patch(function() {
	Game.UpdateMenu = Cppkies.injectCodes(Game.UpdateMenu, [
		[   // Declare techUpgrades var
			'var cookieUpgrades=\'\';',
			`\nvar techUpgrades = '';
			var seasonalUpgrades = '';`,
			'after'
		],
		[   // Redirect tech/seasonal upgrades to the new accumulator string
			'else if (me.pool==\'cookie\'',
			`else if (OmniCookies.settings.separateTechs && me.pool == \'tech\') techUpgrades+=str2;
			else if(OmniCookies.settings.separateSeasons && me.unlockAt && (me.unlockAt.season || me.unlockAt.displaySeason)) seasonalUpgrades+=str2;\n`,
			'before'
		],
		[   // Display the new category
			`cookieUpgrades+'</div>'):'')+`,
			`(techUpgrades!=''?('<div class="listing"><b>Technologies</b></div>'+
			'<div class="listing crateBox">'+techUpgrades+'</div>'):'')+
			(seasonalUpgrades!=''?('<div class="listing"><b>Seasonal</b></div>'+
			'<div class="listing crateBox">'+seasonalUpgrades+'</div>'):'')+`,
			'after'
		]
	]);
})

/** Enables displaying seasonal unlock sources */
export let displaySeasonUnlock = new Patch(function() {
	let allSanta = Game.santaDrops.slice(0, Game.santaDrops.length);
	allSanta.push('A festive hat');
	allSanta.push('Santa\'s dominion');

	Game.crateTooltip = Cppkies.injectCodes(Game.crateTooltip, [
		/*[   // Oh god why
			`mysterious=0`,
			`\tlet `,
			'before'
		],*/
		[	// Uncomments unlockAt.season
			/(\/\*|\*\/)/g,
			'',
			'replace'
		],
		[
			`else if (me.unlockAt.season`,
			` && me.unlockAt.season`,
			'after'
		],
		[   // Implements a cosmetic season unlockAt
			'else if (me.unlockAt.text)',
			`else if (OmniCookies.settings.displaySeasons && me.unlockAt.displaySeason)
			{
				var it=Game.seasons[me.unlockAt.displaySeason];
				desc='<div style="font-size:80%;text-align:center;">From <div class="icon" style="vertical-align:middle;display:inline-block;'+(Game.Upgrades[it.trigger].icon[2]?'background-image:url('+Game.Upgrades[it.trigger].icon[2]+');':'')+'background-position:'+(-Game.Upgrades[it.trigger].icon[0]*48)+'px '+(-Game.Upgrades[it.trigger].icon[1]*48)+'px;transform:scale(0.5);margin:-16px;"></div> '+it.name+'</div><div class="line"></div>'+desc;
			}\n`,
			'before'
		]
	], { mysterious: 0 });

	interface UnlockDisplaySeason extends Game.UnlockRequirement {
		displaySeason: string
	}
	function addCosmeticSeason(upgrade: string | Game.Upgrade, season: string) {
		if(typeof upgrade == 'string') upgrade = Game.Upgrades[upgrade];
		if(!upgrade.unlockAt) upgrade.unlockAt = {cookies:0,name:upgrade.name};
		(upgrade.unlockAt as UnlockDisplaySeason).displaySeason = season;
	}
	for(let name of Game.reindeerDrops) {
		addCosmeticSeason(name, 'christmas');
	}
	for(let name of allSanta) {
		addCosmeticSeason(name, 'christmas');
	}
	for(let name of Game.halloweenDrops) {
		addCosmeticSeason(name, 'halloween');
	}
	for(let name of Game.easterEggs) {
		addCosmeticSeason(name, 'easter');
	}
})

/** Allows disabling the Skruuia wrinkler popping bonus */
export let skruuiaRebalance = new Patch(function() {
	Game.UpdateWrinklers = Cppkies.injectCode(Game.UpdateWrinklers,
		/(var godLvl=)(Game\.hasGod\('scorn'\))(;\s*if \(godLvl==1\) me\.sucked\*=1\.15;)/m,
		`$1OmniCookies.settings.skruuiaRebalance ? 0 : $2$3`,
		'replace',
		{ inRect: Util.inRect }
	);
})

/**
 * Reworks Cursed Finger a bit
 * - Removes the "snapshotting" behavior
 * - Gain seconds of true passive CpS
 */
export let cursedFingerTweaks = new Patch(function() {
	vars.cursedPs = Game.cookiesPs;
	vars.cursedPsMult = Game.globalCpsMult;

	let cursedFinger = Game.buffTypesByName['cursed finger'];
	cursedFinger.func = Cppkies.injectCodes(cursedFinger.func, [
		[   // Remove multiply by 0 - don't worry, just moving it
			`multCpS:0,`,
			`multCpS:1,`,
			'replace'
		],
		[   // Small description edit
			`<br>but each click is worth `,
			`<br>but each click generates `,
			'replace'
		]
	]);

	cursedFingerPart2.apply();

	// Fix pre-existing cursed finger
	let cursedBuff = (Game.hasBuff('Cursed finger') as any); // AAAAAAAAAA
	if(cursedBuff) {
		cursedBuff.multCpS = 1;
		cursedBuff.desc = cursedBuff.desc.replace('is worth', 'generates');
		Game.recalculateGains = 1;
	}
}, function() {
	// Inverse of the original patch
	let cursedFinger = Game.buffTypesByName['cursed finger'];
	cursedFinger.func = Cppkies.injectCodes(cursedFinger.func, [
		[
			`multCpS:1,`,
			`multCpS:0,`,
			'replace'
		],
		[
			`<br>but each click generates `,
			`<br>but each click is worth `,
			'replace'
		]
	]);

	// Put the x0 multiplier back, update buff power, fix desc
	let cursedBuff = (Game.hasBuff('Cursed finger') as any); // AAAAAAAAAA
	if(cursedBuff) {
		cursedBuff.multCpS = 0;
		cursedBuff.desc = cursedBuff.desc.replace('generates', 'is worth');
		cursedBuff.power = vars.cursedPs * cursedBuff.maxTime/Game.fps;
		Game.recalculateGains = 1;
	}
});

/** One-time patches for Cursed Finger, not undo-able */
let cursedFingerPart2 = new Patch(function() {
	Game.CalculateGains = Cppkies.injectCode(Game.CalculateGains,
		// See? Told you.
		`Game.computedMouseCps=Game.mouseCps();`,
		`\nif(OmniCookies.settings.cursedFinger && Game.hasBuff('Cursed finger')) {
			OmniCookies.vars.cursedPs = Game.cookiesPs;
			OmniCookies.vars.cursedPsMult = Game.globalCpsMult;
			Game.globalCpsMult = 0;
			Game.cookiesPs = 0;
			Game.computedMouseCps = 0;
		}`,
		'after'
	);

	// Inject into and then replace the cookie click event
	let bigCookie = document.getElementById('bigCookie');
	bigCookie.removeEventListener('click', (Game.ClickCookie as EventListener));
	Game.ClickCookie = Cppkies.injectCode(Game.ClickCookie,
		// Replace click gains with cursed gains
		`Game.handmadeCookies+=amount;`,
		`\nif(OmniCookies.settings.cursedFinger && Game.hasBuff('Cursed finger')) {
			Game.Dissolve(amount);
			Game.handmadeCookies-=amount;
			amount = OmniCookies.vars.cursedPs * Game.buffs['Cursed finger'].maxTime/Game.fps;
			Game.cookiesPs = OmniCookies.vars.cursedPs;
			Game.globalCpsMult = OmniCookies.vars.cursedPsMult;
			OmniCookies.Util.gainInstantPassiveCpS(Game.buffs['Cursed finger'].maxTime/Game.fps);
			Game.cookiesPs = 0;
			Game.globalCpsMult = 0;
		}`,
		'after'
	);
	AddEvent(bigCookie, 'click', (Game.ClickCookie as EventListener));
})

/** Enable tooltip wobbling */
export let tooltipWobble = new Patch(function() {
	Game.tooltip.wobble = Cppkies.injectCode(Game.tooltip.wobble,
		`if (false)`,
		`if (OmniCookies.settings.tooltipWobble)`,
		'replace'
	);
})

/** Replaces cyclius gain function with our own */
export let cycliusGains = new Patch(function() {
	Game.CalculateGains = Cppkies.injectCode(Game.CalculateGains,
		/\(Date\.now\(\)\/1000\/\(60\*60\*(\d+)\)\)\*Math\.PI\*2/g,
		'OmniCookies.Util.cycliusCalc($1, OmniCookies.settings.zonedCyclius)',
		'replace'
	);
})

/** Displays information about how much you bought your stocks for */
export let stockInfo = new Patch(function() {
	Util.onMinigameLoaded('Bank', function() {
		let stockMarket = Game.Objects['Bank'].minigame;
		stockMarket.buyGood = Cppkies.injectCode(stockMarket.buyGood,
			// Calculate new average when buying stock
			'return true;',
			`let realCostInS = costInS * overhead;
			if(!OmniCookies.saveData.stockAverages[id] || me.stock == n) {
				OmniCookies.saveData.stockAverages[id] = {
					avgValue: realCostInS,
					totalValue: realCostInS*n
				};
			} else {
				let avg = OmniCookies.saveData.stockAverages[id];
				avg.totalValue += realCostInS*n;
				avg.avgValue = avg.totalValue/me.stock;
			}\n`,
			'before',
			{ M: stockMarket }
		);
		stockMarket.sellGood = Cppkies.injectCode(stockMarket.sellGood,
			// Subtract total bought stock value when selling
			`return true;`,
			`if(OmniCookies.saveData.stockAverages[id]) {
				let avg = OmniCookies.saveData.stockAverages[id];
				avg.totalValue -= avg.avgValue*n;
			}\n`,
			'before',
			{ M: stockMarket }
		);
		/*stockMarket.goodTooltip = OmniCookies.replaceCode(stockMarket.goodTooltip, [
			{   // Shows the current total bought value on the tooltip
				// Disabled for now due to ugly text wrapping
				pattern: /me\.name\+' \(worth <b>\$'\+Beautify\(val\*me\.stock,2\)\+'<\/b>/,
				replacement: `$&, bought for <b>$$'+Beautify(OmniCookies.saveData.stockAverages[id] ? OmniCookies.saveData.stockAverages[id].totalValue : 0, 2)+'</b>`
			}
		]), `var M = Game.Objects['Bank'].minigame;`;*/
		stockMarket.drawGraph = Cppkies.injectCode(stockMarket.drawGraph,
			// Draw line for profit threshold
			null,
			`if(OmniCookies.settings.stockValueData && M.hoverOnGood != -1) {
				let me = M.goodsById[M.hoverOnGood];
				if(me.stock > 0 && OmniCookies.saveData.stockAverages[M.hoverOnGood]) {
					ctx.strokeStyle='#00ff00'; // green
					ctx.beginPath();
					let lineHeight = Math.floor(height-OmniCookies.saveData.stockAverages[M.hoverOnGood].avgValue*M.graphScale)+0.5;
					ctx.moveTo(width-1, lineHeight);
					ctx.lineTo(width-span*rows-1, lineHeight);
					ctx.stroke();
				}
			}`,
			'after',
			{ M: stockMarket }
		);
		stockMarket.draw = Cppkies.injectCode(stockMarket.draw,
			// Add a new display for the average bought value
			`//if (me.stock>0) me.stockL.style.color='#fff';`,
			`if(OmniCookies.settings.stockValueData) {
				if(!me.avgL) {
					let avgSpan = document.createElement('span');
					avgSpan.id = 'bankGood-'+me.id+'-avg';
					avgSpan.innerHTML = '$$--.--';
					document.getElementById('bankGood-'+me.id+'-stockBox').appendChild(avgSpan);
					me.avgL = avgSpan;
				}

				if(OmniCookies.settings.alternateStockMarket && (!me.avgL.parentElement || me.avgL.parentElement.id.includes('-stockBox'))) {
					let newCell = l('bankGood-'+me.id+'-boughtValueBox');
					if(newCell) {
						me.avgL.style.marginLeft = '4px';
						newCell.appendChild(me.avgL);
					}
				}
				
				if(OmniCookies.saveData.stockAverages[me.id] && me.stock > 0) {
					me.avgL.style.visibility = 'visible';
					let avg = OmniCookies.saveData.stockAverages[me.id];
					me.avgL.innerHTML = '$$'+Beautify(avg.avgValue,2);
					if(!OmniCookies.settings.alternateStockMarket) {
						me.avgL.innerHTML = ' ('+me.avgL.innerHTML+')';
					}
					if(avg.avgValue < me.val) {
						me.avgL.classList.remove('red');
						me.avgL.classList.add('green');
					} else {
						me.avgL.classList.remove('green');
						me.avgL.classList.add('red');
					}
				} else {
					if(!OmniCookies.settings.alternateStockMarket) {
						me.avgL.style.visibility = 'hidden';
						me.avgL.innerHTML = '';
					} else {
						me.avgL.style.visibility = 'visible';
						me.avgL.innerHTML = '$$--.--';
					}
					me.avgL.classList.remove('red');
					me.avgL.classList.remove('green');
				}
			} else {
				if(me.avgL) {
					me.avgL.remove();
					me.avgL = undefined;
				}
			}\n`,
			'before',
			{ M: stockMarket }
		);
		stockMarket.toRedraw = (2 as any);
	});
})

/** Allows buildings to bypass the Fancy graphics setting */
export let fancyBuildings = new Patch(function() {
	Game.Draw = Cppkies.injectCode(Game.Draw,
		'if (Game.prefs.animate && ((Game.prefs.fancy && Game.drawT%1==0)',
		'if (Game.prefs.animate && ((((Game.prefs.fancy || OmniCookies.settings.buildingsBypassFancy == 0) && OmniCookies.settings.buildingsBypassFancy != 1) && Game.drawT%1==0)',
		'replace'
	);
})

/** Allows cursors to bypass the Fancy graphics setting */
export let fancyCursors = new Patch(function() {
	Game.DrawBackground = Cppkies.injectCode(Game.DrawBackground, 
		/(var fancy=)(Game\.prefs\.fancy)(;)/,
		'$1($2 || OmniCookies.settings.cursorsBypassFancy == 0) && OmniCookies.settings.cursorsBypassFancy != 1$3',
		'replace'
	);
})

/** Allows wrinklers to bypass the Fancy graphics setting */
export let fancyWrinklers = new Patch(function() {
	Game.UpdateWrinklers = Cppkies.injectCode(Game.UpdateWrinklers, 
		/Game\.prefs\.fancy/g,
		`($& || OmniCookies.settings.wrinklersBypassFancy == 0) && OmniCookies.settings.wrinklersBypassFancy != 1`,
		'replace',
		{ inRect: Util.inRect }
	);
})

/** 
 * Properly displays the (seemingly intended) feature of partial buying in bulk.
 * Also makes the ALL button worth ALL, not 1000
 * Also allows using the ALL button in buy mode.
 */
export let buySellBulk = new Patch(function() {
	let rebuildPattern: InjectParams[] = [
		[
			`l('productPriceMult'+me.id).textContent=(Game.buyBulk>1)?('x'+Game.buyBulk+' '):'';`,
			`if(OmniCookies.settings.enhancedBulk) {
				let bulkAmount = -1;
				let bulkPrice = -1;
				if(Game.buyMode == -1) {
					bulkAmount = (Game.buyBulk > -1) ? Math.min(Game.buyBulk, me.amount) : me.amount;
				} else {
					let scaling = Game.priceIncrease;
					if(OmniCookies.settings.buildingPriceBuff) {
						scaling = 1+Game.modifyBuildingPrice(me, scaling-1);
					}
					let bulk = OmniCookies.Util.calcMaxBuyBulk(me, Game.buyBulk, scaling);
					bulkAmount = bulk.maxAmount;
					bulkPrice = bulk.maxPrice;
				}
				l('productPriceMult'+me.id).textContent = bulkAmount > 1 ? 'x' + bulkAmount + ' ' : '';
			} else {
				$&
			}`,
			'replace'
		]
	];
	let refreshPattern: InjectParams[] = [
		[   // Set bulk buy price to maximum bulk price
			`if (Game.buyMode==1) this.bulkPrice=this.getSumPrice(Game.buyBulk);`,
			`if (Game.buyMode==1) {
				if(OmniCookies.settings.enhancedBulk) {
					let scaling = Game.priceIncrease;
					if(OmniCookies.settings.buildingPriceBuff) {
						scaling = 1+Game.modifyBuildingPrice(this, scaling-1);
					}
					let bulk = OmniCookies.Util.calcMaxBuyBulk(this,Game.buyBulk,scaling);
					this.bulkPrice = bulk.maxPrice > 0 ? bulk.maxPrice : this.price;
				} else {
					this.bulkPrice=this.getSumPrice(Game.buyBulk);
				}
			}`,
			'replace'
		],
		[   // Sell ALL buildings, not only up to 1000
			`else if (Game.buyMode==-1 && Game.buyBulk==-1) this.bulkPrice=this.getReverseSumPrice(`,
			`OmniCookies.settings.enhancedBulk ? this.amount : `,
			'after'
		]
	];
	let buyPattern: InjectParams[] = [
		[   // Allow ALL to mean ALL, rather than 1000
			`if (amount==-1) amount=1000;`,
			`if (amount==-1) amount=Infinity;`,
			'replace'
		],
		[   // Stop looping when we can't afford stuff
			/success=1;\s*}/,
			`$& else break;`,
			'replace'
		]
	];

	for(let i in Game.Objects) {
		let building = Game.Objects[i];

		building.rebuild = Cppkies.injectCodes(building.rebuild, rebuildPattern);
		building.refresh = Cppkies.injectCodes(building.refresh, refreshPattern);
		building.buy = Cppkies.injectCodes(building.buy, buyPattern);
	}

	Game.Object = Cppkies.injectCodes(Game.Object, rebuildPattern);
	Game.Object = Cppkies.injectCodes(Game.Object, refreshPattern);
	Game.Object = Cppkies.injectCodes(Game.Object, buyPattern);

	Game.storeBulkButton = Cppkies.injectCodes(Game.storeBulkButton, [
		[   // Allow using max button in buy mode
			`if (Game.buyMode==1 && Game.buyBulk==-1) Game.buyBulk=100;`,
			`if(id == 0 || id == 1) {
				let text = 'all';
				if(OmniCookies.settings.enhancedBulk) {
					if(Game.buyMode == -1) text = 'ALL';
					else text = 'MAX';
				}
				l('storeBulkMax').textContent = text;
			}
			if (!OmniCookies.settings.enhancedBulk && Game.buyMode==1 && Game.buyBulk==-1) Game.buyBulk=100;`,
			'replace'
		],
		[   // Max button is always visible
			`l('storeBulkMax').style.visibility='hidden';`,
			`if(!OmniCookies.settings.enhancedBulk) `,
			'before'
		]
	]);

	Game.Logic = Cppkies.injectCodes(Game.Logic, [
		[   // Record the current shortcut
			`if (!Game.promptOn)`,
			`let activeShortcut = (OmniCookies.Util.holdingButton(16)*2) | (OmniCookies.Util.holdingButton(17));\n`,
			'before'
		],
		[   // Always cause a setting update if there is a change in shortcut
			`if ((Game.keys[16] || Game.keys[17]) && !Game.buyBulkShortcut)`,
			`if (activeShortcut != OmniCookies.vars.prevShortcut && (OmniCookies.settings.enhancedBulk ? true : activeShortcut == 2 || activeShortcut == 1))`,
			'replace'
		],
		[   // Only set Game.buyBulkOld when previously not holding either key
			`Game.buyBulkOld=Game.buyBulk;`,
			`if(OmniCookies.vars.prevShortcut == 0) `,
			'before'
		],
		[   // If holding both keys, switch to MAX/ALL
			`if (Game.keys[17]) Game.buyBulk=10;`,
			`if(activeShortcut == 3 && OmniCookies.settings.enhancedBulk) Game.buyBulk = -1;`,
			'after'
		],
		[   // Record state
			`//handle cookies`,
			`OmniCookies.vars.prevShortcut = activeShortcut;\n`,
			'before'
		]
	])
	
	updateBulkAll();
})

/** Updates the bulk buy selection for when the option is toggled */
export let updateBulkAll = function() {
	if(Game.buyMode == 1) {
		if(Game.buyBulk == -1 && !settings.enhancedBulk) Game.storeBulkButton(4);
		l('storeBulkMax').style.visibility = settings.enhancedBulk ? 'visible' : 'hidden';
	}
	let text = 'all';
	if(settings.enhancedBulk) {
		if(Game.buyMode == -1) text = 'ALL';
		else text = 'MAX';
	}
	l('storeBulkMax').textContent = text;
	Game.RefreshStore();
}

/** 
 * Fix stock market to use established cookie manipulation options
 * You can now lose some of your earned cookies this way - or gain them!
 */ 
export let dangerousStocks = new Patch(function() {
	Util.onMinigameLoaded('Bank', function() {
		let stockMarket = Game.Objects['Bank'].minigame;
		stockMarket.buyGood = Cppkies.injectCode(stockMarket.buyGood,
			// Use Dissolve instead of Spend (to withhold cookies earned)
			`Game.Spend(cost*n);`,
			`if(OmniCookies.settings.dangerousStocks) {
				Game.Dissolve(cost*n);
			} else {
				$&
			}`,
			'replace',
			{ M: stockMarket }
		);
		stockMarket.sellGood = Cppkies.injectCodes(stockMarket.sellGood, [
			[   // Start using Game.Earn again (to reinstate cookies earned)
				'//Game.Earn',
				`if(OmniCookies.settings.dangerousStocks) Game.Earn`,
				'replace'
			],
			[   // Stop using direct setting
				/\tGame\.cookies/gm,
				`if(!OmniCookies.settings.dangerousStocks) $&`,
				'replace'
			]
		], { M: stockMarket });
	});
})

/** Adds a displayed value for each of Cyclius' cycles. */
export let cycliusInfo = new Patch(function() {
	Util.onMinigameLoaded('Temple', function() {
		let pantheon = Game.Objects['Temple'].minigame;
		let functionPattern: InjectParams = [
			// Allow functions to be used as descriptions
			/\+me\.desc(\w+)\+/g,
			`+((typeof me.desc$1 == 'function') ? me.desc$1() : me.desc$1)+`,
			'replace'
		];
		pantheon.godTooltip = Cppkies.injectCode(pantheon.godTooltip, 
			...functionPattern, { M: pantheon });
		pantheon.slotTooltip = Cppkies.injectCode(pantheon.slotTooltip, 
			...functionPattern, { M: pantheon });

		// Display Cyclius values
		let cycliusFunc = function(interval: number): () => string {
			return function() {
				let effect = '';
				if(settings.detailedCyclius) {
					let mult = 0.15*Math.sin(Util.cycliusCalc(interval, settings.zonedCyclius)) * 100;
					let color = mult > 0 ? 'green' : 'red';
					let sign = mult > 0 ? '+' : '';
					let num = Beautify(mult,2);
					if(num == "0") color = ''; // if Beautify gives 0
					if(mult < -0.1 && num == "0") color = 'red'; // if Beautify gives a bad 0
					if(mult < 0 && !num.includes('-')) num = '-' + num; // if Beautify forgets to give a -
					effect = `<div style="display:inline-block;text-align:right;width:50%;" class="${color}">${sign}${num}% base CpS.</div>`;
				}
				return `<div style="display:inline-block;width:49%;">Effect cycles over ${interval} hours.</div>${effect}`;
			}
		}
		interface SpiritWithDescFunc {
			desc1: string | (() => string)
			desc2: string | (() => string)
			desc3: string | (() => string)
		}
		let cyclius = (pantheon.gods['ages'] as SpiritWithDescFunc);
		toggleCyclius();
		cyclius.desc1 = cycliusFunc(3);
		cyclius.desc2 = cycliusFunc(12);
		cyclius.desc3 = cycliusFunc(24);
	});
})

export let toggleCyclius = function() {
	let pantheon = Game.Objects['Temple'].minigame;
	let cyclius = (pantheon.gods['ages'] as any);
	if(cyclius.activeDescFunc) {
		cyclius.activeDescBackup = cyclius.activeDescFunc;
		cyclius.activeDescFunc = undefined; // I'm sorry
	} else {
		cyclius.activeDescFunc = cyclius.activeDescBackup;
		cyclius.activeDescBackup = undefined; // I'm really, really sorry
	}
}

/** Miscellaneous performance enhancements */
export let optiCookies = new Patch(function() {
	// fix forcing a store refresh every 5 draw frames if player has zero and non-zero switches
	Game.Draw = Cppkies.injectCode(Game.Draw,
		`if (price<lastPrice) Game.storeToRefresh=1;`,
		`if (price<lastPrice && price!=0) Game.upgradesToRebuild=1;`,
		'replace'
	);
	
	// use fast calc instead of loop calc
	for(let obj of Game.ObjectsById) {
		obj.getSumPrice = Cppkies.injectCodes(obj.getSumPrice, [
			[   // Immediately cancel the loop
				/(for \(var i=)(Math\.max\(0,this\.amount\))(;)/,
				`$1Infinity$3`,
				'replace'
			],
			[   // Change to quick calc
				`=Game.modifyBuildingPrice(this,price);`,
				`=OmniCookies.Util.quickCalcBulkPrice(this, amount);`,
				`replace`
			]
		]);
		obj.getReverseSumPrice = Cppkies.injectCodes(obj.getReverseSumPrice, [
			[   // Immediately cancel the loop
				/(for \(var i=)(Math\.max\(0,\(this\.amount\)-amount\))(;)/,
				`$1Infinity$3`,
				'replace'
			],
			[   // Change to quick calc
				`=Game.modifyBuildingPrice(this,price);`,
				`=OmniCookies.Util.quickCalcBulkPrice(this, amount, undefined, true);`,
				`replace`
			],
			[
				// Remove sell multiplier, already calculated that
				`price*=this.getSellMult`,
				`//`,
				'before'
			]
		]);
	}
})

export let dangerousBrokers = new Patch(function() {
	Util.onMinigameLoaded('Bank', function() {
		let market = Game.Objects['Bank'].minigame;
		let brokerButton = l('bankBrokersBuy');
		let parent = brokerButton.parentElement;

		let newButton = document.createElement('div');
		newButton.classList.add('bankButton', 'bankButtonBuy', 'bankButtonOff');
		newButton.id = 'bankBrokersBuy';
		newButton.innerHTML = "Hire";
		newButton.onclick = (e) => {
			if (market.brokers<market.getMaxBrokers() && Game.cookies>=market.getBrokerPrice()) {
				if(settings.dangerousBrokers && settings.dangerousStocks) {
					Game.Dissolve(market.getBrokerPrice());
				} else {
					Game.Spend(market.getBrokerPrice());
				}
				market.brokers+=1;
				if(settings.dangerousBrokers) {
					market.profit-=1200;
				}
				PlaySound('snd/cashIn2.mp3',0.6);
				Game.SparkleOn((e.target) as any);
			}
		}

		brokerButton.remove();
		parent.appendChild(newButton);
	})
})

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
export let heavenlyCookies = new Patch(function() {
	Game.crateTooltip = Cppkies.injectCode(Game.crateTooltip,
		`if (me.tier!=0 && Game.Has('Label printer')) tags.push('Tier : '`,
		`if(OmniCookies.settings.heavenlyCookies && me.pseudoCookie) {
			if(!OmniCookies.vars.bannedPseudoCookies[me.name]) {
				tags.push('Cookie', 0);
			}
		}\n`,
		'before',
		{ mysterious: 0 }
	);
	Game.particleAdd = Cppkies.injectCode(Game.particleAdd,
		/(if \(cookie\.bought>0 && )(cookie\.pool=='cookie')(\) cookies\.push\(cookie\.icon\);)/,
		`$1($2 || (OmniCookies.settings.heavenlyCookies && cookie.pseudoCookie && Game.Has(cookie.name) && !OmniCookies.vars.bannedPseudoCookies[cookie.name]))$3`,
		'replace'
	);
})

export let buildingPriceBuff = new Patch(function() {
	let pattern: InjectParams[] = [
		[   // Inject a modification to Game.priceIncrease before building price calc
			null,
			`let oldPriceIncrease = Game.priceIncrease;
			if(OmniCookies.settings.buildingPriceBuff) {
				Game.priceIncrease = 1+Game.modifyBuildingPrice(this, oldPriceIncrease-1);
				OmniCookies.vars.skipModifyPrice = true;
			}`,
			'before'
		],
		[   // Put priceIncrease back where it was after the calc
			`return Mat`,
			`if(OmniCookies.settings.buildingPriceBuff) Game.priceIncrease = oldPriceIncrease;\n`,
			'before'
		]
	];

	for(let building of Game.ObjectsById) {
		building.getPrice = Cppkies.injectCodes(building.getPrice, pattern);
		building.getSumPrice = Cppkies.injectCodes(building.getSumPrice, pattern);
		building.getReverseSumPrice = Cppkies.injectCodes(building.getReverseSumPrice, pattern);
	}

	Game.modifyBuildingPrice = Cppkies.injectCode(Game.modifyBuildingPrice,
		// Allow skipping the price modification during this mode
		null,
		`if(OmniCookies.vars.skipModifyPrice) {
			OmniCookies.vars.skipModifyPrice = false;
			return price;
		}`,
		'before'
	);
})

export let alternateStockMarket = new Patch(function() {
	Util.onMinigameLoaded('Bank', function() {
		let stockMarket = Game.Objects['Bank'].minigame;
		let marketL = l('bankContent');
		let headerL = l('bankHeader');
		let graphL = l('bankGraphBox');

		// Move the first 4 elements outside of the header
		for(let i=0;i<4;i++) marketL.insertBefore(headerL.children[0], headerL);

		// Move the graph to be before the rest of the elements
		headerL.insertBefore(graphL, headerL.children[0]);

		// Collect all of the bankGoods and place them in a new div
		let goodsDiv = document.createElement('div');
		goodsDiv.style.display = 'table';
		for(let goodId in stockMarket.goodsById) {
			let newDiv = document.createElement('div');
			newDiv.style.display = 'inline-block';
			newDiv.style.paddingRight = '4px';
			newDiv.style.paddingLeft = '4px';

			let percentSpan = document.getElementById(`bankGood-${goodId}-sym`);
			let valueSpan = document.getElementById(`bankGood-${goodId}-val`);
			let stockSpan = document.getElementById(`bankGood-${goodId}-stock`);
			let stockMaxSpan = document.getElementById(`bankGood-${goodId}-stockMax`);
			let stockValueSpan = document.getElementById(`bankGood-${goodId}-avg`);
			let hideButton = document.getElementById(`bankGood-${goodId}-viewHide`);
			let buyButton = document.getElementById(`bankGood-${goodId}_Max`);
			let sellButton = document.getElementById(`bankGood-${goodId}_-All`);
			let good = stockMarket.goodsById[goodId];
			let icon = (good.l.getElementsByClassName('icon')[0] as HTMLElement);
			newDiv.appendChild(good.l);
			newDiv.appendChild(icon);
			goodsDiv.appendChild(newDiv);

			let symbolTable = document.createElement('table');
			symbolTable.style.display = 'inline-block';
			symbolTable.style.overflow = 'hidden';
			
			let topRow = document.createElement('tr');
			let nameCell = document.createElement('td'); topRow.appendChild(nameCell);
			nameCell.setAttribute('rowspan', '2');
			nameCell.style.verticalAlign = 'center';
			let percentCell = document.createElement('td'); topRow.appendChild(percentCell);
			let valueCell = document.createElement('td'); topRow.appendChild(valueCell);
			let maxStockCell = document.createElement('td'); topRow.appendChild(maxStockCell);
			symbolTable.appendChild(topRow);

			let bottomRow = document.createElement('tr');
			let profitPercentCell = document.createElement('td'); bottomRow.appendChild(profitPercentCell);
			let boughtValueCell = document.createElement('td'); bottomRow.appendChild(boughtValueCell);
			let ownedStockCell = document.createElement('td'); bottomRow.appendChild(ownedStockCell);
			symbolTable.appendChild(bottomRow);

			let rightTable = document.createElement('table');
			rightTable.style.display = 'inline-block';
			let rightTopRow = document.createElement('tr');
			let rightBotRow = document.createElement('tr');
			let buyButtonCell = document.createElement('td'); rightTopRow.appendChild(buyButtonCell);
			let hideButtonCell = document.createElement('td'); rightTopRow.appendChild(hideButtonCell);
			let sellButtonCell = document.createElement('td'); rightBotRow.appendChild(sellButtonCell);
			rightTable.appendChild(rightTopRow);
			rightTable.appendChild(rightBotRow);

			// move icon
			icon.style.zIndex = '';
			icon.style.transform = '';
			icon.style.position = '';
			icon.style.margin = '-6px -14px';
			icon.style.float = 'left';

			// Perform open heart surgery
			good.l.style.width = 'fit-content';
			good.l.style.background = 'linear-gradient(to right,#333,#222,#111,#000)';
			//good.l.style.margin = '1px';
			good.l.style.width = 'auto';
			//good.l.style.height = '32px';

			let buySellDiv = (good.l.children[good.l.children.length-1] as HTMLElement);
			buySellDiv.remove();

			// move Hide button outside
			hideButton.style.position = 'relative';
			hideButton.style.display = 'inline-block';
			hideButton.style.paddingTop = '0px';
			hideButton.style.paddingBottom = '0px';
			hideButton.style.width = '25px';
			hideButtonCell.appendChild(hideButton);
			//good.l.appendChild(hideButton);

			// remove most buy/sell buttons and stack them
			buyButton.style.verticalAlign = 'bottom';
			sellButton.style.verticalAlign = 'bottom';
			buyButton.style.margin = '0px 0px';
			sellButton.style.margin = '0px 0px';
			buyButton.style.background = '#000';
			sellButton.style.background = '#000';
			buyButtonCell.appendChild(buyButton);
			sellButtonCell.appendChild(sellButton);

			// modify the bank symbols (o h n o)
			let symbolsDiv = (good.l.children[0] as HTMLElement);
			symbolsDiv.style.height = '32px';
			//symbolsDiv.style.float = 'left';
			//symbolsDiv.style.width = '205px';
			symbolsDiv.appendChild(symbolTable);
			//symbolsDiv.insertBefore(symbolTable, symbolsDiv.children[0]);
			symbolsDiv.appendChild(rightTable);
			
			symbolTable.setAttribute('onmouseout', symbolsDiv.getAttribute('onmouseout'));
			symbolTable.setAttribute('onmouseover', symbolsDiv.getAttribute('onmouseover'));
			symbolsDiv.removeAttribute('onmouseout');
			symbolsDiv.removeAttribute('onmouseover');

			let titleSymbol = percentSpan.parentElement;
			//titleSymbol.style.float = 'left';
			titleSymbol.style.width = '40px';
			//titleSymbol.style.height = '28px';
			titleSymbol.style.padding = '1px 0px';
			//titleSymbol.style.boxShadow = '0px 0px 0px 1px rgba(255,255,255,0.1), 2px 2px 4px rgba(0,0,0,0.5) inset';
			titleSymbol.removeChild(percentSpan);
			let titleDiv = document.createElement('div');
			titleDiv.innerHTML = titleSymbol.innerHTML.trim();
			titleSymbol.innerHTML = '';
			titleSymbol.style.background = 'unset';
			//titleDiv.style.paddingTop = '8px';
			titleDiv.style.fontSize = '13px';
			//titleDiv.style.position = 'relative';
			//titleSymbol.appendChild(icon);
			titleSymbol.appendChild(titleDiv);
			nameCell.appendChild(titleSymbol);
			nameCell.style.verticalAlign = 'middle';
			nameCell.style.boxShadow = '0px 0px 0px 1px rgba(255,255,255,0.1), 2px 2px 4px rgba(0,0,0,0.5) inset';

			let percentSymbol = document.createElement('div');
			let percentSpanDiv = document.createElement('div');
			percentSpanDiv.style.paddingRight = '2px';
			percentSymbol.className = "bankSymbol";
			percentSymbol.style.margin = '0px 1px';
			percentSymbol.style.padding = '2px 0px';
			//percentSymbol.style.float = 'left';
			percentSymbol.style.textAlign = 'right';
			percentSymbol.style.width = '60px';
			percentSymbol.style.overflow = 'hidden';
			percentSymbol.style.background = 'unset';
			percentCell.style.boxShadow = '0px 0px 0px 1px rgba(255,255,255,0.1), 2px 2px 4px rgba(0,0,0,0.5) inset';
			percentSpanDiv.appendChild(percentSpan);
			percentSymbol.appendChild(percentSpanDiv);
			percentCell.appendChild(percentSymbol);
			
			let valueSymbol = valueSpan.parentElement;
			valueSpan.style.marginLeft = '4px';
			valueSymbol.style.margin = '0px 0px';
			valueSymbol.style.background = 'unset';
			//valueSymbol.style.float = 'left';
			valueSymbol.style.width = '50px';
			valueSymbol.style.textAlign = 'left';
			valueSymbol.style.display = 'inline-block';
			valueCell.style.boxShadow = '0px 0px 0px 1px rgba(255,255,255,0.1), 2px 2px 4px rgba(0,0,0,0.5) inset';
			valueSymbol.innerHTML = '';
			valueSymbol.appendChild(valueSpan);
			valueCell.appendChild(valueSymbol);

			let stockMaxSymbol = stockMaxSpan.parentElement;
			stockMaxSymbol.style.margin = '0px 0px';
			stockMaxSymbol.style.background = '';
			stockMaxSymbol.style.width = '50px';
			stockMaxSymbol.style.display = 'inline-block';
			stockMaxSymbol.style.background = 'unset';
			maxStockCell.style.boxShadow = '0px 0px 0px 1px rgba(255,255,255,0.1), 2px 2px 4px rgba(0,0,0,0.5) inset';
			stockMaxSymbol.innerHTML = '';
			stockMaxSymbol.appendChild(stockMaxSpan);
			stockMaxSpan.innerHTML = stockMaxSpan.innerHTML.replace('/', '');
			maxStockCell.appendChild(stockMaxSymbol);

			let ownedStockSymbol = document.createElement('div');
			ownedStockSymbol.className = "bankSymbol";
			ownedStockSymbol.id = `bankGood-${good.id}-ownedStockBox`
			ownedStockSymbol.style.margin = '0px 0px';
			ownedStockSymbol.style.padding = '2px 0px';
			ownedStockSymbol.style.width = '50px';
			ownedStockSymbol.style.overflow = 'hidden';
			ownedStockSymbol.style.background = 'unset';
			ownedStockCell.style.boxShadow = '0px 0px 0px 1px rgba(255,255,255,0.1), 2px 2px 4px rgba(0,0,0,0.5) inset';
			ownedStockSymbol.appendChild(stockSpan);
			ownedStockCell.appendChild(ownedStockSymbol);

			let stockValueSymbol = document.createElement('div');
			stockValueSymbol.className = "bankSymbol";
			stockValueSymbol.id = `bankGood-${good.id}-boughtValueBox`;
			stockValueSymbol.style.margin = '0px 0px';
			stockValueSymbol.style.padding = '2px 0px';
			stockValueSymbol.style.width = '50px';
			stockValueSymbol.style.overflow = 'hidden';
			stockValueSymbol.style.background = 'unset';
			stockValueSymbol.style.textAlign = 'left';
			boughtValueCell.style.boxShadow = '0px 0px 0px 1px rgba(255,255,255,0.1), 2px 2px 4px rgba(0,0,0,0.5) inset';
			boughtValueCell.appendChild(stockValueSymbol);

			let profitPercentSymbol = document.createElement('div');
			let profitSpanDiv = document.createElement('div');
			profitSpanDiv.style.paddingRight = '2px';
			profitSpanDiv.id = `bankGood-${good.id}-profitSym`;
			profitSpanDiv.style.visibility = 'hidden';
			profitSpanDiv.innerHTML = '--.--%';
			profitSpanDiv.style.fontWeight = 'normal';
			profitPercentSymbol.className = "bankSymbol";
			profitPercentSymbol.style.margin = '0px 1px';
			profitPercentSymbol.style.padding = '2px 0px';
			profitPercentSymbol.style.textAlign = 'right';
			profitPercentSymbol.style.width = '60px';
			profitPercentSymbol.style.overflow = 'hidden';
			profitPercentSymbol.style.background = 'unset';
			profitPercentCell.style.boxShadow = '0px 0px 0px 1px rgba(255,255,255,0.1), 2px 2px 4px rgba(0,0,0,0.5) inset';
			profitPercentSymbol.appendChild(profitSpanDiv);
			profitPercentCell.appendChild(profitPercentSymbol);
			//symbolsDiv.insertBefore(percentSymbol, valueSymbol);
		}
		headerL.appendChild(goodsDiv);

		stockMarket.draw = Cppkies.injectCode(stockMarket.draw,
			`.vals[0]*M.graphScale))+'px) scale(0.5)';`,
			`\nif(!me.ownedStockBoxL) me.ownedStockBoxL = l('bankGood-'+me.id+'-ownedStockBox');
			
			if(me.stockBoxL.classList.contains('green') && !me.ownedStockBoxL.classList.contains('green')) me.ownedStockBoxL.classList.add('green');
			else if(!me.stockBoxL.classList.contains('green') && me.ownedStockBoxL.classList.contains('green')) me.ownedStockBoxL.classList.remove('green');
			if(me.stockBoxL.classList.contains('green')) me.stockBoxL.classList.remove('green');
			
			me.stockMaxL.innerHTML = me.stockMaxL.innerHTML.replace('/', '');
			
			if(!me.profitSpanL) me.profitSpanL = l('bankGood-'+me.id+'-profitSym');
			if(OmniCookies.settings.stockValueData) {
				me.profitSpanL.style.visibility = 'visible';
				let avg = OmniCookies.saveData.stockAverages[me.id];
				if(avg && avg.totalValue > 0) {
					let percent = (me.val/avg.avgValue - 1) * 100;
					me.profitSpanL.innerHTML = Beautify(percent, 2) + '%';
					me.profitSpanL.style.paddingRight = '2px';
					if (percent>=0) {me.profitSpanL.classList.add('bankSymbolUp');me.profitSpanL.classList.remove('bankSymbolDown');}
					else if (percent<0) {me.profitSpanL.classList.remove('bankSymbolUp');me.profitSpanL.classList.add('bankSymbolDown');}
					else {
						me.profitSpanL.classList.remove('bankSymbolUp');
						me.profitSpanL.classList.remove('bankSymbolDown');
						me.profitSpanL.style.paddingRight = '12px';
					}
				} else {
					me.profitSpanL.classList.remove('bankSymbolUp');
					me.profitSpanL.classList.remove('bankSymbolDown');
					me.profitSpanL.innerHTML = '--.--%';
					me.profitSpanL.style.paddingRight = '12px';
				}
			} else {
				me.profitSpanL.style.visibility = 'hidden';
			}`,
			'after',
			{ M: stockMarket }
		);

		Game.Logic = Cppkies.injectCode(Game.Logic,
			`OmniCookies.vars.prevShortcut = activeShortcut;`,
			`if(activeShortcut != OmniCookies.vars.prevShortcut) {
				for(let goodId in Game.Objects['Bank'].minigame.goodsById) {
					let buyButton = document.getElementById('bankGood-'+goodId+'_Max');
					let sellButton = document.getElementById('bankGood-'+goodId+'_-All');
					let amount = 1;
					switch(activeShortcut) {
						case 0: amount = 1; break;
						case 1: amount = 10; break;
						case 2: amount = 100; break;
						case 3: amount = -1; break;
					}
					if(amount == -1) {
						buyButton.innerHTML = 'Max';
						sellButton.innerHTML = 'All';
					} else {
						buyButton.innerHTML = amount.toString();
						sellButton.innerHTML = amount.toString();
					}
				}
			}\n`,
			'before'
		);

		let awesomeInject: InjectParams = [
			null,
			`\nlet oldN = n;
			switch(OmniCookies.vars.prevShortcut) {
				case 0: n = 1; break;
				case 1: n = 10; break;
				case 2: n = 100; break;
				case 3: n = 10000; break;
			}
			n *= Math.sign(oldN);`,
			'before'
		];
		
		stockMarket.buyGood = Cppkies.injectCode(stockMarket.buyGood, ...awesomeInject, { M: stockMarket });
		stockMarket.sellGood = Cppkies.injectCode(stockMarket.sellGood, ...awesomeInject, { M: stockMarket });
		stockMarket.tradeTooltip = Cppkies.injectCode(stockMarket.tradeTooltip, ...awesomeInject, { M: stockMarket });

		stockMarket.toRedraw = (2 as any);
	});
})

export let drawTimerFix = new Patch(function() {
	Game.Loop = Cppkies.injectCodes(Game.Loop, [
		[
			`Timer.say('DRAW');`,
			`//`,
			'before'
		],
		[
			`Timer.say('END DRAW');`,
			`//`,
			'before'
		]
	]);
	Game.Draw = Cppkies.injectCodes(Game.Draw, [
		[
			null,
			`\nTimer.say('DRAW');`,
			'before'
		],
		[
			null,
			`Timer.say('END DRAW');\n`,
			'after'
		]
	])
})

export let colorfulCursors = new Patch(function() {
	let assetName = "https://gamrguy.github.io/OmniscientCookies/img/colorful_cursors.png";
	Util.loadCustomAsset(assetName);
	Game.DrawBackground = Cppkies.injectCodes(Game.DrawBackground, [
		[
			`'cursor.png'`,
			`(OmniCookies.settings.colorfulCursors && OmniCookies.settings.colorfulCursors >= OmniCookies.CursorStyle.Plain) ? '${assetName}' : $&`,
			'replace'
		],
		[
			`//var spe=-1;`,
			`let cursorTiers = [0];
			if(OmniCookies.settings.colorfulCursors == OmniCookies.CursorStyle.Tiered) {
				if (Game.Has('Carpal tunnel prevention cream')) cursorTiers.push(1);
				if (Game.Has('Ambidextrous')) cursorTiers.push(2);
				if (Game.Has('Thousand fingers')) cursorTiers.push(3);
				if (Game.Has('Million fingers')) cursorTiers.push(4);
				if (Game.Has('Billion fingers')) cursorTiers.push(5);
				if (Game.Has('Trillion fingers')) cursorTiers.push(6);
				if (Game.Has('Quadrillion fingers')) cursorTiers.push(7);
				if (Game.Has('Quintillion fingers')) cursorTiers.push(8);
				if (Game.Has('Sextillion fingers')) cursorTiers.push(9);
				if (Game.Has('Septillion fingers')) cursorTiers.push(10);
				if (Game.Has('Octillion fingers')) cursorTiers.push(11);
				if (Game.Has('Nonillion fingers')) cursorTiers.push(12);
				if (Game.Has('Fortune #001')) cursorTiers.push(13);
			}\n`,
			'before'
		],
		[
			`ctx.drawImage(pic,0,0,32,32,x,y,32,32);`,
			`Math.seedrandom(Game.seed + ' cursor ' + i);
			let offX = 0;
			let offY = 0;
			switch(OmniCookies.settings.colorfulCursors) {
				case OmniCookies.CursorStyle.Default:
					break;
				case OmniCookies.CursorStyle.Dark:
					offX = 32;
					break;
				case OmniCookies.CursorStyle.Retro:
					offY = 32;
					break;
				case OmniCookies.CursorStyle.DarkRetro:
					offX = 32;
					offY = 32;
					break;
				case OmniCookies.CursorStyle.Plain:
					break;
				case OmniCookies.CursorStyle.Tiered:
					offX = 32 * choose(cursorTiers);
					break;
			}
			ctx.drawImage(pic,offX,offY,32,32,x,y,32,32);`,
			'replace'
		],
		[
			`Timer.track('cursors');`,
			`Math.seedrandom();\n`,
			'before'
		]
	])
})