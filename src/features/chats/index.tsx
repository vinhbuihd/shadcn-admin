import { useEffect, useRef, useState } from 'react'
import { Handshake, MessageSquarePlus, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { createKairoSession, type KairoSession } from './api'
import { NewBusinessChat } from './components/new-business-chat'
import { NewChat } from './components/new-chat'
import { loadKairoRuntime } from './kairo-runtime'

const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL
const WS_URL = import.meta.env.VITE_WS_URL
const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL

export function Chats() {
  const target = useRef<HTMLDivElement>(null)
  const renewing = useRef(false)
  const selectedId = useRef<string | undefined>(undefined)
  const [open, setOpen] = useState(false)
  const [businessOpen, setBusinessOpen] = useState(false)
  const [session, setSession] = useState<KairoSession | null>(null)
  const [selectionVersion, setSelectionVersion] = useState(0)
  const [generation, setGeneration] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setSession(null)
    setError('')
    loadKairoRuntime()
      .then(async () => {
        if (cancelled) return
        const nextSession = await createKairoSession()
        if (!cancelled) {
          setSession(nextSession)
          renewing.current = false
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Không kết nối được Kairos. Hãy thử lại.')
          renewing.current = false
        }
      })
    return () => {
      cancelled = true
    }
  }, [generation])

  useEffect(() => {
    if (!session) return
    const delay = Math.max(
      0,
      new Date(session.expiresAt).getTime() - Date.now() - 60_000
    )
    const timer = window.setTimeout(
      () => setGeneration((value) => value + 1),
      delay
    )
    return () => window.clearTimeout(timer)
  }, [session])

  useEffect(() => {
    if (!session || !target.current || !window.KairoConversationListV2) return
    let disposed = false
    let dispose: (() => void) | undefined
    try {
      dispose = window.KairoConversationListV2.mount({
        target: target.current,
        token: session.token,
        graphqlUrl: GRAPHQL_URL,
        wsUrl: WS_URL,
        layout: 'split',
        kinds: ['direct', 'group', 'channel', 'business'],
        selectedId: selectedId.current,
        panel: { livekitUrl: LIVEKIT_URL },
        onSelect(conversationId) {
          selectedId.current = conversationId
        },
        onSessionEnded(reason) {
          if (disposed || renewing.current) return
          if (reason === 'locked') {
            setError('Tài khoản Kairos đang bị khóa.')
            return
          }
          renewing.current = true
          setGeneration((value) => value + 1)
        },
      })
    } catch {
      setError('Không mở được khung chat Kairos. Hãy thử lại.')
    }
    return () => {
      disposed = true
      dispose?.()
    }
  }, [session, selectionVersion])

  return (
    <>
      <Header>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>
      <Main fixed>
        <div className='mb-4 flex items-center justify-between gap-3'>
          <div>
            <h1 className='text-2xl font-bold'>Chat nội bộ</h1>
            <p className='text-muted-foreground text-sm'>
              Trò chuyện với mọi người trong hệ thống.
            </p>
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' onClick={() => setBusinessOpen(true)}>
              <Handshake className='me-2 size-4' /> Mời đối tác
            </Button>
            <Button onClick={() => setOpen(true)}>
              <MessageSquarePlus className='me-2 size-4' /> Tạo cuộc trò chuyện
            </Button>
          </div>
        </div>
        {error && (
          <div
            role='alert'
            className='bg-destructive/10 text-destructive mb-3 flex items-center justify-between rounded-md p-3 text-sm'
          >
            <span>{error}</span>
            <Button
              size='sm'
              variant='outline'
              onClick={() => setGeneration((value) => value + 1)}
            >
              <RotateCw className='me-2 size-4' /> Thử lại
            </Button>
          </div>
        )}
        {!session && !error && (
          <p className='text-muted-foreground py-3 text-sm'>
            Đang kết nối Kairos...
          </p>
        )}
        <div
          ref={target}
          className='min-h-0 flex-1 overflow-hidden rounded-md border'
          style={{ height: 'min(72vh, 760px)' }}
        />
        <NewChat
          open={open}
          onOpenChange={setOpen}
          onCreated={(id) => {
            selectedId.current = id
            setSelectionVersion((value) => value + 1)
          }}
        />
        <NewBusinessChat
          open={businessOpen}
          onOpenChange={setBusinessOpen}
          onCreated={(id) => {
            selectedId.current = id
            setSelectionVersion((value) => value + 1)
          }}
        />
      </Main>
    </>
  )
}
