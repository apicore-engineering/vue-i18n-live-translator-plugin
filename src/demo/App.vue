<template>
  <div>
    <div class="show-meta" v-if="showMeta">
      <table>
        <tr v-for="value, key in showMeta">
          <th>{{ key }}</th>
          <td>{{ value }}</td>
        </tr>
      </table>
    </div>
    <div v-else>
      <h1 class="title">
        <small>Vue i18n</small>
        <br>
        Live Translator Plugin
        <br>
        <small>demo app</small>
      </h1>
      <p>
        This is a demo app and development test page for the plugin. To turn the plugin on/off, click the <b>LT</b> button
        in the top left corner. Localized strings appear in <span class="translated">red</span>.
      </p>
      <div class="selector">
        <button :class="{ active: locale === 'en' }" @click="locale = 'en'">English</button>
        <button :class="{ active: locale === 'hu' }" @click="locale = 'hu'">Hungarian</button>
      </div>
      <h3>Simple string</h3>
      <p class="translated">{{ $t('LTPlugin.HelloWorld') }}</p>
      <h3>Interplolation</h3>
      <p class="translated">{{ $t('LTPlugin.WelcomeToLT', { app: 'Live Translator Plugin' }) }}</p>
      <h3>Plurals</h3>
      <input class="plural" type="number" min="0" step="1" v-model="pluralCount">
      <p class="translated">
        {{ $t('LTPlugin.Messages', pluralCount) }}
      </p>
      <p class="translated">
        {{ $t('LTPlugin.MessagesCount', pluralCount) }}
      </p>
      <h3>Multiple strings inside one tag</h3>
      <p class="translated">
        {{ t('LTPlugin.PartOne') }} {{ $t('LTPlugin.PartTwo') }}
      </p>
      <h3>Attribute</h3>
      <img class="image" src="https://source.unsplash.com/random/500x500" :alt="t('LTPlugin.Attrs.ImageAlt')"
        :title="t('LTPlugin.Attrs.ImageTitle')">
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n"

const { t, locale } = useI18n()
const pluralCount = ref(1)
const showMeta = computed(() => {
  const params = new URLSearchParams(location.search)
  const meta = params.get('meta')
  if (meta) {
    return JSON.parse(decodeURIComponent(meta))
  }
  return null
})

</script>

<style lang="scss" scoped>
.translated {
  color: rgb(161, 0, 0);
}

.show-meta {
  table {
    text-align: left;

    th,
    td {
      padding: 4px 8px;
    }
  }
}

.title {
  font-size: 2.5rem;

  small {
    opacity: 0.6;
  }
}

.selector {
  display: flex;
  gap: 1rem;
  justify-content: center;

  .active {
    background-color: #4a596a;
    color: white;
  }
}

.plural {
  width: 2rem;
}

.image {
  width: 80%;
  border-radius: 8px;
}
</style>
