import { useEffect, useState } from 'react'
import { AxiosError } from 'axios'
import { Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { createBusinessChat, type BusinessInvitation } from '../api'

type NewBusinessChatProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (conversationId: string) => void
}

const tenantSlugPattern = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

export function NewBusinessChat({
  open,
  onOpenChange,
  onCreated,
}: NewBusinessChatProps) {
  const [title, setTitle] = useState('')
  const [partnerTenantSlug, setPartnerTenantSlug] = useState('')
  const [requestId, setRequestId] = useState(() => crypto.randomUUID())
  const [invitation, setInvitation] = useState<BusinessInvitation | null>(null)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) return
    setTitle('')
    setPartnerTenantSlug('')
    setRequestId(crypto.randomUUID())
    setInvitation(null)
    setSaving(false)
    setCopied(false)
    setError('')
  }, [open])

  const create = async () => {
    if (saving || !title.trim()) return
    const slug = partnerTenantSlug.trim().toLowerCase()
    if (!tenantSlugPattern.test(slug)) {
      setError('Nhập mã tenant bên sàn, ví dụ: san-xe.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const created = await createBusinessChat(
        title.trim(),
        [],
        slug,
        requestId
      )
      setInvitation(created)
      onCreated(created.conversationId)
    } catch (cause) {
      const message =
        cause instanceof AxiosError
          ? (cause.response?.data as { message?: string } | undefined)?.message
          : undefined
      setError(message || 'Không tạo được kênh hoặc link mời. Hãy thử lại.')
    } finally {
      setSaving(false)
    }
  }

  const copy = async () => {
    if (!invitation) return
    try {
      await navigator.clipboard.writeText(invitation.link)
      setCopied(true)
      setError('')
    } catch {
      setError(
        'Không sao chép tự động được. Hãy chọn và sao chép link trong ô bên dưới.'
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[560px]'>
        <DialogHeader>
          <DialogTitle>
            {invitation ? 'Link mời đối tác' : 'Tạo kênh chat với đối tác'}
          </DialogTitle>
        </DialogHeader>
        {invitation ? (
          <div className='space-y-3'>
            <p className='text-muted-foreground text-sm'>
              Kênh đã được tạo. Gửi link này riêng cho người bên sàn. Link chỉ
              dùng một lần; sau khi đóng cửa sổ, bạn không xem lại được mã mời
              này. Nếu cần link mới, mở thông tin kênh và chọn Mời đối tác.
            </p>
            <div className='flex gap-2'>
              <Input
                aria-label='Link mời đối tác'
                readOnly
                value={invitation.link}
                onFocus={(event) => event.currentTarget.select()}
              />
              <Button type='button' variant='outline' onClick={copy}>
                <Copy className='me-2 size-4' />
                {copied ? 'Đã sao chép' : 'Sao chép'}
              </Button>
            </div>
            <p className='text-muted-foreground text-xs'>
              Hết hạn: {new Date(invitation.expiresAt).toLocaleString('vi-VN')}
            </p>
            {error && (
              <p role='alert' className='text-destructive text-sm'>
                {error}
              </p>
            )}
            <Button type='button' onClick={() => onOpenChange(false)}>
              Xong
            </Button>
          </div>
        ) : (
          <div className='space-y-3'>
            <Input
              aria-label='Tên kênh nghiệp vụ'
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              placeholder='Tên kênh, ví dụ: Trao đổi đơn thuê xe #123'
            />
            <div>
              <Input
                aria-label='Mã tenant Kairos của đối tác'
                value={partnerTenantSlug}
                onChange={(event) => setPartnerTenantSlug(event.target.value)}
                placeholder='Mã tenant bên sàn, ví dụ: san-xe'
                autoCapitalize='none'
                autoComplete='off'
              />
              <p className='text-muted-foreground mt-1 text-xs'>
                Đây là phần đứng trước .sit.yousee.vn trong địa chỉ Kairos của
                sàn.
              </p>
            </div>
            <p className='text-muted-foreground text-sm'>
              Người được mời sẽ đọc được toàn bộ nội dung kênh, kể cả tin và tệp
              gửi trước khi họ tham gia.
            </p>
            {error && (
              <p role='alert' className='text-destructive text-sm'>
                {error}
              </p>
            )}
            <Button
              type='button'
              onClick={create}
              disabled={saving || !title.trim() || !partnerTenantSlug.trim()}
            >
              {saving ? 'Đang tạo...' : 'Tạo kênh và link mời'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
