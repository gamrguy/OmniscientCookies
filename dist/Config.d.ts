import { Settings } from './Settings';
export interface ButtonOption {
    /** Text to display while this option is selected */
    text: string;
    /** Function to run when this option is selected */
    func?: () => void;
    /** Whether this option should display as "off" */
    off?: boolean;
}
export interface ConfigElement {
    display: () => HTMLElement;
}
export declare class OptionedButton<T extends keyof Settings> implements ConfigElement {
    settingName: T;
    options: ButtonOption[];
    desc: string;
    id: string;
    constructor(settingName: T, options: ButtonOption[], desc: string);
    display(): HTMLDivElement;
    toggleFunction(): () => void;
}
export declare class BooleanButton<T extends keyof Settings> extends OptionedButton<T> {
    onOption: ButtonOption;
    offOption: ButtonOption;
    constructor(settingName: T, onOption: ButtonOption, offOption: ButtonOption, desc: string);
}
export declare class Slider<T extends keyof Settings> implements ConfigElement {
    title: string;
    settingName: T;
    min: number;
    max: number;
    step: number;
    format: (num: number) => string;
    constructor(settingName: T, title: string, min: number, max: number, step: number, format: (num: number) => string);
    display(): HTMLDivElement;
}
export declare class Header implements ConfigElement {
    text: string;
    constructor(text: string);
    display(): HTMLDivElement;
}
export declare class Title implements ConfigElement {
    text: string;
    constructor(text: string);
    display(): HTMLDivElement;
}
export declare class Listing implements ConfigElement {
    elements: ConfigElement[];
    constructor(elements: ConfigElement[]);
    display(): HTMLDivElement;
}
/** Returns an empty div if not in open sesame mode */
export declare class SesameListing extends Listing {
    display(): HTMLDivElement;
}
export declare class SesameHeader extends Header {
    display(): HTMLDivElement;
}
export declare class ConfigMenu {
    elements: ConfigElement[];
    constructor(elements: ConfigElement[]);
    display(): DocumentFragment;
}
export declare function customOptionsMenu(): void;
