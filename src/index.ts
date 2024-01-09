import throttle from 'lodash/throttle'
import forIn from 'lodash/forIn'
import cloneDeep from 'lodash/cloneDeep'
import set from 'lodash/set'

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
.live-translator-badge-wrapper {
  position: relative !important;
  width: 0px;
  height: 0px;
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
.live-translator-box {
  outline: solid 2px green;
  background: green;
  opacity: 0.1;
  position: absolute;
  border-radius: 4px;
  z-index: 9999;
  display: none;
}
.live-translator-box.attribute {
  outline: solid 2px blue;
  background: blue;
}
`
export type TranslationMeta = {
  locale: string,
  message: string,
  values?: object,
  choice?: number,
  path: string,
}

type LiveTranslatorPluginOptions = {
  translationLink: (meta: TranslationMeta) => string
  persist?: boolean
}

function deepForIn(object: Object, fn: (value: string, key: string) => void) {
  const iteratee = (v, k) => {
    if (typeof v === 'object') {
      forIn(v, (childV, childK) => iteratee(childV, `${k}.${childK}`))
    } else {
      fn(v, k)
    }
  }
  forIn(object, iteratee)
}

export function encodeMessages(messagesObject) {
  const messages = cloneDeep(messagesObject)
  forIn(messages, (localeMessages, locale) => {
    deepForIn(localeMessages, (message, path) => {
      const parts = message.split('|').map(part => part.trim())
      for (let i = 0; i < parts.length; i++) {
        const meta = ZeroWidthEncoder.encode(
          JSON.stringify({
            locale,
            message,
            path,
            choice: i || undefined,
          } as TranslationMeta),
        )
        parts[i] = meta + parts[i]
      }
      set(localeMessages, path, parts.join(' | '))
    })
  })
  return messages
}

abstract class ZeroWidthEncoder {
  static START = '\u200B'
  static ZERO = '\u200C'
  static ONE = '\u200D'
  static SPACE = '\u200E'
  static END = '\u200F'
  static PATTERN = `${this.START}[${this.ZERO}${this.ONE}${this.SPACE}]+${this.END}`

  static encode (text: string) {
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

  static decode (zeroWidth: string) {
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

class LiveTranslatorManager {
  _enabled: boolean
  _options: LiveTranslatorPluginOptions

  _enableButton: HTMLButtonElement
  _indicator: HTMLSpanElement

  _box: HTMLDivElement

  constructor (options: LiveTranslatorPluginOptions) {
    this._enabled = false
    this._options = options

    // handle persistance
    const savedRaw = localStorage.getItem('live-translator-enabled')
    if (this._options.persist && savedRaw) {
      const saved = JSON.parse(savedRaw)
      if (typeof saved === 'boolean') {
        this.toggle(saved)
      }
    }

    // initialize UI
    this._enableButton = document.createElement('button')
    this._indicator = document.createElement('span')
    const style = document.createElement('style')

    style.id = 'live-translator-plugin-style'
    style.innerHTML = css
    document.head.appendChild(style)

    this._enableButton.innerText = 'LT'
    this._enableButton.classList.add('live-translator-enable-button')
    this._indicator.classList.add('live-translator-enable-button-indicator')
    this._enableButton.appendChild(this._indicator)
    this._enableButton.addEventListener('click', () => {
      this.toggle()
      this.render()
    })
    document.body.appendChild(this._enableButton)

    this._box = document.createElement('div')
    this._box.classList.add('live-translator-box')
    document.body.appendChild(this._box)

    // initialize encode
    // encode is moved to i18n.ts file

    // initialize decode & render
    const throttler = throttle(() => this.render(), 800)
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
    window.setInterval(throttler, 1000)

    // render for the first time
    this.render()
  }

  toggle (enable?: boolean) {
    if (enable !== undefined) {
      this._enabled = enable
    } else {
      this._enabled = !this._enabled
    }
    if (this._options.persist) {
      localStorage.setItem('live-translator-enabled', JSON.stringify(this._enabled))
    }
    console.log(`%c Live Translator ${this._enabled ? 'ON' : 'OFF'} `, 'background: #222; color: #bada55');
  }

  render () {
    const badgeWrappers = document.querySelectorAll('.live-translator-badge-wrapper')
    this._box.style.display = 'none'
    badgeWrappers.forEach((wrapper) => {
      wrapper.remove()
    })

    this._indicator.style.background = this._enabled ? 'lightgreen' : 'red'

    if (!this._enabled) {
      return
    }

    const re = new RegExp(ZeroWidthEncoder.PATTERN, 'gm')

    const queue = [document.documentElement] as Node[]
    while (queue.length > 0) {
      const node = queue.pop() as HTMLElement

      const badges = [] as HTMLElement[]
      const parent = node.parentElement as HTMLElement

      const rect = getBoundingClientRect(node)
      if (node instanceof Text) {
        const matches = (node.textContent as string).match(re)
        for (const match of matches ?? []) {
          const meta = JSON.parse(ZeroWidthEncoder.decode(match)) as TranslationMeta
          const badge = createBadge(meta, this._options, node)
          badge.addEventListener('mouseenter', () => this.showBox(node))
          badges.push(badge)
        }
      }

      const attributes = (node.attributes ? [...node.attributes] : [])
        .map((attribute) => ({ attribute, match: attribute.value.match(re) }))
        .filter(({ match }) => !!match)
      for (const { attribute, match } of attributes) {
        for (const m of (match as RegExpMatchArray)) {
          const meta = JSON.parse(ZeroWidthEncoder.decode(m)) as TranslationMeta
          const badge = createBadge(meta, this._options, node, attribute.name)
          badge.addEventListener('mouseenter', () => this.showBox(node, true))
          badges.push(badge)
        }
      }

      if (badges.length) {
        let container: HTMLElement
        if (node.previousElementSibling && node.previousElementSibling.classList.contains('live-translator-badge-container')) {
          container = node.previousElementSibling as HTMLElement
        } else {
          const parentRect = getBoundingClientRect(node instanceof Text ? parent : node);
          container = document.createElement('span')
          container.classList.add('live-translator-badge-container')
          container.style.top = rect.top - parentRect.top + 'px'
          container.style.left = rect.left - parentRect.left + 'px'
          const relativeWrapper = document.createElement('span')
          relativeWrapper.classList.add('live-translator-badge-wrapper')
          relativeWrapper.appendChild(container)
          parent.insertBefore(relativeWrapper, node)
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

  showBox(node: Node, attribute = false) {
    const rect = !attribute ? getBoundingClientRect(node) : (node as Element).getClientRects()[0]
    if (!rect) {
      return
    }
    if (attribute) {
      this._box.classList.add('attribute')
    } else {
      this._box.classList.remove('attribute')
    }
    const padding = 2
    this._box.style.top = rect.top - padding + window.scrollY + 'px'
    this._box.style.left = rect.left - padding + window.scrollX + 'px'
    this._box.style.width = rect.width + 2 * padding + 'px'
    this._box.style.height = rect.height + 2 * padding + 'px'
    this._box.style.display = 'block'
  }
}

const createBadge = (meta: TranslationMeta, options: LiveTranslatorPluginOptions, node: Node, attribute?: string) => {
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

function getBoundingClientRect(node: Node, textOffset?: number) {
  const range = document.createRange();
  range.selectNodeContents(node);
  return range.getBoundingClientRect()
}

export const LiveTranslatorPlugin = {
  install (app: any, options: LiveTranslatorPluginOptions) {
    console.log('LiveTranslator is installed')
    new LiveTranslatorManager(options)
  },
}
