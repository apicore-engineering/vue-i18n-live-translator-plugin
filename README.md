# Live Translator Plugin for Vue i18n
> [!WARNING]  
> Plugin has been updated to Vue 3 only. To use with Vue 2 please use the legacy `vue2` branch.

> [!WARNING]  
> This plugin makes significant changes to the DOM, possibly messing up your layout and appearance. We advise you **NOT TO USE IT IN PRODUCTION**, only in development and staging instances.

## Demo
Find a live demo app at: [https://apicore-engineering.github.io/vue-i18n-live-translator-plugin/](https://apicore-engineering.github.io/vue-i18n-live-translator-plugin/)

## Install
```bash
npm i -s https://github.com/apicore-engineering/vue-i18n-live-translator-plugin
```

## Use
Encode locale messages before passing them to `createI18n`:
```typescript
// i18n.ts
import { createI18n } from 'vue-i18n'
import { encodeMessages } from 'vue-i18n-live-translator-plugin'

export const i18n = createI18n({
  // ...
  messages: encodeMessages(messages),
})
```
Use plugin to decode info from locale messages:
```typescript
// main.ts
import { LiveTranslatorPlugin, TranslationMeta } from 'vue-i18n-live-translator-plugin'

// const app = createApp(App)
// app.use(i18n)
// ...

app.use(LiveTranslatorPlugin, {
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