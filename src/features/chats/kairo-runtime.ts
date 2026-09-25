type ListOptions = {
  target: HTMLElement
  token: string
  graphqlUrl: string
  wsUrl: string
  layout: 'split'
  kinds: ('direct' | 'group' | 'channel' | 'business')[]
  selectedId?: string
  panel?: { livekitUrl: string }
  onSelect?: (
    conversationId: string,
    jumpTo?: { messageId: string; seq: number }
  ) => void
  onSessionEnded?: (reason: string) => void
}

declare global {
  interface Window {
    KairoConversationListV2?: {
      mount: (options: ListOptions) => () => void
      select: (target: HTMLElement, conversationId: string | null) => void
    }
  }
}

const SCRIPT_URL =
  'https://d3ikqcrv5ojj7m.cloudfront.net/sdk/v2/kairo-widget.js'
let scriptPromise: Promise<void> | undefined

export function loadKairoRuntime(): Promise<void> {
  if (window.KairoConversationListV2) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = SCRIPT_URL
      script.async = true
      script.onload = () =>
        window.KairoConversationListV2
          ? resolve()
          : reject(new Error('Kairos script loaded without a chat list'))
      script.onerror = () => reject(new Error('Could not load Kairos chat'))
      document.head.appendChild(script)
    }).catch((error) => {
      scriptPromise = undefined
      throw error
    })
  }
  return scriptPromise
}
