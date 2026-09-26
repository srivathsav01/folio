import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// Reads text aloud with the browser's own speech engine (Web Speech API): free,
// offline on most devices, and nothing to install. The text is spoken one
// sentence at a time, which does three jobs at once — Chrome silently stops a
// single utterance after ~15 seconds, each sentence's onstart says where the
// reader is, and a pause, speed change or jump can pick up again at a
// sentence boundary instead of mid-word.

export type ReadAloudState = 'idle' | 'playing' | 'paused'

// Offsets point into the text the hook was given, so a caller can map the
// sentence being spoken back onto whatever the text was read from
export interface Sentence {
  text: string
  start: number
  end: number
}

export interface ReadAloudOptions {
  /** localStorage key under which the sentence reached is kept, so a later
      visit can carry on from there. Without one, nothing is remembered. */
  resumeKey?: string
}

export interface ReadAloud {
  state: ReadAloudState
  /** From where the listener last left off, or the top */
  play: () => void
  /** From the top, forgetting any saved place */
  startOver: () => void
  pause: () => void
  resume: () => void
  /** Ends the reading and forgets the saved place */
  stop: () => void
  /** Moves a reading in progress to another sentence */
  seek: (index: number) => void
  /** -1 while idle */
  currentSentenceIndex: number
  /** Where play() will start, or -1 for the top */
  savedSentenceIndex: number
  isSupported: boolean
  sentences: Sentence[]
  rate: number
  setRate: (rate: number) => void
  /** The English voices on this device, best first */
  voices: SpeechSynthesisVoice[]
  /** The one in use: the listener's pick if it's installed, else the best */
  voice: SpeechSynthesisVoice | null
  setVoice: (voiceURI: string) => void
}

export const RATES = [0.75, 1, 1.25, 1.5]

// --- Splitting ---------------------------------------------------------------
//
// A line break always ends a sentence, so a heading without a full stop is
// never run into the paragraph under it. Anything still longer than MAX_CHUNK
// is cut at a clause break, keeping every piece well inside Chrome's limit.

const MAX_CHUNK = 220

const segmenter =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new Intl.Segmenter('en', { granularity: 'sentence' })
    : null

