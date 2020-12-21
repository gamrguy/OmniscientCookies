import * as Util from './Util'
import { settings } from './Settings'
import { vars } from './Vars'

class Patch {
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
		this.patchFunc();
		this.applied = true;
	}
	remove() {
		if(!this.applied || !this.removeFunc) return;
		this.removeFunc();
		this.applied = false;
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

/** Patches UpdateMenu to add in the custom options */
export let updateMenu = new Patch(function() {
	Game.UpdateMenu = Util.replaceCode(Game.UpdateMenu, [
		{
			pattern: /}$/,
			replacement: 'OmniCookies.Config.customOptionsMenu();$&'
		}
	]);
})

/** Patches DrawBuildings to perform the smoothBuildings setting */
export let smoothBuildings = new Patch(function() {
	Game.DrawBuildings = Util.replaceCode(Game.DrawBuildings, [
		{
			pattern: 'Game.drawT%3==0',
			replacement: 'OmniCookies.settings.smoothBuildings || $&'
		}
	])
})

/** 
 * Patches buildings to support the scroll feature.  
 * Also contains the necessary patches for BYGTWD.  
 * Because reasons.
 */
export let scrollingBuildings = new Patch(function() {
	let drawPattern: Util.CodeReplacement[] = [
		{   // Resize the canvas when it actually needs to
			pattern: 'if \(this.toResize\)',
			replacement: 'if (this.toResize || this.canvas.width != this.canvas.clientWidth || this.canvas.height != this.canvas.clientHeight)'
		},
		{   // Force draw on resize
			pattern: 'this.toResize=false;',
			replacement: '$&;this.forceDraw=true;'
		},
		{   // Do some tracking and determine whether this canvas actually needs to redraw
			pattern: `if (typeof(bg)=='string') ctx.fillPattern`,
			replacement: `
				let synergyAmount = OmniCookies.settings.bringGrandmaToWork ? OmniCookies.Util.getNumSynergyGrandmas(this) : -1;
				if(OmniCookies.settings.optimizeBuildings && !this.hasUnloadedImages && !this.forceDraw && !this.lastMouseOn && !this.mouseOn && (this.lastAmount == this.amount) && (this.name == 'Grandma' ? true : this.lastSynergyAmount == synergyAmount)) return;
				this.forceDraw = false;
				this.lastAmount = this.amount;
				this.lastMouseOn = this.mouseOn;
				this.lastSynergyAmount = synergyAmount;
				this.hasUnloadedImages = Game.Loader.assetsLoaded.indexOf(this.art.bg) == -1;
				let hasGrandmas = false;
				$&`
		},
		{   // Check for unloaded building pics
			pattern: 'var sprite=Pic(pic.pic);',
			replacement: '$&\nthis.hasUnloadedImages = this.hasUnloadedImages || sprite == Game.Loader.blank;'
		},
		{   // Scroll the background with the scroll offset
			pattern: '0,0,this.canvas.width,this.canvas.height,128,128',
			replacement: '$&,-this.scrollOffX'
		},
		{   // Modify building image bounds based on scroll offset
			pattern: 'var maxI=Math.floor(this.canvas.width',
			replacement: 'var minI=Math.max(0, Math.floor((-50 + this.scrollOffX) / (w/rows)));\nvar maxI=Math.floor((this.canvas.width + 50 + this.scrollOffX)'
		},
		{   // Reset sprites
			pattern: 'var i=this.pics.length;',
			replacement: 'this.pics = [];\nvar i=minI;'
		},
		{   // Offset sprites
			pattern: "var usedPic=(typeof(pic)=='string'?pic:pic(this,i));",
			replacement: "x-=this.scrollOffX;\n$&"
		},
		{   // Scroll when mouse hovers over outer 100px of building view
			pattern: 'var selected=-1;',
			replacement: `
				var speed = 20;
				if(!OmniCookies.settings.smoothBuildings) speed *= 3;
				if(this.mousePos[0] >= (this.canvas.width) - 100 && maxI <= this.amount + rows * 3) {
					this.scrollOffX += Math.floor(speed * ((this.mousePos[0] - (this.canvas.width - 100)) / 100));
				}
				if(this.mousePos[0] <= 100 && this.scrollOffX > 0) {
					this.scrollOffX -= Math.floor(speed * (1 - this.mousePos[0] / 100));
				}
				if(this.scrollOffX < 0 || !OmniCookies.settings.scrollingBuildings) this.scrollOffX = 0;
				$&`
		},
		{   // Reimplement delay on grandma hover shake
			pattern: 'ctx.drawImage(sprite,Math.floor(pic.x+Math.random()*4-2),Math.floor(pic.y+Math.random()*4-2));',
			replacement: `
				if(Game.drawT%3==0) {
					this.lastRandX = Math.random()*4;
					this.lastRandY = Math.random()*4;
				}
				ctx.drawImage(sprite,Math.floor(pic.x+this.lastRandX-2),Math.floor(pic.y+this.lastRandY-2));`
		},
		{   // Bring Grandma To Work Day
			pattern: 'this.pics.push({x:Math.floor(x),y:Math.floor(y),z:y,pic:usedPic,id:i,frame:frame});',
			replacement: `$&
				if(OmniCookies.settings.bringGrandmaToWork) {
					let grandmas = OmniCookies.GrandmaSupport.tryDrawGrandmas(this, this.pics[this.pics.length-1], i);
					if(grandmas && grandmas.length > 0){
						hasGrandmas = true;
						this.pics = this.pics.concat(grandmas);
					}
				}
			`
		},
		{   // Enable grandma hovering on supported buildings
			pattern: `if (this.name=='Grandma')`,
			replacement: `if (this.name=='Grandma' || (OmniCookies.settings.bringGrandmaToWork && hasGrandmas))`
		},
		{   // Count hovered grandmas as grandmas
			pattern: `if (selected==i && this.name=='Grandma')`,
			replacement: `if (selected==i && (this.name=='Grandma' || (OmniCookies.settings.bringGrandmaToWork && pic.grandma)))`
		},
		{   // Don't let non-grandma things occlude hover detection
			pattern: `if (this.mousePos[0]>=pic.x-marginW && this.m`,
			replacement: `
				if(this.name == 'Grandma' ? false : !pic.grandma) continue;
			$&`
		},
		{   // Give grandma-supported buildings their own set of grandma seeds
			pattern: `Math.seedrandom(Game.seed+' '+pic.id/*+' '+pic.id*/);`,
			replacement: `Math.seedrandom(Game.seed+' '+pic.id+(this.name == 'Grandma' ? '' : ' '+this.name));`
		}
	];
	let mutePattern: Util.CodeReplacement[] = [
		{   // Force draw on unmute
			pattern: 'this.muted=val;',
			replacement: '$&\nthis.forceDraw=true;'
		}
	];
	let redrawPattern: Util.CodeReplacement[] = [
		{   // Force draw on "redraw"
			pattern: 'me.pics=[];',
			replacement: `$&
				if(OmniCookies.settings.optimizeBuildings) {
					me.forceDraw = true;
				}
			`
		}
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
		
			building.draw = Util.replaceCode(building.draw, drawPattern);
			building.mute = Util.replaceCode(building.mute, mutePattern);
			building.redraw = Util.replaceCode(building.redraw, redrawPattern);
		}
	};

	// Inject into Object to affect all future building types
	Game.Object = Util.replaceCode(Game.Object, drawPattern);
	Game.Object = Util.replaceCode(Game.Object, [
		{   // Define variables
			pattern: '//building canvas',
			replacement: `
				this.scrollOffX = 0;
				this.lastRandX = 0;
				this.lastRandY = 0;
				this.lastOffX = 0;
				this.lastMouseOn = this.mouseOn;
				this.lastAmount = this.amount;
				this.lastSynergyAmount = 0;
				this.hasUnloadedImages = true;
				this.forceDraw = true;
			$&`
		}
	]);
	Game.Object = Util.replaceCode(Game.Object, mutePattern);
	Game.Object = Util.replaceCode(Game.Object, redrawPattern);

	// Bring Your Grandma to Work Day
	Game.Objects['Grandma'].art.pic = Util.replaceCode((Game.Objects['Grandma'].art.pic as ((building: Game.Object, i: number) => string)), [
		{   // Keep abnormal grandmas off the lawn during BYGTWD
			pattern: `if (Game.Has('Far`,
			replacement: `if(!OmniCookies.settings.bringGrandmaToWork) {
			$&`
		},
		{   // After all, they have somewhere better to be!
			pattern: `metaGrandma');`,
			replacement: `$&
			}`
		},
		{   // Script grannies and seasonal grannies get to stay home
			pattern: `if (Game.Has('Alternate grandmas')) list.push('alternateGrandma');`,
			replacement: `if(!OmniCookies.settings.bringGrandmaToWork) $&`
		}
	]);
})

