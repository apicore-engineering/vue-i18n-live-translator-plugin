# Live Translator Plugin for Vue i18n
> [!WARNING]  
> This plugin makes significant changes to the DOM, possibly messing up your layout and appearance. We advise you **NOT TO USE IT IN PRODUCTION**, only in development and staging instances.

## Demo
Find a live demo app at: [https://apicore-engineering.github.io/vue-i18n-live-translator-plugin/](https://apicore-engineering.github.io/vue-i18n-live-translator-plugin/)

## Install
```bash
npm i -s https://github.com/apicore-engineering/vue-i18n-live-translator-plugin
```

## Use
```typescript
// main.ts
import { i18n } from './i18n'
import { LiveTranslatorPlugin, TranslationMeta } from 'vue-i18n-live-translator-plugin'

const app = createApp(App)
app.use(i18n)

app.use(LiveTranslatorPlugin, {
    i18n,                                 // i18n instance
    translationLink (meta: TranslationMeta) {
        // your platform-specific link to the translation software
        return ''
    },
    persist: true,
    root: document.getElementById('app'), // root of your vue app, this is where the plugin looks for translated strings. defaults to document.documentElement
    refreshRate: 100,                     // max refresh rate (ms)
    checkVisibility: true,                // hide elements that are covered
})

app.mount('#app')
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