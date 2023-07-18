import Vue, { VueConstructor } from 'vue'
import VueI18n from 'vue-i18n'
import _ from 'lodash'

const css = `
.live-translator-enable-button {
  position: fixed !important;
  top: 0;
  left: 0;
  z-index: 10000;
  padding: 2px;
  color: black;
  background: rgba(255, 255, 255, 0.6);
  font-family: sans-serif;
  font-size: 8px;
}
.live-translator-enable-button:hover {
  background: white;
}
.live-translator-enable-button-indicator {
  display: inline-block;
  height: 6px;
  width: 6px;
  margin-left: 2px;
  border-radius: 100%;
  background-color: red;
}
.live-translator-badge-container {
  position: absolute !important;
  display: flex;
  z-index: 10000;
}
.live-translator-badge {
  width: 10px !important;
  height: 10px !important;
  border-radius: 10px !important;
  box-shadow: 0px 0px 5px black !important;
  opacity: 0.5 !important;
}
.live-translator-badge:hover {
  opacity: 1 !important;
}
.live-translator-badge.text {
  background: green !important;
}
.live-translator-badge.text:hover {
  background: lightgreen !important;
  box-shadow: 0px 0px 5px lightgreen !important;
}
.live-translator-badge.attribute {
  background: blue !important;
}
.live-translator-badge.attribute:hover {
  background: #00c0ff !important;
  box-shadow: 0px 0px 5px #00c0ff !important;
}
`

class ZeroWidthEncoder {
  START = '\u200B'
  ZERO = '\u200C'
  ONE = '\u200D'
  SPACE = '\u200E'
  END = '\u200F'

  encode (text: string) {
    const binary = text
      .split('')
      .map((char) => char.charCodeAt(0).toString(2))
      .join(' ')

    const zeroWidth = binary
      .split('')
      .map((binaryNum) => {
        const num = parseInt(binaryNum, 10)
        if (num === 1) {
          return this.ONE
        } else if (num === 0) {
          return this.ZERO
        }
        return this.SPACE
      })
      .join('')
    return this.START + zeroWidth + this.END
  }

  decode (zeroWidth: string) {
    const binary = zeroWidth
      .split('')
      .slice(1, zeroWidth.length - 1) // remove START and END
      .map((char) => {
        if (char === this.ONE) {
          return '1'
        } else if (char === this.ZERO) {
          return '0'
        }
        return ' '
      })
      .join('')

    const text = binary
      .split(' ')
      .map((num) => String.fromCharCode(parseInt(num, 2)))
      .join('')
    return text
  }
}

class LiveTranslatorEnabler {
  _enabled: boolean
  persist: boolean

  constructor (persist: boolean) {
    this._enabled = false
    this.persist = persist
    const savedRaw = localStorage.getItem('live-translator-enabled')
    if (persist && savedRaw) {
      const saved = JSON.parse(savedRaw)
      if (typeof saved === 'boolean') {
        this.toggle(saved)
      }
    }
  }

  enabled () {
    return this._enabled
  }

  toggle (enable?: boolean) {
    if (enable !== undefined) {
      this._enabled = enable
    } else {
      this._enabled = !this._enabled
    }
    if (this.persist) {
      localStorage.setItem('live-translator-enabled', JSON.stringify(this._enabled))
    }
  }
}

export type TranslationMeta = {
  locale: string,
  message: string,
  values: unknown,
  path: string,
}

type LiveTranslatorPluginOptions = {
  i18n: VueI18n
  translationLink: (meta: TranslationMeta) => string
  persist?: boolean
}

const createBadge = (meta: TranslationMeta, options: LiveTranslatorPluginOptions, attribute?: string) => {
  const badge = document.createElement('a')
  badge.classList.add('live-translator-badge')
  let title = meta.path + ': ' + meta.message
  if (attribute) {
    title = `[${attribute}] ${title}`
    badge.classList.add('attribute')
  } else {
    badge.classList.add('text')
  }
  badge.title = title
  badge.href = options.translationLink(meta)
  badge.target = 'popup'
  badge.addEventListener('click', (e: Event) => {
    window.open(badge.href, 'popup', 'width=600,height=600,scrollbars=no,resizable=no')
    e.preventDefault()
    return false
  })
  return badge
}