/** Patches building tooltips to look a bit better in some cases */
export let buildingTooltips = new Patch(function() {
	let tooltipPattern: Util.CodeReplacement[] = [
		{
			pattern: `if (synergiesStr!='') synergiesStr+=', ';`,
			replacement: `if (OmniCookies.settings.betterBuildingTooltips || synergiesStr != '')
				synergiesStr += OmniCookies.settings.betterBuildingTooltips 
					? '<br>&nbsp;&nbsp;&nbsp;&nbsp;- '
					: ', ';`
		},
		{
			pattern: `synergiesStr+=i+' +'+Beautify(synergiesWith[i]*100,1)+'%';`,
			replacement: `synergiesStr+=i+' '+
			(OmniCookies.settings.betterBuildingTooltips ? '<b>' : '')+
			'+'+Beautify(synergiesWith[i]*100,1)+'%'+
			(OmniCookies.settings.betterBuildingTooltips ? '</b>' : '');`
		},
		{
			pattern: `synergiesStr=\'...also boosting some other buildings : '+synergiesStr+' - all`,
			replacement: `synergiesStr=\'...also boosting some other buildings'+
			(OmniCookies.settings.betterBuildingTooltips 
				? ': '+synergiesStr+'<br>&bull; ' 
				: ' : '+synergiesStr+' - ')+'all`
		},
		{
			pattern: `<div class="data"`,
			replacement: `$& '+(OmniCookies.settings.betterBuildingTooltips ? 'style="white-space:nowrap;"' : '')+'`
		}
	];

	for(var i in Game.Objects) {
		var building = Game.Objects[i];
		building.tooltip = Util.replaceCode(building.tooltip, tooltipPattern);
	}

	Game.Object = Util.replaceCode(Game.Object, tooltipPattern);
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
		let onmouseover: any = function() {
			if (!Game.mouseDown) {
				Game.setOnCrate(this);
				Game.tooltip.dynamic=1;
				Game.tooltip.draw(this, function(){return vars.GetBuffTooltipFunc(buff.id)();},'left');
				Game.tooltip.wobble();
			}
		}
		onmouseover = onmouseover.toString().replace('function() {', '').replace(/}$/, '').replace('buff.id', buff.id);
		Game.buffsL.getElementsByClassName('crate enabled buff')[buff.id].setAttribute('onmouseover', onmouseover);
	}

	Game.gainBuff = Util.replaceCode(Game.gainBuff, [
		{   // Place buff somewhere we can access it later
			pattern: 'Game.buffsL.',
			replacement: 'OmniCookies.vars.buffsById[buff.id] = buff;$&'
		},
		{   // Update buff desc to new max time
			pattern: '//new duration is set to new',
			replacement: `$&
				var tempBuff=type.func(buff.time/Game.fps,arg1,arg2,arg3);
				buff.desc = tempBuff.desc;
			`
		},
		{   // Use dynamic tooltip instead of static tooltip
			pattern: Game.gainBuff.toString().substr(1037,202), // yes really
			replacement: `Game.getDynamicTooltip('(OmniCookies.vars.GetBuffTooltipFunc('+buff.id+'))', 'left', true)`
		}
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

			let buffDesc = buff.desc.replace(Game.sayTime(buff.maxTime,-1),'$&');
			let text = '<div class="prompt" style="white-space:nowrap;min-width:'+width+'px;text-align:center;font-size:11px;margin:8px 0px;"><h3>'+buff.name+'</h3>'+'<div class="line"></div>'+buffDesc;
			if(settings.buffTooltipDuration) 
				text += '<div class="line"></div>'+Game.sayTime(buff.time,-1)+' left';
			text += '</div>';
			return text;
		};
	}

	// Patch Stretch Time success roll to update buff description
	let patchGrimoire = setInterval(function() {
		let minigame = Game.Objects['Wizard tower'].minigame;
		if(minigame) {
			minigame.spells['stretch time'].win = Util.replaceCode(minigame.spells['stretch time'].win, [
				{   // Update all instances of the previous maximum time
					// This means it'll catch Cursed Finger
					pattern: 'me.maxTime+=gain;',
					replacement: `
					let timePattern = RegExp(Game.sayTime(me.maxTime,-1), 'g');
					me.desc = me.desc.replace(timePattern, Game.sayTime(me.maxTime + gain,-1));
					$&`
				}
			]);
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
		scriptGrannies.buyFunction = Util.replaceCode(scriptGrannies.buyFunction, [
			{   // CCSE injects a buy function into every upgrade for mod hooks
				pattern: '{',
				replacement: `$&\nGame.Objects['Grandma'].redraw();`
			}
		]);
	}

	// Fix Portals and Grandmas not reporting their synergy status
	Game.Objects['Portal'].tooltip = Util.replaceCode(Game.Objects['Portal'].tooltip, [
		{
			pattern: `synergiesWith[other.plural]+=boost/(other.storedTotalCps*Game.globalCpsMult);`,
			replacement: `synergiesWith[other.plural] += (me.amount * 0.05)/other.baseCps;`
		}
	])
	Game.Objects['Grandma'].tooltip = Util.replaceCode(Game.Objects['Grandma'].tooltip, [
		{
			pattern: `for (var i in Game.GrandmaSynergies)`,
			replacement: `let selfBoost = 0;
				if(Game.Has('One mind')) selfBoost += (me.amount * 0.02)/me.baseCps;
				if(Game.Has('Communal brainsweep')) selfBoost += (me.amount * 0.02)/me.baseCps;
				if(!synergiesWith[me.plural]) synergiesWith[me.plural] = 0;
				synergyBoost += selfBoost;
				synergiesWith[me.plural] += selfBoost;
			$&`
		}
	])
})

