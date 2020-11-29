Game.registerMod('omnicient_cookies', {
	init:function() {
		// Automatically hide the scroll bar in the building display
		var center = document.getElementById('centerArea');
		center.style.overflowY = 'auto';

		Game.DrawBuildings=function()//draw building displays with canvas
		{
			// Draw buildings every frame instead of every three
			//if (Game.drawT%3==0)
			//{
				for (var i in Game.Objects)
				{
					var me=Game.Objects[i];
					if (me.id>0 && !me.onMinigame && !me.muted) me.draw();
					else me.pics=[];
				}
			//}
		}

		//Game.registerHook("create", function() {
		//Game.Notify("doing thing bruh",'',0,0.5);
		for(var i in Game.Objects) {
			//Game.Notify("definitely trying to modify " + i,'',0,5);
			var building = Game.Objects[i];
			// Replace draw function
			building.scrollOffX = 0;
			building.lastRandX = 0;
			building.lastRandY = 0;
			building.draw = function() {
				//Game.Notify("drawing something", '', 0, 0.1);
				if (this.amount<=0) return false;
				// Resize every draw
				//if (this.toResize)
				//{
				this.canvas.width=this.canvas.clientWidth;
				this.canvas.height=this.canvas.clientHeight;
				this.toResize=false;
				//}
				var ctx=this.ctx;
				//clear
				//ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
				ctx.globalAlpha=1;

				//pic : a loaded picture or a function returning a loaded picture
				//bg : a loaded picture or a function returning a loaded picture - tiled as the background, 128x128
				//xV : the pictures will have a random horizontal shift by this many pixels
				//yV : the pictures will have a random vertical shift by this many pixels
				//w : how many pixels between each picture (or row of pictures)
				//x : horizontal offset
				//y : vertical offset (+32)
				//rows : if >1, arrange the pictures in rows containing this many pictures
				//frames : if present, slice the pic in [frames] horizontal slices and pick one at random

				var pic=this.art.pic;
				var bg=this.art.bg;
				var xV=this.art.xV||0;
				var yV=this.art.yV||0;
				var w=this.art.w||48;
				var h=this.art.h||48;
				var offX=this.art.x||0;
				var offY=this.art.y||0;
				var rows=this.art.rows||1;
				var frames=this.art.frames||1;

				if (typeof(bg)=='string') ctx.fillPattern(Pic(this.art.bg),0,0,this.canvas.width,this.canvas.height,128,128,-this.scrollOffX);
				else bg(this,ctx);

				var minI=Math.max(0, Math.floor((-50 + this.scrollOffX) / (w/rows)));
				var maxI=Math.floor((this.canvas.width + 50 + this.scrollOffX)/(w/rows)+1);
				var iT=Math.min(this.amount,maxI);
				// Always recalculate all sprites
				this.pics = [];
				var i=minI;


				var x=0;
				var y=0;
				var added=0;
				if (i!=iT)
				{
					//for (var iter=0;iter<3;iter++)
					//{
					while (i<iT)
						//if (i<iT)
					{
						Math.seedrandom(Game.seed+' '+this.id+' '+i);
						if (rows!=1)
						{
							x=Math.floor(i/rows)*w+((i%rows)/rows)*w+Math.floor((Math.random()-0.5)*xV)+offX;
							y=32+Math.floor((Math.random()-0.5)*yV)+((-rows/2)*32/2+(i%rows)*32/2)+offY;
						}
						else
						{
							x=i*w+Math.floor((Math.random()-0.5)*xV)+offX;
							y=32+Math.floor((Math.random()-0.5)*yV)+offY;
						}
						x -= this.scrollOffX;
						var usedPic=(typeof(pic)=='string'?pic:pic(this,i));
						var frame=-1;
						if (frames>1) frame=Math.floor(Math.random()*frames);
						this.pics.push({x:Math.floor(x),y:Math.floor(y),z:y,pic:usedPic,id:i,frame:frame});
						i++;
						added++;
					}
					while (i>iT)
						//else if (i>iT)
					{
						this.pics.sort(Game.sortSpritesById);
						this.pics.pop();
						i--;
						added--;
					}
					//}
					this.pics.sort(Game.sortSprites);
				}

				var len=this.pics.length;

				if (this.mouseOn)
				{
					var speed = 20;
					//Game.Notify(this.scrollOffX, '', 0, 0.5);
					//Game.Notify("mouse here yo, at " + this.mousePos[0], '', 0, 0.1);
					if(this.mousePos[0] >= (this.canvas.width) - 100 && maxI <= this.amount + rows * 3) {
						this.scrollOffX += speed * ((this.mousePos[0] - (this.canvas.width - 100)) / 100);
						//Game.Notify("deffo scrolling right " + this.scrollOffX, '', 0, 0.5);
						//Game.Notify("drew " + len + " things",'',0,0.5);
					}
					if(this.mousePos[0] <= 100 && this.scrollOffX > 0) {
						this.scrollOffX -= speed * (1 - this.mousePos[0] / 100);
						//Game.Notify("deffo scrolling left " + this.scrollOffX, '', 0, 0.5);
						//Game.Notify("drew " + len + " things",'',0,0.5);
					}
					if(this.scrollOffX < 0) this.scrollOffX = 0;

					var selected=-1;
					if (this.name=='Grandma')
					{
						//mouse detection only fits grandma sprites for now
						var marginW=-18;
						var marginH=-10;
						for (i=0;i<len;i++)
						{
							pic=this.pics[i];
							if (this.mousePos[0]>=pic.x-marginW && this.mousePos[0]<pic.x+64+marginW && this.mousePos[1]>=pic.y-marginH && this.mousePos[1]<pic.y+64+marginH) selected=i;
						}
						if (Game.prefs.customGrandmas && Game.customGrandmaNames.length>0)
						{
							var str='Names in white were submitted by our supporters on Patreon.';
							ctx.globalAlpha=0.75;
							ctx.fillStyle='#000';
							ctx.font='9px Merriweather';
							ctx.textAlign='left';
							ctx.fillRect(0,0,ctx.measureText(str).width+4,12);
							ctx.globalAlpha=1;
							ctx.fillStyle='rgba(255,255,255,0.7)';
							ctx.fillText(str,2,8);
							ctx.fillStyle='rgba(255,255,255,1)';
							ctx.fillText('white',2+ctx.measureText('Names in ').width,8);
						}
					}
				}

				Math.seedrandom();

				for (i=0;i<len;i++)
				{
					pic=this.pics[i];
					var sprite=Pic(pic.pic);
					if (selected==i && this.name=='Grandma')
					{
						ctx.font='14px Merriweather';
						ctx.textAlign='center';
						Math.seedrandom(Game.seed+' '+pic.id/*+' '+pic.id*/);//(Game.seed+' '+pic.id+' '+pic.x+' '+pic.y);
						var years=((Date.now()-new Date(2013,7,8))/(1000*60*60*24*365))+Math.random();//the grandmas age with the game
						var name=choose(Game.grandmaNames);
						var custom=false;
						if (Game.prefs.customGrandmas && Game.customGrandmaNames.length>0 && Math.random()<0.2) {name=choose(Game.customGrandmaNames);custom=true;}
						var text=name+', age '+Beautify(Math.floor(70+Math.random()*30+years+this.level));
						var width=ctx.measureText(text).width+12;
						x=Math.max(0,Math.min(pic.x+32-width/2+Math.random()*32-16,this.canvas.width-width));
						y=4+Math.random()*8-4;
						Math.seedrandom();
						ctx.fillStyle='#000';
						ctx.strokeStyle='#000';
						ctx.lineWidth=8;
						ctx.globalAlpha=0.75;
						ctx.beginPath();
						ctx.moveTo(pic.x+32,pic.y+32);
						ctx.lineTo(Math.floor(x+width/2),Math.floor(y+20));
						ctx.stroke();
						ctx.fillRect(Math.floor(x),Math.floor(y),Math.floor(width),24);
						ctx.globalAlpha=1;
						if (custom) ctx.fillStyle='#fff';
						else ctx.fillStyle='rgba(255,255,255,0.7)';
						ctx.fillText(text,Math.floor(x+width/2),Math.floor(y+16));

						if(Game.drawT%3==0) {
							this.lastRandX = Math.random()*4;
							this.lastRandY = Math.random()*4;
						}
						ctx.drawImage(sprite,Math.floor(pic.x+this.lastRandX-2),Math.floor(pic.y+this.lastRandY-2));
					}
					else if (pic.frame!=-1) ctx.drawImage(sprite,(sprite.width/frames)*pic.frame,0,sprite.width/frames,sprite.height,pic.x,pic.y,(sprite.width/frames),sprite.height);
					else ctx.drawImage(sprite,pic.x,pic.y);
				}
			};
		};
		
		
	}
});
Game.Notify("Loaded Omnicient Cookies v1.0",'',0,0.5);
