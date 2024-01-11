export type TranslationMeta = {
    locale: string;
    message: string;
    values?: object;
    choice?: number;
    path: string;
};
type LiveTranslatorPluginOptions = {
    translationLink: (meta: TranslationMeta) => string;
    persist?: boolean;
    root?: HTMLElement;
    refreshRate?: number;
    checkVisibility?: boolean;
};
export declare function encodeMessages(messagesObject: any): any;
export declare const LiveTranslatorPlugin: {
    install(app: any, options: LiveTranslatorPluginOptions): void;
};
export {};
