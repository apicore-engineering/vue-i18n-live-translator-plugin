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
      <p class="translated" :title="t('LTPlugin.MultipleTitle')">
        {{ t('LTPlugin.PartOne') }} {{ $t('LTPlugin.PartTwo') }}
      </p>
      <h3>Scrollable container</h3>
      <div class="scroll">
        <div class="item translated" v-for="i in 5">{{ t('LTPlugin.ListItemN', [i]) }}</div>
      </div>
      <h3>Attribute</h3>
      <img class="image" src="https://source.unsplash.com/random/500x500" :alt="t('LTPlugin.Attrs.ImageAlt')"
        :title="t('LTPlugin.Attrs.ImageTitle')">

      <div id="draggable" draggable @mousedown="dragStart" @mousemove="dragMove" @mouseup="dragEnd" ref="draggable" :title="t('LTPlugin.PositionAbsolute')">
        <h3>Absolute position</h3>
        {{ t('LTPlugin.Draggable') }}
      </div>
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

const dragPos = ref<{ x: number, y: number } | null>(null)
const draggable = ref<HTMLDivElement>()

function dragStart(e: MouseEvent) {
  dragPos.value = {
    x: e.offsetX,
    y: e.offsetY,
  }
}

function dragMove(e: MouseEvent) {
  if (!dragPos.value) return
  draggable.value!.style.top = e.pageY - dragPos.value.y + 'px'
  draggable.value!.style.left = e.pageX - dragPos.value.x + 'px'
}

function dragEnd() {
  dragPos.value = null
}

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

.scroll {
  height: 200px;
  overflow-y: scroll;
  box-shadow: inset 0px 0px 4px rgba(0,0,0,0.5);
  .item {
    line-height: 50px;
  }
}

.image {
  width: 80%;
  border-radius: 8px;
}

#draggable {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #eeeeeee2;
  width: 200px;
  height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  padding: 1rem;
  cursor: grab;
  flex-direction: column;

  h3 {
    margin-top: 0;
  }

  &:hover {
    outline: solid 2px #eeeeee;
  }

  &:active {
    cursor: grabbing;
  }
}
</style>
