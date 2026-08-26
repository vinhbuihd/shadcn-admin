import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { tagsQueryOptions } from '@/features/tags/api'

type BookmarksToolbarProps = {
  search: string
  tagId: string | undefined
  onSearchChange: (search: string) => void
  onTagIdChange: (tagId: string | undefined) => void
}

export function BookmarksToolbar({
  search,
  tagId,
  onSearchChange,
  onTagIdChange,
}: BookmarksToolbarProps) {
  const { data: tags } = useQuery(tagsQueryOptions())
  const [searchInput, setSearchInput] = useState(search)

  useEffect(() => {
    setSearchInput(search)
  }, [search])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== search) onSearchChange(searchInput)
    }, 400)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  return (
    <div className='flex flex-wrap items-center gap-2'>
      <Input
        placeholder='Search by title or note...'
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className='h-9 w-64'
      />
      <Select
        value={tagId ?? 'all'}
        onValueChange={(value) =>
          onTagIdChange(value === 'all' ? undefined : value)
        }
      >
        <SelectTrigger size='sm' className='w-40'>
          <SelectValue placeholder='Filter by tag' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value='all'>All tags</SelectItem>
          {(tags ?? []).map((tag) => (
            <SelectItem key={tag.id} value={tag.id}>
              {tag.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