/** Adds support for Tech and Seasonal upgrade categories */
export let statsUpgradeCategories = new Patch(function() {
	Game.UpdateMenu = Util.replaceCode(Game.UpdateMenu, [
		{   // Declare techUpgrades var
			pattern: 'var cookieUpgrades=\'\';',
			replacement: `$&
				var techUpgrades = '';
				var seasonalUpgrades = '';
			`
		},
		{   // Redirect tech/seasonal upgrades to the new accumulator string
			pattern: 'else if (me.pool==\'cookie\'',
			replacement: `else if (OmniCookies.settings.separateTechs && me.pool == \'tech\') techUpgrades+=str2;
				else if(OmniCookies.settings.separateSeasons && me.unlockAt && (me.unlockAt.season || me.unlockAt.displaySeason)) seasonalUpgrades+=str2;
			$&`
		},
		{   // Display the new category
			pattern: `cookieUpgrades+'</div>'):'')+`,
			replacement: `$&
				(techUpgrades!=''?('<div class="listing"><b>Technologies</b></div>'+
				'<div class="listing crateBox">'+techUpgrades+'</div>'):'')+
				(seasonalUpgrades!=''?('<div class="listing"><b>Seasonal</b></div>'+
				'<div class="listing crateBox">'+seasonalUpgrades+'</div>'):'')+
			`
		}
	]);
})

