declare global {
    interface Window {
        Spice: any;
        SimpleBeautify: Function;
    }
}
export declare class RoutineFunction {
    func: () => void;
    enabled: () => boolean;
    constructor(func: () => void, enabled?: () => boolean);
}
export declare class Routine {
    routines: Record<string, RoutineFunction>;
    constructor(routines?: Record<string, RoutineFunction>);
    run(): void;
    register(name: string, func: () => void): void;
}
export declare class RoutineCollection implements Record<string, RoutineFunction> {
    [routine: string]: RoutineFunction;
}
declare class LogicRoutineCollection extends RoutineCollection {
    /**
     * Very fancy ascend meter
     * Basically has to recalculate everything. Thanks game.
     * At least there's no loops involved so it's not too slow.
     */
    improveAscendMeter: RoutineFunction;
    /**
     * If enabled, Skruuia modifies wrinkler cookie consumption.
     * This increases the amount of cookies that get multiplied by the wrinklers.
     * Mathematically it's the same, but needs Skruuia to stay slotted in.
     */
    updateSkruuiaRebalance: RoutineFunction;
    /** In enhanced bulk mode, refresh store every 10 frames */
    bulkStoreRefresh: RoutineFunction;
    /** Deselect dead wrinklers. Strictly a cosmetic bugfix */
    wrinklerDeselect: RoutineFunction;
}
declare class LogicRoutine extends Routine {
    routines: LogicRoutineCollection;
}
export declare let logicRoutine: LogicRoutine;
declare class DrawRoutineCollection extends RoutineCollection {
    /** Update icon of milk selector when switching milk types */
    updateMilkIcon: RoutineFunction;
    /** Fixes the graphics on the grimoire magic meter */
    grimoireMeterFix: RoutineFunction;
    /** Rotates Cyclius along with his current cycle */
    trueCyclius: RoutineFunction;
}
declare class DrawRoutine extends Routine {
    routines: DrawRoutineCollection;
}
export declare let drawRoutine: DrawRoutine;
declare class ResetRoutineCollection extends RoutineCollection {
    /** Resets the save-specific data */
    resetSaveData: RoutineFunction;
    /** Sets the scroll of all buildings to 0 */
    resetScroll: RoutineFunction;
}
declare class ResetRoutine extends Routine {
    routines: ResetRoutineCollection;
}
export declare let resetRoutine: ResetRoutine;
export {};
