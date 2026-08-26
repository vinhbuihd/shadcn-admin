import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type Bookmark, useDeleteBookmark } from '@/features/bookmarks/api'

type BookmarkDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Bookmark
}

export function BookmarkDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: BookmarkDeleteDialogProps) {
  const deleteBookmark = useDeleteBookmark()

  function handleConfirm() {
    deleteBookmark.mutate(currentRow.id, {
      onSuccess: () => {
        toast.success('Bookmark deleted successfully!')
        onOpenChange(false)
      },
    })
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Delete bookmark'
      desc={
        <>
          Are you sure you want to delete{' '}
          <span className='font-bold'>{currentRow.title}</span>? This action
          cannot be undone.
        </>
      }
      destructive
      confirmText='Delete'
      isLoading={deleteBookmark.isPending}
      handleConfirm={handleConfirm}
    />
  )
}
