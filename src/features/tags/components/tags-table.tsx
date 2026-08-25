import { Pencil, Trash2 } from 'lucide-react'
import { type Tag } from '@/features/tags/api'
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

type TagsTableProps = {
  data: Tag[]
  onEdit: (tag: Tag) => void
  onDelete: (tag: Tag) => void
}

export function TagsTable({ data, onEdit, onDelete }: TagsTableProps) {
  if (data.length === 0) {
    return (
      <div className='text-muted-foreground flex h-32 items-center justify-center rounded-md border border-dashed text-sm'>
        No tags yet. Create your first one to organize bookmarks.
      </div>
    )
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className='text-end'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((tag) => (
            <TableRow key={tag.id}>
              <TableCell>
                <Badge variant='secondary'>{tag.name}</Badge>
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {new Date(tag.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className='text-end'>
                <Button variant='ghost' size='icon' onClick={() => onEdit(tag)}>
                  <Pencil className='size-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => onDelete(tag)}
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
