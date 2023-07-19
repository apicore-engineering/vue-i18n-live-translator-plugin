import Vue, { VueConstructor } from 'vue';
import VueI18n from 'vue-i18n';
export type TranslationMeta = {
    locale: string;
    message: string;
    values: unknown;
    path: string;
};
type LiveTranslatorPluginOptions = {
    i18n: VueI18n;
    translationLink: (meta: TranslationMeta) => string;
    persist?: boolean;
};
export declare const LiveTranslatorPlugin: {
    install(app: VueConstructor<Vue>, options: LiveTranslatorPluginOptions): void;
};
export {};