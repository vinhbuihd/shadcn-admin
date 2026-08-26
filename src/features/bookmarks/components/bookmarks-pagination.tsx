import { Button } from '@/components/ui/button'
import { type BookmarkListMeta } from '@/features/bookmarks/api'

type BookmarksPaginationProps = {
  meta: BookmarkListMeta
  onPageChange: (page: number) => void
}

export function BookmarksPagination({
  meta,
  onPageChange,
}: BookmarksPaginationProps) {
  if (meta.total === 0) return null

  return (
    <div className='flex items-center justify-between pt-2'>
      <p className='text-muted-foreground text-sm'>
        {meta.total} bookmark{meta.total === 1 ? '' : 's'} — page {meta.page} /{' '}
        {meta.totalPages}
      </p>
      <div className='flex items-center gap-2'>
        <Button
          variant='outline'
          size='sm'
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
        >
          Previous
        </Button>
        <Button
          variant='outline'
          size='sm'
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