export const LiveTranslatorPlugin = {
  install (app: VueConstructor<Vue>, options: LiveTranslatorPluginOptions) {
    console.log('LiveTranslator is installed')
    const zw = new ZeroWidthEncoder()
    const ltEnabler = new LiveTranslatorEnabler(options.persist || false)

    const enableButton = document.createElement('button')
    enableButton.innerText = 'LT'
    enableButton.classList.add('live-translator-enable-button')
    const indicator = document.createElement('span')
    indicator.classList.add('live-translator-enable-button-indicator')
    enableButton.appendChild(indicator)
    enableButton.addEventListener('click', () => {
      ltEnabler.toggle()
      visualize()
      // Refresh translations to show immediately
      const originalLocale = options.i18n.locale
      options.i18n.locale = ''
      options.i18n.locale = originalLocale
    })
    document.body.appendChild(enableButton)

    const style = document.createElement('style')
    style.id = 'live-translator-plugin-style'
    style.innerHTML = css
    document.head.appendChild(style)

    const visualize = () => {
      const badges = document.querySelectorAll('.live-translator-badge')
      badges.forEach((badge) => {
        badge.remove()
      })

      indicator.style.background = ltEnabler.enabled() ? 'lightgreen' : 'red'

      if (!ltEnabler.enabled()) {
        return
      }

      const re = new RegExp(`${zw.START}[${zw.ZERO}${zw.ONE}${zw.SPACE}]+${zw.END}`, 'gm')

      const queue = [document.documentElement] as Node[]
      while (queue.length > 0) {
        const node = queue.pop() as HTMLElement

        const badges = [] as HTMLElement[]
        const parent = node.parentElement as Element

        if (node instanceof Text) {
          const matches = (node.textContent as string).match(re)
          for (const match of matches ?? []) {
            const meta = JSON.parse(zw.decode(match)) as TranslationMeta
            badges.push(createBadge(meta, options))
          }
        }

        const attributes = (node.attributes ? [...node.attributes] : [])
          .map((attribute) => ({ attribute, match: attribute.value.match(re) }))
          .filter(({ match }) => !!match)
        for (const { attribute, match } of attributes) {
          for (const m of (match as RegExpMatchArray)) {
            const meta = JSON.parse(zw.decode(m)) as TranslationMeta
            badges.push(createBadge(meta, options, attribute.name))
          }
        }

        if (badges.length) {
          let container
          if (node.previousElementSibling && node.previousElementSibling.classList.contains('live-translator-badge-container')) {
            container = node.previousElementSibling
          } else {
            container = document.createElement('span')
            container.classList.add('live-translator-badge-container')
            parent.insertBefore(container, node)
          }
          for (const badge of badges) {
            container.appendChild(badge)
          }
        }

        for (const child of node.childNodes) {
          queue.push(child)
        }
      }
    }

    const originalFormatter = options.i18n.formatter
    options.i18n.formatter = {
      interpolate (message, values, path) {
        const meta = zw.encode(
          JSON.stringify({
            message,
            values,
            path,
            locale: options.i18n.locale,
          }),
        )
        const original = originalFormatter.interpolate(message, values, path) as unknown[] | null
        return (original && ltEnabler.enabled()) ? [meta, ...original] : original
      },
    }

    const throttler = _.throttle(visualize, 800)
    const observer = new MutationObserver(throttler)
    observer.observe(document.documentElement,
      {
        subtree: true,
        attributes: true,
        characterData: true,
        childList: false,
      },
    )
    document.documentElement.addEventListener('mousemove', throttler)
  },
}
