import { useEffect, useState } from 'react'
import { AxiosError } from 'axios'
import { Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  createDirectChat,
  createGroupChat,
  getChatPeople,
  type ChatPerson,
} from '../api'

type NewChatProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (conversationId: string) => void
}

export function NewChat({ open, onOpenChange, onCreated }: NewChatProps) {
  const [search, setSearch] = useState('')
  const [people, setPeople] = useState<ChatPerson[]>([])
  const [selected, setSelected] = useState<ChatPerson[]>([])
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [requestId, setRequestId] = useState(() => crypto.randomUUID())

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const timer = window.setTimeout(() => {
      setLoading(true)
      getChatPeople(search.trim())
        .then((rows) => {
          if (!cancelled) setPeople(rows)
        })
        .catch(() => {
          if (!cancelled) setError('Không tải được danh sách người dùng.')
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 200)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [open, search])

  useEffect(() => {
    if (!open) {
      setSelected([])
      setSearch('')
      setTitle('')
      setError('')
      setRequestId(crypto.randomUUID())
    }
  }, [open])

  const toggle = (person: ChatPerson) => {
    if (
      selected.length >= 20 &&
      !selected.some((item) => item.id === person.id)
    ) {
      setError('Mỗi nhóm tối đa 20 người được mời.')
      return
    }
    setSelected((current) =>
      current.some((item) => item.id === person.id)
        ? current.filter((item) => item.id !== person.id)
        : [...current, person]
    )
  }

  const create = async () => {
    if (!selected.length || saving) return
    setError('')
    setSaving(true)
    try {
      const id =
        selected.length === 1
          ? await createDirectChat(selected[0].id)
          : await createGroupChat(
              title.trim(),
              selected.map((person) => person.id),
              requestId
            )
      onOpenChange(false)
      onCreated(id)
    } catch (cause) {
      const message =
        cause instanceof AxiosError
          ? (cause.response?.data as { message?: string } | undefined)?.message
          : undefined
      setError(message || 'Không tạo được hội thoại. Hãy thử lại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[560px]'>
        <DialogHeader>
          <DialogTitle>Cuộc trò chuyện mới</DialogTitle>
        </DialogHeader>
        <div className='flex flex-wrap gap-2'>
          {selected.map((person) => (
            <Badge key={person.id}>
              {person.name}
              <button
                type='button'
                onClick={() => toggle(person)}
                aria-label={`Bỏ ${person.name}`}
                className='ms-1'
              >
                <X className='size-3' />
              </button>
            </Badge>
          ))}
        </div>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder='Tìm tên hoặc email...'
        />
        <div className='max-h-64 space-y-1 overflow-y-auto'>
          {loading && (
            <p className='text-muted-foreground text-sm'>Đang tải...</p>
          )}
          {!loading && people.length === 0 && (
            <p className='text-muted-foreground text-sm'>
              Không tìm thấy người dùng.
            </p>
          )}
          {people.map((person) => (
            <button
              key={person.id}
              type='button'
              onClick={() => toggle(person)}
              className='hover:bg-accent flex w-full items-center justify-between rounded-md px-2 py-2 text-start'
            >
              <span>
                <span className='block text-sm font-medium'>{person.name}</span>
                <span className='text-muted-foreground text-xs'>
                  {person.email}
                </span>
              </span>
              {selected.some((item) => item.id === person.id) && (
                <Check className='size-4' />
              )}
            </button>
          ))}
        </div>
        {selected.length > 1 && (
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            placeholder='Tên nhóm (bắt buộc)'
          />
        )}
        {error && (
          <p role='alert' className='text-destructive text-sm'>
            {error}
          </p>
        )}
        <Button
          onClick={create}
          disabled={
            saving || !selected.length || (selected.length > 1 && !title.trim())
          }
        >
          {saving
            ? 'Đang tạo...'
            : selected.length > 1
              ? 'Tạo nhóm'
              : 'Bắt đầu chat'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
