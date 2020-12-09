OmniCookies = {
	name: 'Omniscient Cookies',
	version: 'v1.3.2'
};
OmniCookies.settings = {
	autoScrollbar: true,
	scrollingBuildings: true,
	smoothBuildings: true,
	buffTooltipDuration: true,
	betterBuildingTooltips: true,
	betterGrandmas: true,
	separateTechs: true,
	enhancedBulk: true,
	buildingsBypassFancy: 2,
	cursorsBypassFancy: 2,
	wrinklersBypassFancy: 2,
	optimizeBuildings: false,
	preserveWrinklers: false,
	detailedCyclius: true,
	zonedCyclius: false,
	trueCyclius: false,
	stockValueData: true,
	dangerousStocks: false
}

OmniCookies.saveData = {}
OmniCookies.defaultSave = function() {
	OmniCookies.saveData.stockAverages = [];
	OmniCookies.saveData.frozenWrinks = null;
}
OmniCookies.defaultSave();

//==============================//
//#region Utilities

// Used for replace-patching game code
// Takes in an array of objects with:
// - pattern: code pattern to replace
// - replacement: code to replace the matched pattern with
// Supports regex etc.
// Replacements are applied in order
OmniCookies.replaceCode = function(targetFunction, listReplacements, preEvalScript) {
	if(preEvalScript) eval(preEvalScript);
	let code = targetFunction.toString();
	let newCode = code;
	for(let i in listReplacements) {
		let patt = listReplacements[i].pattern;
		let repl = listReplacements[i].replacement;
		newCode = newCode.replace(patt, repl);
	}
	eval('var func = '+newCode);
	return func;
};

// Used to calculate the price and maximum buildings that can be bought from buying in bulk
// Returns an object with:
// - totalPrice: the total price of attempting to buy this many buildings
// - maxPrice: the maximum price that can be currently afforded
// - maxAmount: the maximum amount of buildings that can be currently afforded
OmniCookies.calcMaxBuyBulk = function(building, amount) {
	let totalPrice = 0;
	let maxPrice = 0;
	let maxAmount = 0;
	if(amount == -1) amount = Infinity;

	// if you have infinity, you can get infinity. yep
	// will you have infinity? if you're cheating maybe lol
	// oh but please don't do this while the vanilla game still uses for loops
	// you'll just crash anyways
	if(Game.cookies == Infinity && amount == Infinity) {
		return { totalPrice: Infinity, maxPrice: Infinity, maxAmount: amount };
	}
	
	totalPrice = OmniCookies.quickCalcBulkPrice(building, amount);
	maxAmount = Math.min(amount, OmniCookies.quickCalcMaxBuy(building) + building.free);
	maxPrice = OmniCookies.quickCalcBulkPrice(building, maxAmount);

	return {
		totalPrice: totalPrice,
		maxPrice: maxPrice,
		maxAmount: maxAmount
	};
}

// Calculates the value of the sum of given range of powers of X
// Can be used to calculate bulk building prices
OmniCookies.powerSumRange = function(x, start, end) {
	if(x < 0) return -1;           // please don't
	if(x == 0) return 0;           // obviously
	if(x == 1) return end - start; // come on man
	if(start == end) return x**start; // really, this is getting old
	
	let sum1 = (x**(start) - 1)/(x - 1); // sum from 0 to start-1
	let sum2 = (x**(end+1) - 1)/(x - 1);   // sum from 0 to end
	return sum2 - sum1; // sum from start to end
}

// Fast function for calculating the maximum # of a building that can be bought
// Thanks to staticvariablejames on the Discord server
OmniCookies.quickCalcMaxBuy = function(building) {
    let cookies = Game.cookies;
    cookies /= Game.modifyBuildingPrice(building, building.basePrice);
	let boughtCount = building.amount - building.free;
	let priceInc = Game.priceIncrease;
    return Math.floor(Math.log(priceInc**boughtCount + (priceInc - 1)*cookies)/Math.log(priceInc) - building.amount);
}

// Fast function for calculating the price of # buildings
OmniCookies.quickCalcBulkPrice = function(building, bulk, sell) {
	let buildingCount = Math.max(0, building.amount - building.free);
	let sum = OmniCookies.powerSumRange(Game.priceIncrease, buildingCount, buildingCount + bulk-1);
	sum = Game.modifyBuildingPrice(building, sum*building.basePrice);
	if(sell) sum *= building.getSellMultiplier();
	return Math.ceil(sum);
}

