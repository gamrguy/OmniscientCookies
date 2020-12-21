export let name = 'Omniscient Cookies'
export let version = 'v2.0.0'

interface Vars {
	lastMilk: number
	lastAutoMilk: any
	buffsById: Game.Buff[]
	cursedPs: number
	cursedPsMult: number
	ascendMeterLevel: number
	ascendMeterPercent: number
	levelDiff: number
	patchedTrueCyclius: boolean
	prevShortcut: 0 | 1 | 2 | 3
	GetBuffTooltipFunc?: Function
}

export let vars: Vars = {
	lastMilk: -1,
	lastAutoMilk: undefined,
	buffsById: [],
	cursedPs: 0,
	cursedPsMult: 0,
	ascendMeterLevel: undefined,
	ascendMeterPercent: undefined,
	levelDiff: 0,
	patchedTrueCyclius: false,
	prevShortcut: 0
}