import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { type Bookmark, useDetachTag } from '@/features/bookmarks/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BookmarkTagsPopover } from './bookmark-tags-popover'

type BookmarksTableProps = {
  data: Bookmark[]
  onEdit: (bookmark: Bookmark) => void
  onDelete: (bookmark: Bookmark) => void
}

export function BookmarksTable({ data, onEdit, onDelete }: BookmarksTableProps) {
  const detachTag = useDetachTag()

  if (data.length === 0) {
    return (
      <div className='text-muted-foreground flex h-32 items-center justify-center rounded-md border border-dashed text-sm'>
        No bookmarks yet. Add your first one to get started.
      </div>
    )
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className='text-end'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((bookmark) => (
            <TableRow key={bookmark.id}>
              <TableCell>
                <a
                  href={bookmark.url}
                  target='_blank'
                  rel='noreferrer'
                  className='flex items-center gap-1 font-medium hover:underline'
                >
                  {bookmark.title}
                  <ExternalLink className='size-3.5 shrink-0' />
                </a>
                <span className='text-muted-foreground block max-w-xs truncate text-xs'>
                  {bookmark.url}
                </span>
              </TableCell>
              <TableCell className='text-muted-foreground max-w-xs truncate whitespace-normal'>
                {bookmark.note || '—'}
              </TableCell>
              <TableCell>
                <div className='flex flex-wrap items-center gap-1'>
                  {(bookmark.tags ?? []).map((tag) => (
                    <Badge key={tag.id} variant='secondary' className='gap-1'>
                      {tag.name}
                      <button
                        type='button'
                        aria-label={`Remove ${tag.name}`}
                        onClick={() =>
                          detachTag.mutate({
                            bookmarkId: bookmark.id,
                            tagId: tag.id,
                          })
                        }
                        className='hover:text-destructive'
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  <BookmarkTagsPopover bookmark={bookmark} />
                </div>
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {new Date(bookmark.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className='text-end'>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => onEdit(bookmark)}
                >
                  <Pencil className='size-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => onDelete(bookmark)}
                >
                  <Trash2 className='size-4' />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
