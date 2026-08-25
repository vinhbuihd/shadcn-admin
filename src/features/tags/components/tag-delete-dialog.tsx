import { toast } from 'sonner'
import { type Tag, useDeleteTag } from '@/features/tags/api'
import { ConfirmDialog } from '@/components/confirm-dialog'

type TagDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Tag
}

export function TagDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: TagDeleteDialogProps) {
  const deleteTag = useDeleteTag()

  function handleConfirm() {
    deleteTag.mutate(currentRow.id, {
      onSuccess: () => {
        toast.success('Tag deleted successfully!')
        onOpenChange(false)
      },
    })
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Delete tag'
      desc={
        <>
          Are you sure you want to delete{' '}
          <span className='font-bold'>{currentRow.name}</span>? This action
          cannot be undone.
        </>
      }
      destructive
      confirmText='Delete'
      isLoading={deleteTag.isPending}
      handleConfirm={handleConfirm}
    />
  )
}
