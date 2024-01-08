import { createI18n } from "vue-i18n";
import en from './lang/en.json';
import hu from './lang/hu.json';
import { encodeMessages } from "..";
export const i18n = createI18n({
    legacy: false,
    locale: 'en',
    fallbackLocale: 'en',
    messages: encodeMessages({
        en,
        hu,
    }),
});
