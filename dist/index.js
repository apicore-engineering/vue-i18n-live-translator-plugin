import throttle from 'lodash/throttle';
import forIn from 'lodash/forIn';
import cloneDeep from 'lodash/cloneDeep';
import set from 'lodash/set';
const css = `
.live-translator-enable-button {
  position: fixed !important;
  top: 2px;
  left: 2px;
  z-index: 10000;
  padding: 2px;
  color: black;
  background: rgba(255, 255, 255, 0.6);
  font-family: sans-serif;
  font-size: 8px;
  border-radius: 10px;
  display: flex;
  gap: 2px;
  align-items: center;
}
.live-translator-enable-button:hover {
  background: white;
}
.live-translator-enable-button-indicator {
  display: inline-block;
  height: 10px;
  width: 10px;
  border-radius: 100%;
  background-color: red;
}
.live-translator-badge-container {
  position: absolute !important;
  background: rgba(255,255,255,0.5);
  outline: solid 2px rgba(255,255,255,0.5);
  border-radius: 5px;
  display: flex;
  gap: 2px;
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
  outline: solid 2px lightgreen !important;
  box-shadow: 0px 0px 5px lightgreen !important;
  position: absolute;
  border-radius: 7px;
  z-index: 9999;
  display: none;
}
.live-translator-box.attribute {
  outline: solid 2px #00c0ff !important;
  box-shadow: 0px 0px 5px #00c0ff !important;
}
`;
function deepForIn(object, fn) {
    const iteratee = (v, k) => {
        if (typeof v === 'object') {
            forIn(v, (childV, childK) => iteratee(childV, `${k}.${childK}`));
        }
        else {
            fn(v, k);
        }
    };
    forIn(object, iteratee);
}
function encodeMessages(messagesObject, locale) {
    const messages = cloneDeep(messagesObject);
    deepForIn(messages, (message, path) => {
        const parts = message.split('|').map(part => part.trim());
        for (let i = 0; i < parts.length; i++) {
            const meta = ZeroWidthEncoder.encode(JSON.stringify({
                locale,
                message,
                path,
                choice: i || undefined,
            }));
            parts[i] = meta + parts[i];
        }
        set(messages, path, parts.join(' | '));
    });
    return messages;
}
class ZeroWidthEncoder {
    static START = '\u200B';
    static ZERO = '\u200C';
    static ONE = '\u200D';
    static SPACE = '\u200E';
    static END = '\u200F';
    static PATTERN = `${this.START}[${this.ZERO}${this.ONE}${this.SPACE}]+${this.END}`;
    static encode(text) {
        const binary = text
            .split('')
            .map((char) => char.charCodeAt(0).toString(2))
            .join(' ');
        const zeroWidth = binary
            .split('')
            .map((binaryNum) => {
            const num = parseInt(binaryNum, 10);
            if (num === 1) {
                return this.ONE;
            }
            else if (num === 0) {
                return this.ZERO;
            }
            return this.SPACE;
        })
            .join('');
        return this.START + zeroWidth + this.END;
    }
    static decode(zeroWidth) {
        const binary = zeroWidth
            .split('')
            .slice(1, zeroWidth.length - 1) // remove START and END
            .map((char) => {
            if (char === this.ONE) {
                return '1';
            }
            else if (char === this.ZERO) {
                return '0';
            }
            return ' ';
        })
            .join('');
        const text = binary
            .split(' ')
            .map((num) => String.fromCharCode(parseInt(num, 2)))
            .join('');
        return text;
    }
}
class Cache {
    _cache = {};
    has(key) {
        return key in this._cache;
    }
    store(key, value) {
        this._cache[key] = { value, locked: true };
    }
    lock(key) {
        this._cache[key].locked = true;
    }
    clear(force = false) {
        for (const key in this._cache) {
            if (!force && this._cache[key].locked) {
                this._cache[key].locked = false;
            }
            else {
                this._cache[key].value.remove();
                delete this._cache[key];
            }
        }
    }
    get length() {
        return Object.keys(this._cache).length;
    }
}
class LiveTranslatorManager {
    _enabled;
    _options;
    _enableButton;
    _indicator;
    _box;
    _wrapper;
    _cache = new Cache();
    constructor(options) {
        this._enabled = false;
        this._options = options;
        // handle persistance
        const savedRaw = localStorage.getItem('live-translator-enabled');
        if (this._options.persist && savedRaw) {
            const saved = JSON.parse(savedRaw);
            if (typeof saved === 'boolean') {
                this.toggle(saved);
            }
        }
        // initialize UI
        this._enableButton = document.createElement('button');
        this._indicator = document.createElement('span');
        const style = document.createElement('style');
        style.id = 'live-translator-plugin-style';
        style.innerHTML = css;
        document.head.appendChild(style);
        this._enableButton.innerText = 'LT';
        this._enableButton.classList.add('live-translator-enable-button');
        this._indicator.classList.add('live-translator-enable-button-indicator');
        this._enableButton.appendChild(this._indicator);
        this._enableButton.addEventListener('click', () => {
            this.toggle();
            this.render();
        });
        document.body.appendChild(this._enableButton);
        this._wrapper = document.createElement('div');
        this._wrapper.classList.add('live-translator-wrapper');
        document.body.prepend(this._wrapper);
        this._box = document.createElement('div');
        this._box.classList.add('live-translator-box');
        this._wrapper.appendChild(this._box);
        // initialize encode
        for (const locale of this.i18n.availableLocales) {
            let messages = this.i18n.getLocaleMessage(locale);
            messages = encodeMessages(messages, locale);
            this.i18n.setLocaleMessage(locale, messages);
        }
        // initialize decode & render
        const throttler = throttle(() => this.render(), this._options.refreshRate || 50);
        const observer = new MutationObserver(throttler);
        observer.observe(document.documentElement, {
            subtree: true,
            attributes: true,
            characterData: true,
            childList: false,
        });
        document.documentElement.addEventListener('mousemove', throttler);
        window.setInterval(throttler, (this._options.refreshRate || 50) * 2);
        // render for the first time
        this.render();
    }
    get root() {
        return this._options.root || document.documentElement;
    }
    get i18n() {
        return this._options.i18n.global || this._options.i18n;
    }
    toggle(enable) {
        if (enable !== undefined) {
            this._enabled = enable;
        }
        else {
            this._enabled = !this._enabled;
        }
        if (this._options.persist) {
            localStorage.setItem('live-translator-enabled', JSON.stringify(this._enabled));
        }
        console.log(`%c Live Translator ${this._enabled ? 'ON' : 'OFF'} `, 'background: #222; color: #bada55');
        if (!this._enabled) {
            this._cache.clear(true);
        }
    }
    render() {
        this._indicator.style.background = this._enabled ? 'lightgreen' : 'red';
        if (!this._enabled) {
            return;
        }
        const re = new RegExp(ZeroWidthEncoder.PATTERN, 'gm');
        const queue = [this.root];
        while (queue.length > 0) {
            const node = queue.pop();
            const badges = [];
            let cacheKeyParts = [];
            if (node instanceof Text) {
                const matches = node.textContent.match(re);
                for (const match of matches ?? []) {
                    const meta = JSON.parse(ZeroWidthEncoder.decode(match));
                    const badge = createBadge(meta, this._options, node);
                    badge.addEventListener('mouseenter', () => this.showBox(node));
                    badge.addEventListener('mouseleave', () => this.hideBox());
                    badges.push(badge);
                    cacheKeyParts.push(meta.path);
                }
            }
            const attributes = (node.attributes ? [...node.attributes] : [])
                .map((attribute) => ({ attribute, match: attribute.value.match(re) }))
                .filter(({ match }) => !!match);
            for (const { attribute, match } of attributes) {
                for (const m of match) {
                    const meta = JSON.parse(ZeroWidthEncoder.decode(m));
                    const badge = createBadge(meta, this._options, node, attribute.name);
                    badge.addEventListener('mouseenter', () => this.showBox(node, true));
                    badge.addEventListener('mouseleave', () => this.hideBox());
                    badges.push(badge);
                    cacheKeyParts.push(meta.path);
                }
            }
            if (badges.length) {
                let position = { top: 0, left: 0 };
                try {
                    let isVisible = !this._options.checkVisibility;
                    if (node instanceof Text) {
                        const clientRect = getBoundingClientRect(node);
                        position.top = clientRect.top + window.scrollY;
                        position.left = clientRect.left + window.screenX;
                        const elemOnTop = document.elementFromPoint(clientRect.left + clientRect.width / 2, clientRect.top + clientRect.height / 2);
                        isVisible = isVisible ||
                            node.parentElement.contains(elemOnTop) ||
                            this._wrapper.contains(elemOnTop);
                    }
                    else {
                        const clientRect = node.getClientRects()[0];
                        position.top = clientRect.top + clientRect.height - 10 + window.scrollY;
                        position.left = clientRect.left + window.screenX;
                        const elemOnTop = document.elementFromPoint(clientRect.left + clientRect.width / 2, clientRect.top + clientRect.height / 2);
                        isVisible = isVisible ||
                            node.contains(elemOnTop) ||
                            this._wrapper.contains(elemOnTop);
                    }
                    if (!isVisible) {
                        continue;
                    }
                }
                catch (error) {
                    // console.warn('Could not get bounding box for', node);
                    continue;
                }
                cacheKeyParts.unshift(position.left, position.top);
                const cacheKey = cacheKeyParts.join(';');
                if (!this._cache.has(cacheKey)) {
                    const container = document.createElement('span');
                    container.classList.add('live-translator-badge-container');
                    container.style.top = position.top + 'px';
                    container.style.left = position.left + 'px';
                    this._wrapper.appendChild(container);
                    for (const badge of badges) {
                        container.appendChild(badge);
                    }
                    this._cache.store(cacheKey, container);
                }
                else {
                    this._cache.lock(cacheKey);
                }
            }
            for (const child of node.childNodes) {
                queue.push(child);
            }
        }
        this._cache.clear();
    }
    showBox(node, attribute = false) {
        const rect = !attribute ? getBoundingClientRect(node) : node.getClientRects()[0];
        if (!rect) {
            return;
        }
        if (attribute) {
            this._box.classList.add('attribute');
        }
        else {
            this._box.classList.remove('attribute');
        }
        const padding = 2;
        this._box.style.top = rect.top - padding + window.scrollY + 'px';
        this._box.style.left = rect.left - padding + window.scrollX + 'px';
        this._box.style.width = rect.width + 2 * padding + 'px';
        this._box.style.height = rect.height + 2 * padding + 'px';
        this._box.style.display = 'block';
    }
    hideBox() {
        this._box.style.display = 'none';
    }
}
const createBadge = (meta, options, node, attribute) => {
    const badge = document.createElement('a');
    badge.classList.add('live-translator-badge');
    let title = meta.path + ': ' + meta.message;
    if (attribute) {
        title = `[${attribute}] ${title}`;
        badge.classList.add('attribute');
    }
    else {
        badge.classList.add('text');
    }
    badge.title = title;
    badge.href = options.translationLink(meta);
    badge.target = 'popup';
    badge.addEventListener('click', (e) => {
        console.log('clicked', badge.href);
        window.open(badge.href, 'popup', 'width=600,height=600,scrollbars=no,resizable=no');
        e.preventDefault();
        return false;
    });
    return badge;
};
function getBoundingClientRect(node, textOffset) {
    const range = document.createRange();
    range.selectNodeContents(node);
    return range.getBoundingClientRect();
}
export const LiveTranslatorPlugin = {
    install(app, options) {
        console.log('LiveTranslator is installed');
        new LiveTranslatorManager(options);
    },
};
