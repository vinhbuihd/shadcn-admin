import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  type Bookmark,
  useCreateBookmark,
  useUpdateBookmark,
} from '@/features/bookmarks/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type BookmarkFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Bookmark
}

const formSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(200),
  url: z.string().trim().min(1, 'URL is required.').url('Enter a valid URL.'),
  note: z.string().trim().max(2000).optional(),
})
type BookmarkForm = z.infer<typeof formSchema>

export function BookmarkFormDialog({
  open,
  onOpenChange,
  currentRow,
}: BookmarkFormDialogProps) {
  const isUpdate = !!currentRow
  const createBookmark = useCreateBookmark()
  const updateBookmark = useUpdateBookmark()
  const isPending = createBookmark.isPending || updateBookmark.isPending

  const form = useForm<BookmarkForm>({
    resolver: zodResolver(formSchema),
    values: {
      title: currentRow?.title ?? '',
      url: currentRow?.url ?? '',
      note: currentRow?.note ?? '',
    },
  })

  function onSubmit(data: BookmarkForm) {
    const input = { title: data.title, url: data.url, note: data.note || null }

    if (isUpdate) {
      updateBookmark.mutate(
        { id: currentRow.id, ...input },
        {
          onSuccess: () => {
            toast.success('Bookmark updated successfully!')
            onOpenChange(false)
          },
        }
      )
      return
    }

    createBookmark.mutate(input, {
      onSuccess: () => {
        toast.success('Bookmark created successfully!')
        form.reset({ title: '', url: '', note: '' })
        onOpenChange(false)
      },
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) form.reset()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isUpdate ? 'Update' : 'Add'} Bookmark</DialogTitle>
          <DialogDescription>
            {isUpdate
              ? 'Update the bookmark details below.'
              : 'Save a new bookmark by providing the details below.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='bookmark-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter a title' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='url'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input placeholder='https://example.com' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='note'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea placeholder='Optional note' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button form='bookmark-form' type='submit' disabled={isPending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
