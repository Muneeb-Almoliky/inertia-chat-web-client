import twemoji from 'twemoji'

export const parseEmoji = (text: string) => {
  if (!text) return ''
  return twemoji.parse(text, {
    folder: '72x72',
    ext: '.png',
    base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/'
  })
}