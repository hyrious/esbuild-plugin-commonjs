const none = 0
const allExceptSlash = 1 // '*'
const allIncludingSlash = 2 // '**'

interface GlobPart {
  prefix: string
  wildcard: 0 | 1 | 2
}

// https://github.com/evanw/esbuild/blob/main/internal/helpers/glob.go
function parseGlobPattern(text: string): GlobPart[] {
  let pattern: GlobPart[] = []
  let star: number, count: number, wildcard: 0 | 1 | 2
  while (text.length > 0) {
    star = text.indexOf('*')
    if (star < 0) {
      pattern.push({ prefix: text, wildcard: none })
      break
    }

    count = 1
    while (star + count < text.length && text[star + count] === '*') {
      count++
    }
    wildcard = allExceptSlash

    if (
      count > 1 &&
      (star === 0 || text[star - 1] === '/' || text[star - 1] === '\\') &&
      (star + count === text.length || text[star + count] === '/' || text[star + count] === '\\')
    ) {
      wildcard = allIncludingSlash
    }

    pattern.push({ prefix: text.slice(0, star), wildcard })
    text = text.slice(star + count)
  }
  return pattern
}

type Match = (text: string) => boolean

export function createMatch(text: string): Match {
  let pattern = parseGlobPattern(text)
  if (pattern.length === 0) {
    return () => false
  }

  let regex = '^'
  let wasGlobStar = false
  for (let part of pattern) {
    let prefix = part.prefix
    if (wasGlobStar && prefix.length > 0 && (prefix[0] === '/' || prefix[0] === '\\')) {
      prefix = prefix.slice(1) // Skip '/'
    }
    regex += escapeRegExp(prefix)
    switch (part.wildcard) {
      case allIncludingSlash:
        regex += '(?:[^/]*(?:/|$))*'
        wasGlobStar = true
        break
      case allExceptSlash:
        regex += '[^/]*'
        wasGlobStar = true
        break
    }
  }
  regex += '$'

  const re = new RegExp(regex)
  return re.test.bind(re)
}

// lodash.escapeRegExp
const reRegExpChar = /[\\^$.*+?()[\]{}|]/g
const reHasRegExpChar = /*#__PURE__*/ RegExp(reRegExpChar.source)

function escapeRegExp(string: string): string {
  return string && reHasRegExpChar.test(string) ? string.replace(reRegExpChar, '\\$&') : string
}

export function createMultiMatch(patterns: string[]): Match {
  const matchers = patterns.map(expr => createMatch(expr))
  return function match(text: string): boolean {
    return matchers.some(matcher => matcher(text))
  }
}
