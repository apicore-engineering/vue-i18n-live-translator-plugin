# Live Translator Plugin
> [!WARNING]  
> Plugin has been updated to Vue 3 only. To use with Vue 2 please use the legacy `vue2` branch.

## Demo
Find a live demo app at: [https://apicore-engineering.github.io/vue-i18n-live-translator-plugin/](https://apicore-engineering.github.io/vue-i18n-live-translator-plugin/)

## Install
```bash
npm i -s https://github.com/apicore-engineering/vue-i18n-live-translator-plugin
```

## Use
```typescript
import { LiveTranslatorPlugin, TranslationMeta } from 'vue-i18n-live-translator-plugin'

Vue.use(LiveTranslatorPlugin, {
    translationLink (meta: TranslationMeta) {
        return '' // your platform-specific link to the translation software
    },
    persist: true,
})
```

## Weblate example
```typescript
translationLink (meta: TranslationMeta) {
    return `<weblate_url>/translate/<project>/<component>/${meta.locale}/?q=context:=${meta.path}`
}
```

## Develop
```bash
git clone https://github.com/apicore-engineering/vue-i18n-live-translator-plugin
```
```bash
cd vue-i18n-live-translator-plugin
```
```bash
npm install
```
```bash
husky install
```
```bash
npm run dev # demo & dev app with vite
```