// Returns the progress of a cycle, starting from Jan 1, 1970, 00:00:00, UTC time.
// Interval is how many hours each cycle is.
// Returned value is in radians, as part of a full rotation.
// If zonedCyclius is on, offsets the cycle as though it were GMT+1 time.
OmniCookies.cycliusCalc = function(interval) {
	let cycle = (Date.now()/1000/(60*60*interval));
	if(OmniCookies.settings.zonedCyclius) {
		cycle += (new Date().getTimezoneOffset() + 60)/60/interval
	}
	cycle %= 1;
	return cycle*Math.PI*2;
}

OmniCookies.loadData = function(data, into) {
	if(data) {
		for(key of Object.keys(data)) {
			if(key in into) {
				// convert from old boolean buttons to new optioned buttons
				// for these buttons in particular, 0 was "on" and 2 is now "off"
				if(typeof data[key] == 'boolean' && typeof into[key] == 'number') {
					data[key] = data[key] ? 0 : 2;
				}
				into[key] = data[key];
			}
		}
	}
}

//#endregion
//==============================//

//==============================//
//#region Config

OmniCookies.toggleSetting = function(buttonId, settingName, onText, offText, onFunction, offFunction) {
    OmniCookies.settings[settingName] = !OmniCookies.settings[settingName];
    let element = document.getElementById(buttonId);
    if(OmniCookies.settings[settingName]) {
        element.classList.remove("off");
		element.innerHTML = onText;
        if(onFunction) onFunction();
    } else {
        element.classList.add("off");
        element.innerHTML = offText;
        if(offFunction) offFunction();
    }
    PlaySound('snd/tick.mp3');
}

OmniCookies.toggleOptionedSetting = function(buttonId, settingName, options) {
	OmniCookies.settings[settingName]++;
	if(OmniCookies.settings[settingName] >= options.length) OmniCookies.settings[settingName] = 0;
	let element = document.getElementById(buttonId);
	let selected = options[OmniCookies.settings[settingName]];
	if(selected.off) element.classList.add('off');
	else element.classList.remove('off');
	if(selected.func) selected.func();
	element.innerHTML = selected.text;
    PlaySound('snd/tick.mp3');
}

OmniCookies.makeButton = function(settingName, onText, offText, desc, onFunctionName, offFunctionName) {
	let div = document.createElement('div');
	
	let set = OmniCookies.settings[settingName];
	let buttonId = "OmniCookiesButton_" + settingName;
	var a = document.createElement('a');
	a.id = buttonId;
	a.className = 'option' + (set ? '' : ' off');
	a.onclick = function() {OmniCookies.toggleSetting(buttonId, settingName, onText, offText, onFunctionName, offFunctionName)};
	a.textContent = set ? onText : offText;
	div.appendChild(a);

	var label = document.createElement('label');
	label.textContent = desc;
	div.appendChild(label);

	return div;
}

OmniCookies.makeOptionedButton = function(settingName, desc, options) {
	let div = document.createElement('div');
	
	let set = OmniCookies.settings[settingName];
	let selected = options[set];
	let buttonId = "OmniCookiesButton_" + settingName;
	var a = document.createElement('a');
	a.id = buttonId;
	a.className = 'option' + (selected.off ? ' off' : '');
	a.onclick = function() {OmniCookies.toggleOptionedSetting(buttonId, settingName, options)};
	a.textContent = selected.text;
	div.appendChild(a);

	var label = document.createElement('label');
	label.textContent = desc;
	div.appendChild(label);

	return div;
}

OmniCookies.makeHeader = function(text) {
	var div = document.createElement('div');
	div.className = 'listing';
	div.style.padding = '5px 16px';
	div.style.opacity = '0.7';
	div.style.fontSize = '17px';
	div.style.fontFamily = '\"Kavoon\", Georgia, serif';
	div.appendChild(document.createTextNode(text));
	return div;
}

