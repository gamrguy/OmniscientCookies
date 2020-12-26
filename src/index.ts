import * as OmniCookies from './OmniCookies'
import Cppkies from 'cppkies'

declare global {
	interface Window {
		OmniCookies: object
	}
}

let OmniCookiesExport: any
if(window.OmniCookies) {
	OmniCookies.Logger.warn("Mod loaded twice???")
	OmniCookiesExport = window.OmniCookies
} else {
	Cppkies.onLoad.push(function() {
		Game.registerMod(OmniCookies.name, OmniCookies.mod);
	});

	OmniCookiesExport = OmniCookies;
	window.OmniCookies = OmniCookies;
}

export default OmniCookiesExport;