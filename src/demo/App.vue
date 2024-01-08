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
        <small>demo application</small>
      </h1>
      <div class="selector">
        <button :class="{ active: locale === 'en' }" @click="locale = 'en'">English</button>
        <button :class="{ active: locale === 'hu' }" @click="locale = 'hu'">Hungarian</button>
      </div>
      <h3>Simple string</h3>
      <p>{{ $t('LTPlugin.HelloWorld') }}</p>
      <h3>Interplolation</h3>
      <p>{{ $t('LTPlugin.WelcomeToLT', { app: 'Live Translator Plugin'}) }}</p>
      <h3>Plurals</h3>
      <input class="plural" type="number" min="0" step="1" v-model="pluralCount">
      <br>
      {{ $t('LTPlugin.Messages', pluralCount) }}
      <br>
      {{ $t('LTPlugin.MessagesCount', pluralCount) }}
      <h3>Attribute</h3>
      <img class="image" src="https://source.unsplash.com/random/500x500" :alt="t('LTPlugin.Attrs.ImageAlt')" :title="t('LTPlugin.Attrs.ImageTitle')">
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
  if (params.get('meta')) {
    return JSON.parse(decodeURIComponent(params.get('meta')))
  }
  return null
})

</script>

<style lang="scss" scoped>
.show-meta {
  table {
    text-align: left;
    th, td {
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