OmniCookies.customOptionsMenu = function() {
	if(!(Game.onMenu == 'prefs')) return;

	let frag = document.createDocumentFragment();

	let title = document.createElement('div');
	title.className = 'title';
	title.textContent = `${OmniCookies.name} ${OmniCookies.version}`;
	frag.appendChild(title);

	frag.appendChild(OmniCookies.makeHeader("Graphical tweaks"));

	//==========================//
	//#region Graphics settings

	let gfxList = document.createElement('div');
	gfxList.className = 'listing';

	gfxList.appendChild(OmniCookies.makeButton('autoScrollbar',
		'Autohide center scrollbar ON', 'Autohide center scrollbar OFF',
		'(the scrollbar in the center view will hide itself when appropriate)',
		OmniCookies.autoScrollbar, OmniCookies.showScrollbar
	));

	gfxList.appendChild(OmniCookies.makeButton('scrollingBuildings',
		'Scroll buildings ON', 'Scroll buildings OFF',
		'(hovering over the left/right edges of buildings produces a scroll effect)'
	));

	gfxList.appendChild(OmniCookies.makeButton('smoothBuildings',
		'Smooth buildings ON', 'Smooth buildings OFF',
		'(buildings draw every frame, instead of every 3 frames)'
	));

	gfxList.appendChild(OmniCookies.makeButton('betterBuildingTooltips',
		'Improved building tooltips ON', 'Improved building tooltips OFF',
		'(building tooltips in the shop look a little better; disabling requires refresh)',
		function() { OmniCookies.patchBuildingTooltips(); }
	));

	gfxList.appendChild(OmniCookies.makeButton('betterGrandmas',
		'Grandma fixes ON', 'Grandma fixes OFF',
		'(text and ordering fixes for grandma synergy upgrades; disabling requires refresh)',
		function() { OmniCookies.patchGrandmaUpgrades(); }
	));

	gfxList.appendChild(OmniCookies.makeButton('separateTechs',
		'Separate techs ON', 'Separate techs OFF',
		'(gives tech upgrades their own upgrade category under cookies)',
		function() { OmniCookies.patchTechUpgradeMenu(); }
	));

	gfxList.appendChild(OmniCookies.makeOptionedButton('buildingsBypassFancy',
		'(buildings follow this setting rather than default)', [
			{ text: 'Buildings always FANCY' },
			{ text: 'Buildings always FAST' },
			{ text: 'Buildings always DEFAULT', off: true }
		]
	));

	gfxList.appendChild(OmniCookies.makeOptionedButton('cursorsBypassFancy',
		'(cursors follow this setting rather than default)', [
			{ text: 'Cursors always FANCY' },
			{ text: 'Cursors always FAST' },
			{ text: 'Cursors always DEFAULT', off: true }
		]
	));

	gfxList.appendChild(OmniCookies.makeOptionedButton('wrinklersBypassFancy',
		'(wrinklers follow this setting rather than default)', [
			{ text: 'Wrinklers always FANCY' },
			{ text: 'Wrinklers always FAST' },
			{ text: 'Wrinklers always DEFAULT', off: true }
		]
	));

	frag.appendChild(gfxList);

	//#endregion
	//==========================//

	frag.appendChild(OmniCookies.makeHeader("Quality of Life"));

	//==========================//
	//#region QoL settings

	let qolList = document.createElement('div');
	qolList.className = 'listing';

	qolList.appendChild(OmniCookies.makeButton('enhancedBulk',
		'Enhanced bulk ON', 'Enhanced bulk OFF',
		'(allows partial and maximum bulk purchases)',
		function() {OmniCookies.updateBulkAll()}, function() {OmniCookies.updateBulkAll()}
	));

	qolList.appendChild(OmniCookies.makeButton('buffTooltipDuration',
		'Show buff duration in tooltip ON', 'Show buff duration in tooltip OFF',
		'(buffs will show their current duration in their tooltip)'
	));

	frag.appendChild(qolList);

	//#endregion
	//==========================//

	frag.appendChild(OmniCookies.makeHeader("Stock Market"));

	//==========================//
	//#region Stock Market settings

	let stockList = document.createElement('div');
	stockList.className = 'listing';

	stockList.appendChild(OmniCookies.makeButton('stockValueData',
		'Stock value data ON', 'Stock value data OFF',
		'(displays information about how profitable your stocks are)'
	));

	stockList.appendChild(OmniCookies.makeButton('dangerousStocks',
		'Dangerous stocks ON', 'Dangerous stocks OFF',
		'(stock market affects total cookies earned)'
	));

	frag.appendChild(stockList);

	//#endregion
	//==========================//

	frag.appendChild(OmniCookies.makeHeader("Pantheon"));

	//==========================//
	//#region Pantheon settings

	let pantheonList = document.createElement('div');
	pantheonList.className = 'listing';

	pantheonList.appendChild(OmniCookies.makeButton('detailedCyclius',
		'Cyclius details ON', 'Cyclius details OFF',
		'(shows Cyclius\' current cycles in his tooltip)',
		function() { OmniCookies.toggleCyclius(); }
	));
	
	pantheonList.appendChild(OmniCookies.makeButton('zonedCyclius',
		'Zoned Cyclius ON', 'Zoned Cyclius OFF',
		'(offsets Cyclius based on your time zone, towards GMT+1)',
		function() { Game.recalculateGains = 1; },
		function() { Game.recalculateGains = 1; }
	));

	pantheonList.appendChild(OmniCookies.makeButton('trueCyclius',
		'True Cyclius ON', 'True Cyclius OFF',
		'(Cyclius shows off his power with style)'
	));

	frag.appendChild(pantheonList);

	//#endregion
	//==========================//

	frag.appendChild(OmniCookies.makeHeader("Experimental"));

	//==========================//
	//#region Experimental settings

	let expList = document.createElement('div');
	expList.className = 'listing';

	expList.appendChild(OmniCookies.makeButton('optimizeBuildings',
		'Buildings draw smart ON', 'Buildings draw smart OFF',
		'(experimental; buildings attempt to skip unnecessary draw frames)'
	));

	expList.appendChild(OmniCookies.makeButton('preserveWrinklers',
		'Preserve wrinklers ON', 'Preserve wrinklers OFF',
		'(experimental; attempts to preserve all wrinkler data on game save/load)'
	));

	frag.appendChild(expList);

	//#endregion
	//==========================//

	l('menu').childNodes[2].insertBefore(frag, l('menu').childNodes[2].childNodes[l('menu').childNodes[2].childNodes.length - 1]);
}

