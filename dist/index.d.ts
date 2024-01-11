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
export declare const LiveTranslatorPlugin: {
    install(app: any, options: LiveTranslatorPluginOptions): void;
};
export {};
