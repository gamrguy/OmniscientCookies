Game.registerMod('omniscient_cookies', {
	init:function() {
	    // Automatically hide the scroll bar in the building display
	    var center = document.getElementById('centerArea');
	    center.style.overflowY = 'auto';

	    var ReplaceCode = function(targetFunction, listReplacements) {
		let code = targetFunction.toString();
		let newCode = code;
		for(let i in listReplacements) {
		    let patt = listReplacements[i].pattern;
		    let repl = listReplacements[i].replacement;
		    newCode = newCode.replace(patt, repl);
		}
		return (new Function('return ' + newCode))();
	    };

	    // Make buildings redraw every frame
	    // This allows the building scroll to appear smooth
	    Game.DrawBuildings = ReplaceCode(Game.DrawBuildings, [
		{
		    pattern: 'Game.drawT%3==0',
		    replacement: 'true'
		}
	    ]);

	    for(var i in Game.Objects) {
		var building = Game.Objects[i];
		building.scrollOffX = 0;
		building.lastRandX = 0;
		building.lastRandY = 0;
		building.draw = ReplaceCode(building.draw, [
		    {   // Force buildings to always resize the canvas
			pattern: 'if \(this.toResize\)',
			replacement: 'if (true)'
		    },
		    {   // Scroll the background with the scroll offset
			pattern: '0,0,this.canvas.width,this.canvas.height,128,128',
			replacement: '0,0,this.canvas.width,this.canvas.height,128,128,-this.scrollOffX'
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
			replacement: "x-=this.scrollOffX;\nvar usedPic=(typeof(pic)=='string'?pic:pic(this,i));"
		    },
		    {   // Scroll when mouse hovers over outer 100px of building view
			pattern: 'var selected=-1;',
			replacement: `var speed = 20;
						if(this.mousePos[0] >= (this.canvas.width) - 100 && maxI <= this.amount + rows * 3) {
							this.scrollOffX += speed * ((this.mousePos[0] - (this.canvas.width - 100)) / 100);
						}
						if(this.mousePos[0] <= 100 && this.scrollOffX > 0) {
							this.scrollOffX -= speed * (1 - this.mousePos[0] / 100);
						}
						if(this.scrollOffX < 0) this.scrollOffX = 0;
						var selected=-1;`
		    },
		    {   // Reimplement delay on grandma hover shake
			pattern: 'ctx.drawImage(sprite,Math.floor(pic.x+Math.random()*4-2),Math.floor(pic.y+Math.random()*4-2));',
			replacement: `if(Game.drawT%3==0) {
								this.lastRandX = Math.random()*4;
								this.lastRandY = Math.random()*4;
							}

							ctx.drawImage(sprite,Math.floor(pic.x+this.lastRandX-2),Math.floor(pic.y+this.lastRandY-2));`
		    }
		]);
	    };
	}
});
Game.Notify("Loaded Omniscient Cookies v1.1",'',0,0.5);
