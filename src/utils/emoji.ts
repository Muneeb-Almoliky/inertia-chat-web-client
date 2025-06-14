import twemoji from 'twemoji'

export function emojiUrl(emoji: string) {
  const code = Array.from(emoji)
    .map(char => char.codePointAt(0)!.toString(16))
    .join('-')
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/${code}.svg`
}

export interface EmojiRenderProps {
  emoji: {
    native: string
  }
  size: number
}

export function parseEmoji(element: HTMLElement | null) {
  if (!element) return
  twemoji.parse(element, {
    callback: (icon: string) => {
      // Don't parse copyright, registered, trademark symbols
      if (['a9', 'ae', '2122'].includes(icon)) {
        return false
      }
      return `https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/svg/${icon}.svg`
    }
  })
}