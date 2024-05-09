export type TranslationMeta = {
    locale: string;
    message: string;
    values?: object;
    choice?: number;
    path: string;
};
type LiveTranslatorPluginOptions = {
    i18n: any;
    translationLink: (meta: TranslationMeta) => string;
    persist?: boolean;
    root?: HTMLElement;
    refreshRate?: number;
    checkVisibility?: boolean;
};
export declare abstract class ZeroWidthEncoder {
    static START: string;
    static ZERO: string;
    static ONE: string;
    static SPACE: string;
    static END: string;
    static PATTERN: RegExp;
    static encode(text: string): string;
    static decode(zeroWidth: string): string;
    static cleanString(str: string): string;
}
export declare const LiveTranslatorPlugin: {
    install(app: any, options: LiveTranslatorPluginOptions): void;
};
export {};
