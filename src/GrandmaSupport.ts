import * as Util from "./Util";
import * as Logger from "./Logger";
import { vars } from "./Vars";

export interface Icon {
	frame: number

	/** ID of the image (should be unique) */
	id: number

	/** Asset name to use */
	pic: string

	/** Horizontal offset */
	x: number

	/** Vertical offset */
	y: number

	/** Depth offset */
	z: number

	/** Whether this image is a hoverable grandma */
	grandma?: boolean
}

/** Defines synergy grandma drawing behavior */
export interface Properties {
	/** Building to tie in with */
	building: Game.Object

	/** 
	 * Buildings-to-grandmas ratio  
	 * If this is less than 1, draw more per building  
	 * If this is greater than 1, draw less per building
	 * 
	 * Must be greater than 0
	 */
	frequency?: number

	/**
	 * @param {Icon} basePic Base building icon, for positioning grandmas
	 * @param {number} id Unique identifier for this particular grandma
	 * @returns {Icon|Icon[]} New images to draw for the drawn grandma
	 */
	drawGrandma: (basePic: Icon, id: number) => Icon | Icon[]
}

/**
 * Registers support for a custom Bring Grandma to Work Day display
 * 
 * @param props Grandma support properties
 * @param granToBan Grandma sprite to disallow appearing in normal grandma building
 */
export function registerSupport(props: Properties, granToBan?: string) {
	if(grandmaProperties[props.building.name]) {
		Logger.warn(`Replacing custom grandma support for '${props.building.name}'!`);
	}
	grandmaProperties[props.building.name] = props;
	if(granToBan) vars.bannedGrandmas[granToBan] = true;
}

/**
 * Calculates the amount of grandmas that have been drawn  
 * given a number of buildings and a frequency.
 * 
 * This is NOT mathematically independent.  
 * To get the true values, compare against the previous calc
 * and subtract 1 if the difference is >= 2.
 * 
 * @param num Amount of buildings
 * @param freq Amount of buildings per grandma
 * @returns Amount of grandmas
 */
function grandmaAmountCalc(num: number, freq: number) {
	let lastPerc = Math.abs(((num-1)/freq)%1);
	let count = num/freq;

	// did we skip a number?
	if(Math.floor(count - lastPerc) < count) count += 1;

	return Math.floor(count);
}

/**
 * Attempts to draw a synergy grandma on supported buildings.
 * 
 * @param building Building to draw grandmas on
 * @param basePic Base building sprite
 * @param id Which building this is
 * @returns Grandma icons to draw
 */
export function tryDrawGrandmas(building: Game.Object, basePic: Icon, id: number): Icon[] {
	let props = grandmaProperties[building.name];
	if(!props) return;
	let freq = (!props.frequency || props.frequency <= 0) ? 1 : props.frequency;
	let currentGrandmas = Util.getNumSynergyGrandmas(building);

	// This math is ridiculous but seriously just go with it
	let drawnGrandmas = grandmaAmountCalc(id, freq);
	let prevDrawnGrandmas = grandmaAmountCalc(id-1, freq);
	let num = drawnGrandmas-prevDrawnGrandmas;
	num = Math.floor(Math.max(0, Math.min(num, currentGrandmas - drawnGrandmas)));

	let grandmas: Icon[] = [];
	for(let i = 0; i < num; i++) {
		id += 0.1;
		grandmas = grandmas.concat(props.drawGrandma(basePic, id));
	}
	return grandmas;
}