// Up to and including terminal punctuation (and any closing quote or bracket)
// that is followed by whitespace, or else to the end of the line
const SENTENCE = /[\s\S]+?(?:[.!?…]+["'”’)\]]*(?=\s|$)|$)/g

const sentenceSpans = (line: string): [number, number][] =>
  segmenter
    ? Array.from(segmenter.segment(line), s => [s.index, s.index + s.segment.length])
    : Array.from(line.matchAll(SENTENCE), m => [m.index, m.index + m[0].length])

const isSpace = (char: string | undefined) => char !== undefined && /\s/.test(char)

const addSentence = (text: string, from: number, to: number, out: Sentence[]) => {
  let start = from
  let end = to
  while (start < end && isSpace(text[start])) start++
  while (end > start && isSpace(text[end - 1])) end--

  while (end - start > MAX_CHUNK) {
    const window = text.slice(start, start + MAX_CHUNK)
    const clause = Math.max(...Array.from(window.matchAll(/[,;:—–](?=\s)/g), m => m.index + 1), -1)
    const cut = clause > MAX_CHUNK / 3 ? clause : window.lastIndexOf(' ') > 0 ? window.lastIndexOf(' ') : MAX_CHUNK

    out.push({ text: text.slice(start, start + cut).replace(/\s+/g, ' '), start, end: start + cut })
    start += cut
    while (start < end && isSpace(text[start])) start++
  }

  if (end > start) out.push({ text: text.slice(start, end).replace(/\s+/g, ' '), start, end })
}

export const splitIntoSentences = (text: string): Sentence[] => {
  const out: Sentence[] = []
  for (const line of text.matchAll(/[^\n]+/g)) {
    for (const [start, end] of sentenceSpans(line[0])) {
      addSentence(text, line.index + start, line.index + end, out)
    }
  }
  return out
}

// --- Voice -------------------------------------------------------------------
//
// The most natural voices a web page can use for free are the neural
// "Microsoft … Online (Natural)" voices that Edge exposes to speechSynthesis
// (Chrome and Safari have nothing comparable; Siri's voices aren't offered to
// pages). Ava is first, then Microsoft's other flagship US voices; the
// Multilingual variants come after, since they can drift into other accents
// on loanwords. Without Edge, Chrome's "Google US English" is next best.
//
// Safari only offers the voices installed on the device. The natural-sounding
// Apple ones are the Premium and Enhanced downloads (System Settings ›
// Accessibility › Spoken Content › System Voice › Manage Voices, or Settings ›
// Accessibility › Spoken Content › Voices on iOS); without them the best is a
// standard voice like Samantha.

const NATURAL = ['Ava', 'Andrew', 'Emma', 'Brian', 'Jenny', 'Aria', 'Guy']

// Lower is better; Infinity for a voice that isn't an Edge natural one
const naturalRank = (voice: SpeechSynthesisVoice) => {
  const match = voice.name.match(/^Microsoft (\w+?)(Multilingual)? Online \(Natural\)/)
  if (!match || !/^en([-_]|$)/i.test(voice.lang)) return Infinity

  const us = /^en[-_]us$/i.test(voice.lang)
  const at = NATURAL.indexOf(match[1])
  // Named US voices first, then any other US natural voice, then other
  // English accents (Sonia, Libby, Natasha…); plain before Multilingual
  return (us ? 0 : 200) + (at === -1 ? NATURAL.length : at) * 2 + (match[2] ? 1 : 0)
}

const GOOGLE = 'Google US English'

// Apple's English voices, best first
const APPLE = ['Ava', 'Zoe', 'Evan', 'Nathan', 'Allison', 'Samantha', 'Susan', 'Tom', 'Joelle', 'Noelle', 'Alex', 'Daniel', 'Karen', 'Moira', 'Serena', 'Tessa']

// The novelty and Eloquence voices macOS and iOS ship with (Albert, Bells,
// Eddy, Grandma…) sound robotic, so they're a last resort
const NOVELTY =
  /eloquence|novelty|\b(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Junior|Ralph|Kathy|Fred|Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley)\b/i

const isEnglish = (voice: SpeechSynthesisVoice) => /^en([-_]|$)/i.test(voice.lang)

// Lower is better. Safari often names a downloaded Premium voice plain "Ava"
// and keeps the tier in its voiceURI (com.apple.voice.premium.en-US.Ava), so
// the tier is read from both.
const fallbackRank = (voice: SpeechSynthesisVoice) => {
  const id = `${voice.voiceURI} ${voice.name}`.toLowerCase()
  const tier = /premium|natural|neural/.test(id) ? 0 : /enhanced/.test(id) ? 1 : 2

  const lang = voice.lang.replace('_', '-').toLowerCase()
  const locale = (navigator.language || 'en-US').toLowerCase()
  const accent = lang === 'en-us' || lang === locale ? 0 : 1

  const at = APPLE.findIndex(name => new RegExp(`\\b${name}\\b`, 'i').test(voice.name))
  const name = at === -1 ? APPLE.length : at

  return tier * 1000 + accent * 100 + name * 2 + (voice.default ? 0 : 1)
}

// Edge's natural voices, then Google US English, then everything else
const rank = (voice: SpeechSynthesisVoice) => {
  const natural = naturalRank(voice)
  if (natural !== Infinity) return natural
  if (voice.name === GOOGLE) return 1000
  return 2000 + fallbackRank(voice)
}

// The English voices worth offering, best first. The novelty voices are left
// out, unless they're all there is.
export const englishVoices = (all: SpeechSynthesisVoice[]) => {
  const english = all.filter(isEnglish)
  const usable = english.filter(voice => !NOVELTY.test(`${voice.voiceURI} ${voice.name}`))
  return (usable.length ? usable : english).sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
}

// A voice picked by hand is remembered per browser. Voices differ between
// devices, so one that isn't installed here falls back to the best there is.
const VOICE_KEY = 'read-aloud-voice'

const savedVoice = () => {
  try {
    return localStorage.getItem(VOICE_KEY)
  } catch {
    return null
  }
}

// --- Saved place -------------------------------------------------------------
//
// The sentence's text is kept alongside its number, so a post edited since
// the last visit resumes at the same words rather than the same count.

interface Saved {
  index: number
  text: string
}

const readSaved = (key: string | undefined, sentences: Sentence[]) => {
  if (!key || !sentences.length) return -1
  try {
    const saved: Saved | null = JSON.parse(localStorage.getItem(key) ?? 'null')
    if (!saved || typeof saved.index !== 'number') return -1
    if (sentences[saved.index]?.text === saved.text) return saved.index
    return sentences.findIndex(sentence => sentence.text === saved.text)
  } catch {
    return -1
  }
}

const writeSaved = (key: string | undefined, saved: Saved | null) => {
  if (!key) return
  try {
    if (saved) localStorage.setItem(key, JSON.stringify(saved))
    else localStorage.removeItem(key)
  } catch {
    // Storage blocked or full: the place just isn't remembered
  }
}

// --- One reader per page -----------------------------------------------------
//
// There is a single speech queue per page, so starting one reader cuts off any
// other. The one being cut off is told, so its button doesn't stay on Pause.

let activeReader: { reset: () => void } | null = null

// -----------------------------------------------------------------------------

const supported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'

export function useReadAloud(text: string, { resumeKey }: ReadAloudOptions = {}): ReadAloud {
  const isSupported = supported()
  const sentences = useMemo(() => splitIntoSentences(text), [text])

  const [state, setState] = useState<ReadAloudState>('idle')
  const [currentSentenceIndex, setIndex] = useState(-1)
  const [rate, setRateState] = useState(1)
  const [savedSentenceIndex, setSaved] = useState(-1)
  const [voices, setVoices] = useState(() => (isSupported ? englishVoices(window.speechSynthesis.getVoices()) : []))
  const [chosen, setChosen] = useState(savedVoice)

  const voice = useMemo(
    () => voices.find(candidate => candidate.voiceURI === chosen) ?? voices[0] ?? null,
    [voices, chosen],
  )
  const voiceRef = useRef(voice)
  // Bumped whenever speech is cut off, so events from the utterances it
  // dropped (Chrome reports them as errors, Safari as ends) are ignored
  const run = useRef(0)
  // Held so Chrome can't garbage-collect an utterance and never fire its onend
  const queue = useRef<SpeechSynthesisUtterance[]>([])
  const position = useRef(0) // the sentence a resume starts from
  const rateRef = useRef(1)
  const sentencesRef = useRef(sentences)
  const [self] = useState(() => ({ reset: () => {} }))

  useEffect(() => {
    voiceRef.current = voice
  }, [voice])

  // getVoices() is often empty until the engine has loaded its list
  useEffect(() => {
    if (!isSupported) return
    const synth = window.speechSynthesis
    const load = () => setVoices(englishVoices(synth.getVoices()))
    // In case the list landed between the first render and this subscription
    load()

    if ('addEventListener' in synth) {
      synth.addEventListener('voiceschanged', load)
      return () => synth.removeEventListener('voiceschanged', load)
    }
    ;(synth as SpeechSynthesis).onvoiceschanged = load
    return () => {
      ;(synth as SpeechSynthesis).onvoiceschanged = null
    }
  }, [isSupported])

  // Silences the engine without touching React state
  const silence = useCallback(() => {
    run.current++
    queue.current = []
    if (isSupported) window.speechSynthesis.cancel()
  }, [isSupported])

  const reset = useCallback(() => {
    run.current++
    queue.current = []
    position.current = 0
    setState('idle')
    setIndex(-1)
  }, [])

  // The place is saved as each sentence starts, and forgotten once the post is
  // read to the end or the listener stops
  const save = useCallback(
    (index: number) => {
      const sentence = sentencesRef.current[index]
      if (!sentence) return
      writeSaved(resumeKey, { index, text: sentence.text })
      setSaved(index)
    },
    [resumeKey],
  )

  const forget = useCallback(() => {
    writeSaved(resumeKey, null)
    setSaved(-1)
  }, [resumeKey])

  useEffect(() => {
    setSaved(readSaved(resumeKey, sentences))
  }, [resumeKey, sentences])

  const release = useCallback(() => {
    if (activeReader === self) activeReader = null
  }, [self])

  useEffect(() => {
    self.reset = reset
  }, [self, reset])

  const speakFrom = useCallback(
    (from: number) => {
      const list = sentencesRef.current
      if (!isSupported || !list.length) return
      const synth = window.speechSynthesis

      if (activeReader && activeReader !== self) activeReader.reset()
      activeReader = self

      silence()
      const id = run.current

      const finish = (completed: boolean) => {
        if (run.current !== id) return
        if (completed) forget()
        reset()
        release()
      }

      // Spoken synchronously: iOS only lets speech start inside the tap
      queue.current = list.slice(from).map((sentence, offset) => {
        const index = from + offset
        const utterance = new SpeechSynthesisUtterance(sentence.text)
        utterance.rate = rateRef.current
        utterance.lang = voiceRef.current?.lang ?? 'en-US'
        if (voiceRef.current) utterance.voice = voiceRef.current

        utterance.onstart = () => {
          if (run.current !== id) return
          position.current = index
          setIndex(index)
          save(index)
        }
        utterance.onend = () => {
          if (index === list.length - 1) finish(true)
        }
        utterance.onerror = event => {
          // Those two are our own cancel(); anything else ends the reading,
          // keeping the place so it can be picked up again
          if (event.error !== 'interrupted' && event.error !== 'canceled') finish(false)
        }
        return utterance
      })
      queue.current.forEach(utterance => synth.speak(utterance))

      position.current = from
      setIndex(from)
      setState('playing')
    },
    [isSupported, self, silence, reset, release, save, forget],
  )

  const play = useCallback(
    () => speakFrom(Math.max(0, readSaved(resumeKey, sentencesRef.current))),
    [resumeKey, speakFrom],
  )

  const startOver = useCallback(() => {
    forget()
    speakFrom(0)
  }, [forget, speakFrom])

  // Pausing cancels and remembers the sentence rather than calling
  // speechSynthesis.pause(), which Android Chrome treats as a stop and desktop
  // Chrome can fail to resume from. Resuming re-reads the sentence it left.
  const pause = useCallback(() => {
    if (state !== 'playing') return
    silence()
    setState('paused')
  }, [state, silence])

  const resume = useCallback(() => {
    if (state === 'paused') speakFrom(position.current)
  }, [state, speakFrom])

  const stop = useCallback(() => {
    silence()
    forget()
    reset()
    release()
  }, [silence, forget, reset, release])

  // Playing carries on from the new sentence; paused stays paused there
  const seek = useCallback(
    (index: number) => {
      if (index < 0 || index >= sentencesRef.current.length) return
      if (state === 'playing') return speakFrom(index)
      if (state !== 'paused') return
      position.current = index
      setIndex(index)
      save(index)
    },
    [state, speakFrom, save],
  )

  // A mid-sentence rate or voice change doesn't take on a queued utterance,
  // so the current sentence is started again with the new setting
  const setRate = useCallback(
    (next: number) => {
      rateRef.current = next
      setRateState(next)
      if (state === 'playing') speakFrom(position.current)
    },
    [state, speakFrom],
  )

  const setVoice = useCallback(
    (voiceURI: string) => {
      const next = voices.find(candidate => candidate.voiceURI === voiceURI)
      if (!next) return
      voiceRef.current = next
      setChosen(voiceURI)
      try {
        localStorage.setItem(VOICE_KEY, voiceURI)
      } catch {
        // Storage blocked: the choice holds for this visit only
      }
      if (state === 'playing') speakFrom(position.current)
    },
    [voices, state, speakFrom],
  )

  // New text (another post, or an edit under the dev server) and unmounting
  // both end the reading, so it never carries on past the page it belongs to
  useEffect(() => {
    sentencesRef.current = sentences
    return () => {
      if (activeReader !== self) return
      silence()
      reset()
      release()
    }
  }, [sentences, self, silence, reset, release])

  // Chrome keeps talking through a reload or a jump to another site
  useEffect(() => {
    if (!isSupported) return
    const onPageHide = () => window.speechSynthesis.cancel()
    window.addEventListener('pagehide', onPageHide)
    return () => window.removeEventListener('pagehide', onPageHide)
  }, [isSupported])

  return {
    state,
    play,
    startOver,
    pause,
    resume,
    stop,
    seek,
    currentSentenceIndex,
    savedSentenceIndex,
    isSupported,
    sentences,
    rate,
    setRate,
    voices,
    voice,
    setVoice,
  }
}
