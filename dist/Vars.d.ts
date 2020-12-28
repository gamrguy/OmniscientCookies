/// <reference types="cookieclicker" />
export declare let name: string;
export declare let version: string;
export interface Vars {
    lastMilk: number;
    lastAutoMilk: any;
    buffsById: Game.Buff[];
    cursedPs: number;
    cursedPsMult: number;
    ascendMeterLevel: number;
    ascendMeterPercent: number;
    levelDiff: number;
    patchedTrueCyclius: boolean;
    prevShortcut: 0 | 1 | 2 | 3;
    GetBuffTooltipFunc?: Function;
    /** pseudoCookie upgrades not to be given tags or particles */
    bannedPseudoCookies: Record<string, boolean>;
    skipModifyPrice: boolean;
    bannedGrandmas: Record<string, boolean>;
}
export declare let vars: Vars;