export let grandmaProperties: Record<string, Properties> = {
	'Farm': {
		building: Game.Objects['Farm'],
		frequency: 1,
		drawGrandma(basePic, id) {
			return {
				x: basePic.x + Math.floor((Math.random()-0.5)*40),
				y: basePic.y + Math.floor((Math.random()-0.5)*10)+5,
				z: basePic.y+0.1,
				id: id,
				pic: 'farmerGrandma.png',
				frame: -1,
				grandma: true
			}
		}
	},
	'Mine': {
		building: Game.Objects['Mine'],
		frequency: 1,
		drawGrandma(basePic, id) {
			return {
				x: basePic.x + Math.floor((Math.random()-0.5)*25)+10,
				y: basePic.y + Math.floor((Math.random()-0.4)*5)+2,
				z: basePic.y+0.1,
				id: id,
				pic: 'minerGrandma.png',
				frame: -1,
				grandma: true
			}
		}
	},
	'Factory': {
		building: Game.Objects['Factory'],
		frequency: 1,
		drawGrandma(basePic, id) {
			return {
				x: basePic.x + Math.floor((Math.random()-0.5)*50),
				y: basePic.y,
				z: basePic.y+0.1,
				id: id,
				pic: 'workerGrandma.png',
				frame: -1,
				grandma: true
			}
		}
	},
	'Bank': {
		building: Game.Objects['Bank'],
		frequency: Math.E/2,
		drawGrandma(basePic, id) {
			return {
				x: basePic.x + Math.floor((Math.random()-0.5)*40),
				y: basePic.y + Math.floor((Math.random()-0.5)*4),
				z: basePic.y+0.1,
				id: id,
				pic: 'bankGrandma.png',
				frame: -1,
				grandma: true
			}
		}
	},
	'Temple': {
		building: Game.Objects['Temple'],
		frequency: 1,
		drawGrandma(basePic, id) {
			return {
				x: basePic.x + Math.floor((Math.random()-0.5)*25),
				y: basePic.y + Math.floor((Math.random()-0.5)*4),
				z: basePic.y+0.1,
				id: id,
				pic: 'templeGrandma.png',
				frame: -1,
				grandma: true
			}
		}
	},
	'Wizard tower': {
		building: Game.Objects['Wizard tower'],
		frequency: 3,
		drawGrandma(basePic, id) {
			return {
				x: basePic.x + Math.floor((Math.random()-0.5)*35)+20,
				y: Math.floor((Math.random()-0.5)*12)+60,
				z: basePic.y+50,
				id: id,
				pic: 'witchGrandma.png',
				frame: -1,
				grandma: true
			}
		}
	},
	'Shipment': {
		building: Game.Objects['Shipment'],
		frequency: 0.5,
		drawGrandma(basePic, id) {
			let dir = (id - basePic.id).toFixed(1) == '0.1' ? -1 : 1;
			let x = basePic.x + Math.floor(Math.random()*dir*5)+(15*dir);
			let y = basePic.y + Math.floor(Math.random()*20)+(15*dir*-1);
			return {
				x: x,
				y: y,
				z: y+(id%1),
				id: id,
				pic: 'cosmicGrandma.png',
				frame: -1,
				grandma: true
			}
		}
	},
	'Alchemy lab': {
		building: Game.Objects['Alchemy lab'],
		frequency: 1,
		drawGrandma(basePic, id) {
			return {
				x: basePic.x + Math.floor((Math.random()-0.5)*45),
				y: basePic.y + Math.floor((Math.random()-0.5)*4),
				z: basePic.y+0.1,
				id: id,
				pic: 'transmutedGrandma.png',
				frame: -1,
				grandma: true
			}
		}
	},
	'Portal': {
		building: Game.Objects['Portal'],
		frequency: Math.PI/2,
		drawGrandma(basePic, id) {
			let y = Math.floor((Math.random())*70);
			return {
				x: basePic.x + Math.floor((Math.random()-0.5)*35),
				y: y,
				z: 999+y+id,
				id: id,
				pic: 'alteredGrandma.png',
				frame: -1,
				grandma: true
			}
		}
	},
	'Time machine': {
		building: Game.Objects['Time machine'],
		frequency: 1,
		drawGrandma(basePic, id) {
			// Load the front of the time machine, to overlay the grandma's grandma
			let spriteName = 'https://gamrguy.github.io/OmniscientCookies/img/timemachine_front.png';
			Util.loadCustomAsset(spriteName);
			return [
				{
					x: basePic.x - 5,
					y: basePic.y-2,
					z: 999+basePic.id,
					id: id,
					pic: 'grandmasGrandma.png',
					frame: -1,
					grandma: true
				},
				{
					x: basePic.x,
					y: basePic.y,
					z: 1000+basePic.id,
					id: id + 0.01,
					pic: spriteName,
					frame: -1
				}
			]
		}
	},
	'Antimatter condenser': {
		building: Game.Objects['Antimatter condenser'],
		frequency: 1,
		drawGrandma(basePic, id) {
			return {
				x: basePic.x,
				y: basePic.y-6,
				z: 999+basePic.id,
				id: id,
				pic: 'antiGrandma.png',
				frame: -1,
				grandma: true
			}
		}
	},
	'Prism': {
		building: Game.Objects['Prism'],
		frequency: 1,
		drawGrandma(basePic, id) {
			return {
				x: basePic.x + Math.floor((Math.random()-0.5)*45),
				y: basePic.y + Math.floor((Math.random()-0.5)*8)+8,
				z: basePic.y+0.1,
				id: id,
				pic: 'rainbowGrandma.png',
				frame: -1,
				grandma: true
			}
		}
	},
	'Chancemaker': {
		building: Game.Objects['Chancemaker'],
		frequency: 2,
		drawGrandma(basePic, id) {
			return {
				x: basePic.x + Math.floor((Math.random()-0.5)*50),
				y: 70,
				z: 777+basePic.id,
				id: id,
				pic: 'luckyGrandma.png',
				frame: -1,
				grandma: true
			}
		}
	},
	'Fractal engine': {
		building: Game.Objects['Fractal engine'],
		frequency: Math.PI/4,
		drawGrandma(basePic, id) {
			let realID = (id - basePic.id).toFixed(1);
			if(!this.prevX || (realID == '0.1') || realID == this.prevID) { 
				this.prevX = 0; 
				this.prevY = 0; 
			}
			let x = basePic.x + Math.floor((Math.random()-0.5)*35);
			let y = Math.floor((Math.random())*70);
			if(this.prevX && Math.abs(x - this.prevX) < 30) x += Math.sign(x - basePic.x) * 30;
			if(this.prevY && Math.abs(y - this.prevY) < 30) y += Math.sign(basePic.y - y) * 30;
			this.prevX = x;
			this.prevY = y;
			this.prevID = realID;
			return {
				x: x,
				y: y,
				z: 999+y+id,
				id: id,
				pic: 'metaGrandma.png',
				frame: -1,
				grandma: true
			}
		}
	},
	'Idleverse': {
		building: Game.Objects['Idleverse'],
		frequency: Math.PI/1.5,
		drawGrandma(basePic, id) {
			return {
				x: basePic.x + Math.floor((Math.random()-0.5)*15),
				y: basePic.y + Math.floor((Math.random()-0.5)*15) - 25,
				z: basePic.y + 1,
				id: id,
				pic: 'alternateGrandma.png',
				frame: -1,
				grandma: true
			}
		}
	}
}