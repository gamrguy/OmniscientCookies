OmniCookies = {
	name: 'Omniscient Cookies',
	version: 'v1.2.0'
};

OmniCookies.settings = {
	autoScrollbar: true,
	scrollingBuildings: true,
	smoothBuildings: true,
	buffTooltipDuration: true
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
	if(!(Game.onMenu == 'prefs') || document.getElementById("OmniCookiesButton_autoScrollbar")) return;

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

	l('menu').childNodes[2].insertBefore(frag, l('menu').childNodes[2].childNodes[l('menu').childNodes[2].childNodes.length - 1]);
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

// Patches buff tooltips to show remaining time
OmniCookies.patchBuffTooltips = function() {
	OmniCookies.buffsById = [];

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

	OmniCookies.GetBuffTooltipFunc = function(buffId) {
		return function() {
			let buff = OmniCookies.buffsById[buffId];
			let text = '<div class="prompt" style="min-width:200px;text-align:center;font-size:11px;margin:8px 0px;"><h3>'+buff.name+'</h3>'+'<div class="line"></div>'+buff.desc;
			if(OmniCookies.settings.buffTooltipDuration) 
				text += '<div class="line"></div>'+Game.sayTime(buff.time,-1)+' left';
			text += '</div>';
			return text;
		};
	}
}

//#endregion
//==============================//

//==============================//
//#region Modding API

OmniCookies.init = function() {
	OmniCookies.smoothBuildings();
	OmniCookies.patchBuildings();
	OmniCookies.patchBuffTooltips();
	
	Game.registerHook('logic', OmniCookies.customOptionsMenu);

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
}

//#endregion
//==============================//

Game.registerMod(OmniCookies.name, OmniCookies);
