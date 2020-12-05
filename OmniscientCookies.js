OmniCookies = {
	name: 'Omniscient Cookies',
	version: 'v1.2.2'
};

OmniCookies.settings = {
	autoScrollbar: true,
	scrollingBuildings: true,
	smoothBuildings: true,
	buffTooltipDuration: true,
	betterBuildingTooltips: true
}

//==============================//
//#region Utilities

// Used for replace-patching game code
// Takes in an array of objects with:
// - pattern: code pattern to replace
// - replacement: code to replace the matched pattern with
// Supports regex etc.
// Replacements are applied in order
OmniCookies.replaceCode = function(targetFunction, listReplacements) {
	let code = targetFunction.toString();
	let newCode = code;
	for(let i in listReplacements) {
		let patt = listReplacements[i].pattern;
		let repl = listReplacements[i].replacement;
		newCode = newCode.replace(patt, repl);
	}
	return (new Function('return ' + newCode))();
};

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

OmniCookies.makeButton = function(settingName, onText, offText, desc, onFunctionName, offFunctionName) {
	let div = document.createElement('div');
	div.className = 'listing';
	
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

OmniCookies.customOptionsMenu = function() {
	if(!(Game.onMenu == 'prefs')) return;

	let frag = document.createDocumentFragment();

	let title = document.createElement('div');
	title.className = 'title';
	title.textContent = 'Omniscient Cookies';
	frag.appendChild(title);

	frag.appendChild(OmniCookies.makeButton('autoScrollbar',
		'Autohide center scrollbar ON', 'Autohide center scrollbar OFF',
		'(the scrollbar in the center view will hide itself when appropriate)',
		OmniCookies.autoScrollbar, OmniCookies.showScrollbar
	));

	frag.appendChild(OmniCookies.makeButton('scrollingBuildings',
		'Scroll buildings ON', 'Scroll buildings OFF',
		'(hovering over the left/right edges of buildings produces a scroll effect)'
	));

	frag.appendChild(OmniCookies.makeButton('smoothBuildings',
		'Smooth buildings ON', 'Smooth buildings OFF',
		'(buildings draw every frame, instead of every 3 frames)'
	));

	frag.appendChild(OmniCookies.makeButton('buffTooltipDuration',
		'Show buff duration in tooltip ON', 'Show buff duration in tooltip OFF',
		'(buffs will show their current duration in their tooltip)'
	));

	frag.appendChild(OmniCookies.makeButton('betterBuildingTooltips',
		'Improved building tooltips ON', 'Improved building tooltips OFF',
		'(building tooltips in the shop look a little better; disabling requires refresh)',
		function() {
			if(!OmniCookies.patchedBuildingTooltips) OmniCookies.patchBuildingTooltips();
		}
	));

	l('menu').childNodes[2].insertBefore(frag, l('menu').childNodes[2].childNodes[l('menu').childNodes[2].childNodes.length - 1]);
}

// Patch Game.UpdateMenu to shove in our menu
OmniCookies.patchUpdateMenu = function() {
	Game.UpdateMenu = OmniCookies.replaceCode(Game.UpdateMenu, [
		{
			pattern: /}$/,
			replacement: 'OmniCookies.customOptionsMenu()$&'
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
	for(var i in Game.Objects) {
		var building = Game.Objects[i];
		building.scrollOffX = 0;
		building.lastRandX = 0;
		building.lastRandY = 0;
		building.draw = OmniCookies.replaceCode(building.draw, [
			{   // Force buildings to always resize the canvas
				pattern: 'if \(this.toResize\)',
				replacement: 'if (true)'
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
		]);
	};
}

// Patches building tooltips to look a bit better in some cases
OmniCookies.patchBuildingTooltips = function() {
	OmniCookies.patchedBuildingTooltips = true;

	for(var i in Game.Objects) {
		var building = Game.Objects[i];
		building.tooltip = OmniCookies.replaceCode(building.tooltip, [
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
		]);
	}
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
	let minigame = Game.Objects['Wizard tower'].minigame;
	minigame.spells['stretch time'].win = OmniCookies.replaceCode(minigame.spells['stretch time'].win, [
		{
			pattern: 'me.maxTime+=gain;',
			replacement: 'me.desc = me.desc.replace(Game.sayTime(me.maxTime,-1), Game.sayTime(me.maxTime + gain,-1));$&'
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

	Game.Notify(`Loaded ${OmniCookies.name} ${OmniCookies.version}`,'',0,3);
}

OmniCookies.save = function() {
	return JSON.stringify({
		settings: OmniCookies.settings
	});
}

OmniCookies.load = function(str) {
	var data = JSON.parse(str);
	var settings = data.settings;
	if(settings) {
		for(key of Object.keys(settings)) {
			if(key in OmniCookies.settings) {
				OmniCookies.settings[key] = settings[key];
			}
		}
	}

	OmniCookies.settings.autoScrollbar ? OmniCookies.autoScrollbar() : OmniCookies.showScrollbar();
	OmniCookies.settings.betterBuildingTooltips ? OmniCookies.patchBuildingTooltips() : null;
}

//#endregion
//==============================//

Game.registerMod(OmniCookies.name, OmniCookies);
