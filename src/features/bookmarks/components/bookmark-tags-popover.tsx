import { useQuery } from '@tanstack/react-query'
import { CheckIcon, Plus } from 'lucide-react'
import {
  type Bookmark,
  useAttachTag,
  useDetachTag,
} from '@/features/bookmarks/api'
import { tagsQueryOptions } from '@/features/tags/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type BookmarkTagsPopoverProps = {
  bookmark: Bookmark
}

export function BookmarkTagsPopover({ bookmark }: BookmarkTagsPopoverProps) {
  const { data: tags } = useQuery(tagsQueryOptions())
  const attachTag = useAttachTag()
  const detachTag = useDetachTag()

  const attachedIds = new Set((bookmark.tags ?? []).map((tag) => tag.id))
  const isPending = attachTag.isPending || detachTag.isPending

  function toggleTag(tagId: string) {
    if (attachedIds.has(tagId)) {
      detachTag.mutate({ bookmarkId: bookmark.id, tagId })
    } else {
      attachTag.mutate({ bookmarkId: bookmark.id, tagId })
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='h-7 border-dashed'
          disabled={isPending}
        >
          <Plus className='size-3.5' /> Tag
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[200px] p-0' align='start'>
        <Command>
          <CommandInput placeholder='Search tags...' />
          <CommandList>
            <CommandEmpty>No tags yet.</CommandEmpty>
            <CommandGroup>
              {(tags ?? []).map((tag) => {
                const isSelected = attachedIds.has(tag.id)
                return (
                  <CommandItem
                    key={tag.id}
                    onSelect={() => toggleTag(tag.id)}
                  >
                    <div
                      className={cn(
                        'border-primary flex size-4 items-center justify-center rounded-sm border',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <CheckIcon className='text-background h-4 w-4' />
                    </div>
                    <span>{tag.name}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
