/// <reference types="cookieclicker" />
export interface Icon {
    frame: number;
    /** ID of the image (should be unique) */
    id: number;
    /** Asset name to use */
    pic: string;
    /** Horizontal offset */
    x: number;
    /** Vertical offset */
    y: number;
    /** Depth offset */
    z: number;
    /** Whether this image is a hoverable grandma */
    grandma?: boolean;
}
/** Defines synergy grandma drawing behavior */
export interface Properties {
    /** Building to tie in with */
    building: Game.Object;
    /**
     * Buildings-to-grandmas ratio
     * If this is less than 1, draw more per building
     * If this is greater than 1, draw less per building
     *
     * Must be greater than 0
     */
    frequency?: number;
    /**
     * @param {Icon} basePic Base building icon, for positioning grandmas
     * @param {number} id Unique identifier for this particular grandma
     * @returns {Icon|Icon[]} New images to draw for the drawn grandma
     */
    drawGrandma: (basePic: Icon, id: number) => Icon | Icon[];
}
/**
 * Registers support for a custom Bring Grandma to Work Day display
 *
 * @param props Grandma support properties
 * @param granToBan Grandma sprite to disallow appearing in normal grandma building
 */
export declare function registerSupport(props: Properties, granToBan?: string): void;
/**
 * Attempts to draw a synergy grandma on supported buildings.
 *
 * @param building Building to draw grandmas on
 * @param basePic Base building sprite
 * @param id Which building this is
 * @returns Grandma icons to draw
 */
export declare function tryDrawGrandmas(building: Game.Object, basePic: Icon, id: number): Icon[];
export declare let grandmaProperties: Record<string, Properties>;