/** Enables displaying seasonal unlock sources */
export let displaySeasonUnlock = new Patch(function() {
	let allSanta = Game.santaDrops.slice(0, Game.santaDrops.length);
	allSanta.push('A festive hat');
	allSanta.push('Santa\'s dominion');

	Game.crateTooltip = Util.replaceCode(Game.crateTooltip, [
		{   // Oh god why
			pattern: `\tmysterious=0`,
			replacement: `\tvar $&`
		},
		{	// Uncomments unlockAt.season
			pattern: /(\/\*|\*\/)/g,
			replacement: ''
		},
		{
			pattern: `else if (me.unlockAt.season)`,
			replacement: `else if (OmniCookies.settings.displaySeasons && me.unlockAt.season)`
		},
		{   // Implements a cosmetic season unlockAt
			pattern: 'else if (me.unlockAt.text)',
			replacement: `
				else if (OmniCookies.settings.displaySeasons && me.unlockAt.displaySeason)
				{
					var it=Game.seasons[me.unlockAt.displaySeason];
					desc='<div style="font-size:80%;text-align:center;">From <div class="icon" style="vertical-align:middle;display:inline-block;'+(Game.Upgrades[it.trigger].icon[2]?'background-image:url('+Game.Upgrades[it.trigger].icon[2]+');':'')+'background-position:'+(-Game.Upgrades[it.trigger].icon[0]*48)+'px '+(-Game.Upgrades[it.trigger].icon[1]*48)+'px;transform:scale(0.5);margin:-16px;"></div> '+it.name+'</div><div class="line"></div>'+desc;
				}
			$&`
		}
	]);

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
	Game.UpdateWrinklers = Util.replaceCode(Game.UpdateWrinklers, [
		{
			pattern: /(var godLvl=)(Game\.hasGod\('scorn'\))(;\s*if \(godLvl==1\) me\.sucked\*=1\.15;)/m,
			replacement: `$1OmniCookies.settings.skruuiaRebalance ? 0 : $2$3`
		}
	]);
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
	cursedFinger.func = Util.replaceCode(cursedFinger.func, [
		{   // Remove multiply by 0 - don't worry, just moving it
			pattern: `multCpS:0,`,
			replacement: `multCpS:1,`
		},
		{   // Small description edit
			pattern: `<br>but each click is worth `,
			replacement: `<br>but each click generates `
		}
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
	cursedFinger.func = Util.replaceCode(cursedFinger.func, [
		{
			pattern: `multCpS:1,`,
			replacement: `multCpS:0,`
		},
		{
			pattern: `<br>but each click generates `,
			replacement: `<br>but each click is worth `
		}
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
	Game.CalculateGains = Util.replaceCode(Game.CalculateGains, [
		{   // See? Told you.
			pattern: `Game.computedMouseCps=Game.mouseCps();`,
			replacement: `$&
				if(OmniCookies.settings.cursedFinger && Game.hasBuff('Cursed finger')) {
					OmniCookies.vars.cursedPs = Game.cookiesPs;
					OmniCookies.vars.cursedPsMult = Game.globalCpsMult;
					Game.globalCpsMult = 0;
					Game.cookiesPs = 0;
					Game.computedMouseCps = 0;
				}`
		}
	]);

	// Inject into and then replace the cookie click event
	let bigCookie = document.getElementById('bigCookie');
	bigCookie.removeEventListener('click', (Game.ClickCookie as EventListener));
	Game.ClickCookie = Util.replaceCode(Game.ClickCookie, [
		{   // Replace click gains with cursed gains
			pattern: `Game.handmadeCookies+=amount;`,
			replacement: `$&
				if(OmniCookies.settings.cursedFinger && Game.hasBuff('Cursed finger')) {
					Game.Dissolve(amount);
					Game.handmadeCookies-=amount;
					amount = OmniCookies.vars.cursedPs * Game.buffs['Cursed finger'].maxTime/Game.fps;
					Game.cookiesPs = OmniCookies.vars.cursedPs;
					Game.globalCpsMult = OmniCookies.vars.cursedPsMult;
					OmniCookies.Util.gainInstantPassiveCpS(Game.buffs['Cursed finger'].maxTime/Game.fps);
					Game.cookiesPs = 0;
					Game.globalCpsMult = 0;
				}`
		}
	]);
	AddEvent(bigCookie, 'click', (Game.ClickCookie as EventListener));
})

/** Enable tooltip wobbling */
export let tooltipWobble = new Patch(function() {
	Game.tooltip.wobble = Util.replaceCode(Game.tooltip.wobble, [
		{
			pattern: `if (false)`,
			replacement: `if (OmniCookies.settings.tooltipWobble)`
		}
	]);
})

/** Replaces cyclius gain function with our own */
export let cycliusGains = new Patch(function() {
	Game.CalculateGains = Util.replaceCode(Game.CalculateGains, [
		{
			pattern: /\(Date\.now\(\)\/1000\/\(60\*60\*(\d+)\)\)\*Math\.PI\*2/g,
			replacement: 'OmniCookies.Util.cycliusCalc($1, OmniCookies.settings.zonedCyclius)'
		}
	]);
})

/** Displays information about how much you bought your stocks for */
export let stockInfo = new Patch(function() {
	Util.onMinigameLoaded('Bank', function() {
		let stockMarket = Game.Objects['Bank'].minigame;
		stockMarket.buyGood = Util.replaceCode(stockMarket.buyGood, [
			{   // Calculate new average when buying stock
				pattern: 'return true;',
				replacement: `
					let realCostInS = costInS * overhead;
					if(!OmniCookies.saveData.stockAverages[id] || me.stock == n) {
						OmniCookies.saveData.stockAverages[id] = {
							avgValue: realCostInS,
							totalValue: realCostInS*n
						};
					} else {
						let avg = OmniCookies.saveData.stockAverages[id];
						avg.totalValue += realCostInS*n;
						avg.avgValue = avg.totalValue/me.stock;
					}
				$&`
			}
		], `var M = Game.Objects['Bank'].minigame;`);
		stockMarket.sellGood = Util.replaceCode(stockMarket.sellGood, [
			{   // Subtract total bought stock value when selling
				pattern: `return true;`,
				replacement: `
					if(OmniCookies.saveData.stockAverages[id]) {
						let avg = OmniCookies.saveData.stockAverages[id];
						avg.totalValue -= avg.avgValue*n;
					}
				$&`
			}
		], `var M = Game.Objects['Bank'].minigame;`);
		/*stockMarket.goodTooltip = OmniCookies.replaceCode(stockMarket.goodTooltip, [
			{   // Shows the current total bought value on the tooltip
				// Disabled for now due to ugly text wrapping
				pattern: /me\.name\+' \(worth <b>\$'\+Beautify\(val\*me\.stock,2\)\+'<\/b>/,
				replacement: `$&, bought for <b>$$'+Beautify(OmniCookies.saveData.stockAverages[id] ? OmniCookies.saveData.stockAverages[id].totalValue : 0, 2)+'</b>`
			}
		]), `var M = Game.Objects['Bank'].minigame;`;*/
		stockMarket.drawGraph = Util.replaceCode(stockMarket.drawGraph, [
			{   // Draw line for profit threshold
				pattern: /}$/,
				replacement: `
					if(OmniCookies.settings.stockValueData && M.hoverOnGood != -1) {
						let me = M.goodsById[M.hoverOnGood];
						if(me.stock > 0 && OmniCookies.saveData.stockAverages[M.hoverOnGood]) {
							ctx.strokeStyle='#00ff00'; // green
							ctx.beginPath();
							let lineHeight = Math.floor(height-OmniCookies.saveData.stockAverages[M.hoverOnGood].avgValue*M.graphScale)+0.5;
							ctx.moveTo(width-1, lineHeight);
							ctx.lineTo(width-span*rows-1, lineHeight);
							ctx.stroke();
						}
					}
				$&`
			}
		], `var M = Game.Objects['Bank'].minigame;`);
		stockMarket.draw = Util.replaceCode(stockMarket.draw, [
			{   // Add a new display for the average bought value
				pattern: `//if (me.stock>0) me.stockL.style.color='#fff';`,
				replacement: `
					if(OmniCookies.settings.stockValueData) {
						if(!me.avgL) {
							let avgSpan = document.createElement('span');
							avgSpan.id = 'bankGood-'+me.id+'-avg';
							avgSpan.innerHTML = '(-)';
							document.getElementById('bankGood-'+me.id+'-stockBox').appendChild(avgSpan);
							me.avgL = avgSpan;
						}
						
						if(OmniCookies.saveData.stockAverages[me.id] && me.stock > 0) {
							me.avgL.style.visibility = 'visible';
							let avg = OmniCookies.saveData.stockAverages[me.id];
							me.avgL.innerHTML = ' ($$'+Beautify(avg.avgValue,2)+')';
							if(avg.avgValue < me.val) {
								me.avgL.classList.remove('red');
								me.avgL.classList.add('green');
							} else {
								me.avgL.classList.remove('green');
								me.avgL.classList.add('red');
							}
						} else {
							me.avgL.style.visibility = 'hidden';
							me.avgL.innerHTML = '';
						}
					} else {
						if(me.avgL) {
							me.avgL.remove();
							me.avgL = undefined;
						}
					}
				$&`
			}
		], `var M = Game.Objects['Bank'].minigame;`);
		stockMarket.toRedraw = 1;
	});
})

/** Allows buildings to bypass the Fancy graphics setting */
export let fancyBuildings = new Patch(function() {
	Game.Draw = Util.replaceCode(Game.Draw, [
		{
			pattern: 'if (Game.prefs.animate && ((Game.prefs.fancy && Game.drawT%1==0)',
			replacement: 'if (Game.prefs.animate && ((((Game.prefs.fancy || OmniCookies.settings.buildingsBypassFancy == 0) && OmniCookies.settings.buildingsBypassFancy != 1) && Game.drawT%1==0)'
		}
	]);
})

/** Allows cursors to bypass the Fancy graphics setting */
export let fancyCursors = new Patch(function() {
	Game.DrawBackground = Util.replaceCode(Game.DrawBackground, [
		{
			pattern: /(var fancy=)(Game\.prefs\.fancy)(;)/,
			replacement: '$1($2 || OmniCookies.settings.cursorsBypassFancy == 0) && OmniCookies.settings.cursorsBypassFancy != 1$3'
		}
	]);
})

/** Allows wrinklers to bypass the Fancy graphics setting */
export let fancyWrinklers = new Patch(function() {
	// Thanks Orteil -_-
	(window as any).inRect = function(x: number,y: number, rect: any): boolean {
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

	Game.UpdateWrinklers = Util.replaceCode(Game.UpdateWrinklers, [
		{
			pattern: /Game\.prefs\.fancy/g,
			replacement: `($& || OmniCookies.settings.wrinklersBypassFancy == 0) && OmniCookies.settings.wrinklersBypassFancy != 1`
		}
	]);
})

/** 
 * Properly displays the (seemingly intended) feature of partial buying in bulk.
 * Also makes the ALL button worth ALL, not 1000
 * Also allows using the ALL button in buy mode.
 */
export let buySellBulk = new Patch(function() {
	let rebuildPattern = [
		{
			pattern: `l('productPriceMult'+me.id).textContent=(Game.buyBulk>1)?('x'+Game.buyBulk+' '):'';`,
			replacement: `
				if(OmniCookies.settings.enhancedBulk) {
					let bulkAmount = -1;
					let bulkPrice = -1;
					if(Game.buyMode == -1) {
						bulkAmount = (Game.buyBulk > -1) ? Math.min(Game.buyBulk, me.amount) : me.amount;
					} else {
						let bulk = OmniCookies.Util.calcMaxBuyBulk(me, Game.buyBulk);
						bulkAmount = bulk.maxAmount;
						bulkPrice = bulk.maxPrice;
					}
					l('productPriceMult'+me.id).textContent = bulkAmount > 1 ? 'x' + bulkAmount + ' ' : '';
				} else {
					$&
				}
			`
		}
	];
	let refreshPattern = [
		{   // Set bulk buy price to maximum bulk price
			pattern: `if (Game.buyMode==1) this.bulkPrice=this.getSumPrice(Game.buyBulk);`,
			replacement: `if (Game.buyMode==1) {
				if(OmniCookies.settings.enhancedBulk) {
					let bulk = OmniCookies.Util.calcMaxBuyBulk(this,Game.buyBulk);
					this.bulkPrice = bulk.maxPrice > 0 ? bulk.maxPrice : this.price;
				} else {
					this.bulkPrice=this.getSumPrice(Game.buyBulk);
				}
			}`
		},
		{   // Sell ALL buildings, not only up to 1000
			pattern: `else if (Game.buyMode==-1 && Game.buyBulk==-1) this.bulkPrice=this.getReverseSumPrice(1000);`,
			replacement: `else if (Game.buyMode==-1 && Game.buyBulk==-1) this.bulkPrice=this.getReverseSumPrice(OmniCookies.settings.enhancedBulk ? this.amount : 1000);`
		}
	];

	for(let i in Game.Objects) {
		let building = Game.Objects[i];

		building.rebuild = Util.replaceCode(building.rebuild, rebuildPattern);
		building.refresh = Util.replaceCode(building.refresh, refreshPattern);
	}

	Game.Object = Util.replaceCode(Game.Object, rebuildPattern);
	Game.Object = Util.replaceCode(Game.Object, refreshPattern);

	Game.storeBulkButton = Util.replaceCode(Game.storeBulkButton, [
		{   // Allow using max button in buy mode
			pattern: `if (Game.buyMode==1 && Game.buyBulk==-1) Game.buyBulk=100;`,
			replacement: `
				if(id == 0 || id == 1) {
					let text = 'all';
					if(OmniCookies.settings.enhancedBulk) {
						if(Game.buyMode == -1) text = 'ALL';
						else text = 'MAX';
					}
					l('storeBulkMax').textContent = text;
				}
				if (!OmniCookies.settings.enhancedBulk && Game.buyMode==1 && Game.buyBulk==-1) Game.buyBulk=100;`
		},
		{   // Max button is always visible
			pattern: `l('storeBulkMax').style.visibility='hidden';`,
			replacement: `if(!OmniCookies.settings.enhancedBulk) $&`
		}
	]);

	Game.Logic = Util.replaceCode(Game.Logic, [
		{   // Record the current shortcut
			pattern: `if (!Game.promptOn)`,
			replacement: `
				let activeShortcut = (OmniCookies.Util.holdingButton(16)*2) | (OmniCookies.Util.holdingButton(17));
			$&`
		},
		{   // Always cause a setting update if there is a change in shortcut
			pattern: `if ((Game.keys[16] || Game.keys[17]) && !Game.buyBulkShortcut)`,
			replacement: `if (activeShortcut != OmniCookies.vars.prevShortcut && (OmniCookies.settings.enhancedBulk ? true : activeShortcut == 2 || activeShortcut == 1))`
		},
		{   // Only set Game.buyBulkOld when previously not holding either key
			pattern: `Game.buyBulkOld=Game.buyBulk;`,
			replacement: `if(OmniCookies.vars.prevShortcut == 0) Game.buyBulkOld=Game.buyBulk;`
		},
		{   // If holding both keys, switch to MAX/ALL
			pattern: `if (Game.keys[17]) Game.buyBulk=10;`,
			replacement: `$&
				if(activeShortcut == 3 && OmniCookies.settings.enhancedBulk) Game.buyBulk = -1;
			`
		},
		{   // Record state
			pattern: `//handle cookies`,
			replacement: `
				OmniCookies.vars.prevShortcut = activeShortcut;
			$&`
		}
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
		stockMarket.buyGood = Util.replaceCode(stockMarket.buyGood, [
			{   // Use Dissolve instead of Spend (to withhold cookies earned)
				pattern: `Game.Spend(cost*n);`,
				replacement: `
					if(OmniCookies.settings.dangerousStocks) {
						Game.Dissolve(cost*n);
					} else {
						$&
					}
				`
			}
		], `let M = Game.Objects['Bank'].minigame;`);
		stockMarket.sellGood = Util.replaceCode(stockMarket.sellGood, [
			{   // Start using Game.Earn again (to reinstate cookies earned)
				pattern: '//Game.Earn',
				replacement: `if(OmniCookies.settings.dangerousStocks) Game.Earn`
			},
			{   // Stop using direct setting
				pattern: /\tGame\.cookies/gm,
				replacement: `if(!OmniCookies.settings.dangerousStocks) $&`
			}
		], `let M = Game.Objects['Bank'].minigame;`);
	});
})

/** Adds a displayed value for each of Cyclius' cycles. */
export let cycliusInfo = new Patch(function() {
	Util.onMinigameLoaded('Temple', function() {
		let pantheon = Game.Objects['Temple'].minigame;
		let functionPattern = [
			{   // Allow functions to be used as descriptions
				pattern: /\+me\.desc(\w+)\+/g,
				replacement: `+((typeof me.desc$1 == 'function') ? me.desc$1() : me.desc$1)+`
			}
		];
		pantheon.godTooltip = Util.replaceCode(pantheon.godTooltip, 
			functionPattern, `let M = Game.Objects['Temple'].minigame;`);
		pantheon.slotTooltip = Util.replaceCode(pantheon.slotTooltip, 
			functionPattern, `let M = Game.Objects['Temple'].minigame;`);

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
	Game.Draw = Util.replaceCode(Game.Draw, [
		{
			pattern: `if (price<lastPrice) Game.storeToRefresh=1;`,
			replacement: `if (price<lastPrice && price!=0) Game.upgradesToRebuild=1;`
		}
	]);

	// use fast calc instead of loop calc
	for(let obj of Game.ObjectsById) {
		obj.getSumPrice=function(amount) {
			return Util.quickCalcBulkPrice(this, amount);
		}
		obj.getReverseSumPrice=function(amount) {
			return Util.quickCalcBulkPrice(this, amount, true);
		}
	}
})