// Patch Game.UpdateMenu to shove in our menu
OmniCookies.patchUpdateMenu = function() {
	Game.UpdateMenu = OmniCookies.replaceCode(Game.UpdateMenu, [
		{
			pattern: /}$/,
			replacement: 'OmniCookies.customOptionsMenu();$&'
		}
	]);
}

//#endregion
//==============================//

//==============================//
//#region Features

// Modifies CSS to automatically hide the scroll bar in the building display
OmniCookies.autoScrollbar = function() {
	var center = document.getElementById('centerArea');
	center.style.overflowY = 'auto';
}
OmniCookies.showScrollbar = function() {
	var center = document.getElementById('centerArea');
	center.style.overflowY = 'scroll';
}

// Make buildings redraw every frame
// This allows the building scroll to appear smooth
OmniCookies.smoothBuildings = function() {
	Game.DrawBuildings = OmniCookies.replaceCode(Game.DrawBuildings, [
		{
			pattern: 'Game.drawT%3==0',
			replacement: 'OmniCookies.settings.smoothBuildings || $&'
		}
	]);
}

// Patches buildings to support scrolling feature
OmniCookies.patchBuildings = function() {
	let drawPattern = [
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
				if(OmniCookies.settings.optimizeBuildings && !this.hasUnloadedImages && !this.forceDraw && !this.lastMouseOn && !this.mouseOn && (this.lastAmount == this.amount)) return;
				this.forceDraw = false;
				this.lastAmount = this.amount;
				this.lastMouseOn = this.mouseOn;
				this.hasUnloadedImages = Game.Loader.assetsLoaded.indexOf(this.art.bg) == -1;
				$&`
		},
		{   // Check for unloaded building pics
			pattern: 'var sprite=Pic(pic.pic);',
			replacement: '$&\nthis.hasUnloadedImages |= sprite == Game.Loader.blank;'
		},
		{   // Scroll the background with the scroll offset
			pattern: '0,0,this.canvas.width,this.canvas.height,128,128',
			replacement: '$&,-Math.floor(this.scrollOffX)'
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
					this.scrollOffX += speed * ((this.mousePos[0] - (this.canvas.width - 100)) / 100);
				}
				if(this.mousePos[0] <= 100 && this.scrollOffX > 0) {
					this.scrollOffX -= speed * (1 - this.mousePos[0] / 100);
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
		}
	];
	let mutePattern = [
		{   // Force draw on unmute
			pattern: 'this.muted=val;',
			replacement: '$&\nthis.forceDraw=true;'
		}
	];
	let redrawPattern = [
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
		let building = Game.Objects[i];
		if(building.id != 0) {
			building.scrollOffX = 0;
			building.lastRandX = 0;
			building.lastRandY = 0;
			building.lastOffX = 0;
			building.lastMouseOn = building.mouseOn;
			building.lastAmount = building.amount;
			building.hasUnloadedImages = true;
			building.forceDraw = true;
		
			building.draw = OmniCookies.replaceCode(building.draw, drawPattern);
			building.mute = OmniCookies.replaceCode(building.mute, mutePattern);
			building.redraw = OmniCookies.replaceCode(building.redraw, redrawPattern);
		}
	};

	// Inject into Object to affect all future building types
	Game.Object = OmniCookies.replaceCode(Game.Object, drawPattern);
	Game.Object = OmniCookies.replaceCode(Game.Object, [
		{   // Define variables
			pattern: '//building canvas',
			replacement: `
				this.scrollOffX = 0;
				this.lastRandX = 0;
				this.lastRandY = 0;
				this.lastOffX = 0;
				this.lastMouseOn = this.mouseOn;
				this.lastAmount = this.amount;
				this.hasUnloadedImages = true;
				this.forceDraw = true;
			$&`
		}
	]);
	Game.Object = OmniCookies.replaceCode(Game.Object, mutePattern);
	Game.Object = OmniCookies.replaceCode(Game.Object, redrawPattern);
}

// Patches building tooltips to look a bit better in some cases
OmniCookies.patchBuildingTooltips = function() {
	if(OmniCookies.patchedBuildingTooltips) return;
	OmniCookies.patchedBuildingTooltips = true;

	let tooltipPattern = [
		{
			pattern: 'if (synergiesStr!=\'\') synergiesStr+=\', \';',
			replacement: 'synergiesStr += \'<br>&nbsp;&nbsp;&nbsp;&nbsp;- \''
		},
		{
			pattern: 'synergiesStr+=i+\' +\'+Beautify(synergiesWith[i]*100,1)+\'%\';',
			replacement: 'synergiesStr+=i+\' <b>+\'+Beautify(synergiesWith[i]*100,1)+\'%</b>\';'
		},
		{
			pattern: 'synergiesStr=\'...also boosting some other buildings : \'+synergiesStr+\' - all',
			replacement: 'synergiesStr=\'...also boosting some other buildings: \'+synergiesStr+\'<br>&bull; all'
		},
		{
			pattern: '<div class="data"',
			replacement: '$& style="white-space:nowrap;"'
		}
	];

	for(var i in Game.Objects) {
		var building = Game.Objects[i];
		building.tooltip = OmniCookies.replaceCode(building.tooltip, tooltipPattern);
	}

	Game.Object = OmniCookies.replaceCode(Game.Object, tooltipPattern);
}

// Patches buff tooltips to show remaining time
OmniCookies.patchBuffTooltips = function() {
	OmniCookies.buffsById = [];

	// Edit existing buffs from loaded savegame
	for(let i in Game.buffs) {
		let buff = Game.buffs[i];
		OmniCookies.buffsById[buff.id] = buff;
		let onmouseover = function() {
			if (!Game.mouseDown) {
				Game.setOnCrate(this);
				Game.tooltip.dynamic=1;
				Game.tooltip.draw(this, function(){return OmniCookies.GetBuffTooltipFunc(buff.id)();},'left');
				Game.tooltip.wobble();
			}
		}
		onmouseover = onmouseover.toString().replace('function() {', '').replace(/}$/, '').replace('buff.id', buff.id);
		Game.buffsL.getElementsByClassName('crate enabled buff')[buff.id].setAttribute('onmouseover', onmouseover);
	}

	Game.gainBuff = OmniCookies.replaceCode(Game.gainBuff, [
		{   // Place buff somewhere we can access it later
			pattern: 'Game.buffsL.',
			replacement: 'OmniCookies.buffsById[buff.id] = buff;$&'
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
			replacement: `Game.getDynamicTooltip('(OmniCookies.GetBuffTooltipFunc('+buff.id+'))', 'left', true)`
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

	OmniCookies.GetBuffTooltipFunc = function(buffId) {
		return function() {
			let buff = OmniCookies.buffsById[buffId];

			// Use the test header to create buffer room for the feather images
			test.textContent = buff.name;
			let width = Math.max(200, test.clientWidth + 78);

			let buffDesc = buff.desc.replace(Game.sayTime(buff.maxTime,-1),'$&');
			let text = '<div class="prompt" style="white-space:nowrap;min-width:'+width+'px;text-align:center;font-size:11px;margin:8px 0px;"><h3>'+buff.name+'</h3>'+'<div class="line"></div>'+buffDesc;
			if(OmniCookies.settings.buffTooltipDuration) 
				text += '<div class="line"></div>'+Game.sayTime(buff.time,-1)+' left';
			text += '</div>';
			return text;
		};
	}

	// Patch Stretch Time success roll to update buff description
	let patchGrimoire = setInterval(function() {
		let minigame = Game.Objects['Wizard tower'].minigame;
		if(minigame) {
			minigame.spells['stretch time'].win = OmniCookies.replaceCode(minigame.spells['stretch time'].win, [
				{
					pattern: 'me.maxTime+=gain;',
					replacement: 'me.desc = me.desc.replace(Game.sayTime(me.maxTime,-1), Game.sayTime(me.maxTime + gain,-1));$&'
				}
			]);
			clearInterval(patchGrimoire);
		}
	}, 250);
}

// Adds a line break to grandma synergy upgrades
// Fixes the ordering of grandma upgrades in the stats menu
OmniCookies.patchGrandmaUpgrades = function() {
	if(OmniCookies.patchedGrandmas) return;
	OmniCookies.patchedGrandmas = true;

	// Add a line break between the two effects
	for(let i of Game.GrandmaSynergies) {
		let upgrade = Game.Upgrades[i];
		upgrade.desc = upgrade.desc.replace(/(efficient\.) /, '$1<br>');
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
}

// Creates a new area for Tech upgrades under the Cookie upgrades
OmniCookies.patchTechUpgradeMenu = function() {
	if(OmniCookies.patchedTechUpgrades) return;
	OmniCookies.patchedTechUpgrades = true;

	Game.UpdateMenu = OmniCookies.replaceCode(Game.UpdateMenu, [
		{   // Declare techUpgrades var
			pattern: 'var cookieUpgrades=\'\';',
			replacement: '$&\nvar techUpgrades = \'\''
		},
		{   // Redirect tech upgrades to the new accumulator string
			pattern: 'else if (me.pool!=\'toggle\'',
			replacement: 'else if (OmniCookies.settings.separateTechs && me.pool == \'tech\') techUpgrades+=str2;\n$&'
		},
		{   // Display the new category
			pattern: 'cookieUpgrades+\'</div>\'):\'\')+',
			replacement: `$&
				(techUpgrades!=''?('<div class="listing"><b>Technologies</b></div>'+
				'<div class="listing crateBox">'+techUpgrades+'</div>'):'')+
			`
		}
	]);
}

// Allows buildings to bypass the Fancy graphics setting
OmniCookies.patchFancyBuildings = function() {
	Game.Draw = OmniCookies.replaceCode(Game.Draw, [
		{
			pattern: 'if (Game.prefs.animate && ((Game.prefs.fancy && Game.drawT%1==0)',
			replacement: 'if (Game.prefs.animate && ((((Game.prefs.fancy || OmniCookies.settings.buildingsBypassFancy == 0) && OmniCookies.settings.buildingsBypassFancy != 1) && Game.drawT%1==0)'
		}
	]);
}

// Allows cursors to bypass the Fancy graphics setting
OmniCookies.patchFancyCursors = function() {
	Game.DrawBackground = OmniCookies.replaceCode(Game.DrawBackground, [
		{
			pattern: /(var fancy=)(Game\.prefs\.fancy)(;)/,
			replacement: '$1($2 || OmniCookies.settings.cursorsBypassFancy == 0) && OmniCookies.settings.cursorsBypassFancy != 1$3'
		}
	]);
}

// Allows wrinklers to bypass the Fancy graphics setting
OmniCookies.patchFancyWrinklers = function() {
	Game.UpdateWrinklers = OmniCookies.replaceCode(Game.UpdateWrinklers, [
		{
			pattern: /Game\.prefs\.fancy/g,
			replacement: `($& || OmniCookies.settings.wrinklersBypassFancy == 0) && OmniCookies.settings.wrinklersBypassFancy != 1`
		}
	], `var inRect = function(x,y,rect)
		{
			//find out if the point x,y is in the rotated rectangle rect{w,h,r,o} (width,height,rotation in radians,y-origin) (needs to be normalized)
			//I found this somewhere online I guess
			var dx = x+Math.sin(-rect.r)*(-(rect.h/2-rect.o)),dy=y+Math.cos(-rect.r)*(-(rect.h/2-rect.o));
			var h1 = Math.sqrt(dx*dx + dy*dy);
			var currA = Math.atan2(dy,dx);
			var newA = currA - rect.r;
			var x2 = Math.cos(newA) * h1;
			var y2 = Math.sin(newA) * h1;
			if (x2 > -0.5 * rect.w && x2 < 0.5 * rect.w && y2 > -0.5 * rect.h && y2 < 0.5 * rect.h) return true;
			return false;
		}`);
}

// Properly displays the (seemingly intended) feature of partial buying in bulk.
// Also makes the ALL button worth ALL, not 1000
// Also allows using the ALL button in buy mode.
OmniCookies.patchBuySellBulk = function() {
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
						let bulk = OmniCookies.calcMaxBuyBulk(me, Game.buyBulk);
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
					let bulk = OmniCookies.calcMaxBuyBulk(this,Game.buyBulk);
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

		building.rebuild = OmniCookies.replaceCode(building.rebuild, rebuildPattern);
		building.refresh = OmniCookies.replaceCode(building.refresh, refreshPattern);
	}

	Game.Object = OmniCookies.replaceCode(Game.Object, rebuildPattern);
	Game.Object = OmniCookies.replaceCode(Game.Object, refreshPattern);

	Game.storeBulkButton = OmniCookies.replaceCode(Game.storeBulkButton, [
		{   // Allow using max button in buy mode
			pattern: `if (Game.buyMode==1 && Game.buyBulk==-1) Game.buyBulk=100;`,
			replacement: `if (!OmniCookies.settings.enhancedBulk && Game.buyMode==1 && Game.buyBulk==-1) Game.buyBulk=100;`
		},
		{   // Max button is always visible
			pattern: `l('storeBulkMax').style.visibility='hidden';`,
			replacement: `if(!OmniCookies.settings.enhancedBulk) $&`
		}
	]);
	
	
	OmniCookies.updateBulkAll();
}

// For now, this just patches Cyclius.
// Adds a displayed value for each of Cyclius' cycles.
OmniCookies.patchPantheonInfo = function() {
	let patchPantheonInfoInterval = setInterval(function() {
		let pantheon = Game.Objects['Temple'].minigame;
		if(pantheon) {
			let functionPattern = [
				{   // Allow functions to be used as descriptions
					pattern: /\+me\.desc(\w+)\+/g,
					replacement: `+((typeof me.desc$1 == 'function') ? me.desc$1() : me.desc$1)+`
				}
			];
			pantheon.godTooltip = OmniCookies.replaceCode(pantheon.godTooltip, 
				functionPattern, `var M = Game.Objects['Temple'].minigame;`);
			pantheon.slotTooltip = OmniCookies.replaceCode(pantheon.slotTooltip, 
				functionPattern, `var M = Game.Objects['Temple'].minigame;`);

			// Display Cyclius values
			let cycliusFunc = function(interval) {
				return function() {
					let effect = '';
					if(OmniCookies.settings.detailedCyclius) {
						let mult = 0.15*Math.sin(OmniCookies.cycliusCalc(interval)) * 100;
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
			let cyclius = pantheon.gods['ages'];
			OmniCookies.toggleCyclius();
			cyclius.desc1 = cycliusFunc(3);
			cyclius.desc2 = cycliusFunc(12);
			cyclius.desc3 = cycliusFunc(24);

			clearInterval(patchPantheonInfoInterval);
		}
	}, 250);
}
OmniCookies.toggleCyclius = function() {
	let pantheon = Game.Objects['Temple'].minigame;
	let cyclius = pantheon.gods['ages'];
	if(cyclius.activeDescFunc) {
		cyclius.activeDescBackup = cyclius.activeDescFunc;
		cyclius.activeDescFunc = undefined; // I'm sorry
	} else {
		cyclius.activeDescFunc = cyclius.activeDescBackup;
		cyclius.activeDescBackup = undefined; // I'm really, really sorry
	}
}

// Updates the bulk buy selection for when the option is toggled
OmniCookies.updateBulkAll = function() {
	if(Game.buyMode == 1) {
		if(Game.buyBulk == -1 && !OmniCookies.settings.enhancedBulk) Game.storeBulkButton(4);
		l('storeBulkMax').style.visibility = OmniCookies.settings.enhancedBulk ? 'visible' : 'hidden';
	}
	l('storeBulkMax').textContent = OmniCookies.settings.enhancedBulk ? 'ALL' : 'all';
	Game.RefreshStore();
}

// Fix stock market to use established cookie manipulation options
// You can now lose some of your earned cookies this way - or gain them!
OmniCookies.patchDangerousStocks = function() {
	OmniCookies.patchedDangerousStocks = true;

	let patchStockMarket = setInterval(function() {
		let stockMarket = Game.Objects['Bank'].minigame;
		if(stockMarket) {
			stockMarket.buyGood = OmniCookies.replaceCode(stockMarket.buyGood, [
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
			], `var M = Game.Objects['Bank'].minigame;`);
			stockMarket.sellGood = OmniCookies.replaceCode(stockMarket.sellGood, [
				{   // Start using Game.Earn again (to reinstate cookies earned)
					pattern: '//Game.Earn',
					replacement: `if(OmniCookies.settings.dangerousStocks) Game.Earn`
				},
				{   // Stop using direct setting
					pattern: /\tGame\.cookies/gm,
					replacement: `if(!OmniCookies.settings.dangerousStocks) $&`
				}
			], `var M = Game.Objects['Bank'].minigame;`);
			clearInterval(patchStockMarket);
		}
	}, 250);
}

// Displays information about how much you bought your stocks for
OmniCookies.patchStockInfo = function() {
	let patchStockMarket = setInterval(function() {
		let stockMarket = Game.Objects['Bank'].minigame;
		if(stockMarket) {
			stockMarket.buyGood = OmniCookies.replaceCode(stockMarket.buyGood, [
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
			stockMarket.sellGood = OmniCookies.replaceCode(stockMarket.sellGood, [
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
			stockMarket.drawGraph = OmniCookies.replaceCode(stockMarket.drawGraph, [
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
			stockMarket.draw = OmniCookies.replaceCode(stockMarket.draw, [
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
			clearInterval(patchStockMarket);
		}
	}, 250);
}

// Restores wrinklers to their original positions and values
// Checks against current wrinklers to prevent wrinkler duplication
// Why doesn't the vanilla game do this...?
OmniCookies.cryosleepWrinklers = function() {
	OmniCookies.settings.preserveWrinklers ? OmniCookies.saveData.frozenWrinks = Game.wrinklers : null;
}
OmniCookies.thawWrinklers = function() {
	if(OmniCookies.settings.preserveWrinklers && OmniCookies.saveData.frozenWrinks) {
		let realWrinks = Game.wrinklers;
		let currentWrinks = Game.SaveWrinklers();
		Game.wrinklers = OmniCookies.saveData.frozenWrinks;
		let thawedWrinks = Game.SaveWrinklers();
		for(var attr in currentWrinks) {
			let ratio = Math.min(currentWrinks[attr]/thawedWrinks[attr], thawedWrinks[attr]/currentWrinks[attr]);
			if(currentWrinks[attr] != thawedWrinks[attr] && ratio < 0.999) {
				Game.wrinklers = realWrinks;
				return;
			}
		}
	}
}

// Rotates Cyclius along with his current cycle
OmniCookies.trueCyclius = function() {
	let cyclius = document.getElementById('templeGod3');
	if(cyclius) {
		let icon = cyclius.getElementsByClassName('usesIcon')[0];
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
				OmniCookies.patchedTrueCyclius = true;
			}

			let interval = 0;
			let rotation = 0;
			if(OmniCookies.settings.trueCyclius) {
				switch(slot) {
					case 1: interval = 3; break;
					case 2: interval = 12; break;
					case 3: interval = 24; break;
				}
				rotation = OmniCookies.cycliusCalc(interval) - Math.PI/2;
				icon.style.setProperty('transform', `rotate(${rotation}rad)`);
			} else {
				icon.style.removeProperty('transform');
			}
		} else {
			if(OmniCookies.patchedTrueCyclius) icon.style.removeProperty('transform');
		}
	} else {
		OmniCookies.patchedTrueCyclius = false;
	}
}

// Replaces cyclius gain function with our own
// It's the same, unless zonedCyclius is enabled
OmniCookies.patchCycliusGains = function() {
	Game.CalculateGains = OmniCookies.replaceCode(Game.CalculateGains, [
		{
			pattern: /\(Date\.now\(\)\/1000\/\(60\*60\*(\d+)\)\)\*Math\.PI\*2/g,
			replacement: 'OmniCookies.cycliusCalc($1)'
		}
	]);
}

//#endregion
//==============================//

//==============================//
//#region Modding API

OmniCookies.init = function() {
	OmniCookies.smoothBuildings();
	OmniCookies.patchBuildings();
	OmniCookies.patchBuffTooltips();
	OmniCookies.patchUpdateMenu();
	OmniCookies.patchFancyBuildings();
	OmniCookies.patchFancyCursors();
	OmniCookies.patchFancyWrinklers();
	OmniCookies.patchStockInfo();
	OmniCookies.patchDangerousStocks();
	OmniCookies.patchPantheonInfo();
	OmniCookies.patchCycliusGains();

	Game.registerHook('logic', function() {
		// On enhanced bulk setting, regularly refresh the store to account for changes in cookies
		if(OmniCookies.settings.enhancedBulk && Game.T%10==0) Game.RefreshStore();
	});

	Game.registerHook('draw', function() {
		// Update Cyclius' display of raw power
		OmniCookies.trueCyclius();
	});

	Game.registerHook('reset', function(hard) {
		// Reset stock average data and frozen wrinklers when resetting
		OmniCookies.defaultSave();
	});

	Game.Notify(`Loaded ${OmniCookies.name} ${OmniCookies.version}`,'',0,3);
}

OmniCookies.save = function() {
	OmniCookies.cryosleepWrinklers();
	return JSON.stringify({
		settings: OmniCookies.settings,
		saveData: OmniCookies.saveData
	});
}

OmniCookies.load = function(str) {
	var data = JSON.parse(str);
	var settings = data.settings;
	var saveData = data.saveData;
	OmniCookies.loadData(settings, OmniCookies.settings);
	OmniCookies.loadData(saveData, OmniCookies.saveData);

	OmniCookies.patchBuySellBulk();
	OmniCookies.thawWrinklers();

	OmniCookies.settings.autoScrollbar ? OmniCookies.autoScrollbar() : OmniCookies.showScrollbar();
	OmniCookies.settings.betterBuildingTooltips ? OmniCookies.patchBuildingTooltips() : null;
	OmniCookies.settings.betterGrandmas ? OmniCookies.patchGrandmaUpgrades() : null;
	OmniCookies.settings.separateTechs ? OmniCookies.patchTechUpgradeMenu() : null;
}

//#endregion
//==============================//

Game.registerMod(OmniCookies.name, OmniCookies);
