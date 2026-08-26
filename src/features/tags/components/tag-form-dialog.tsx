import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
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
import { type Tag, useCreateTag, useUpdateTag } from '@/features/tags/api'

type TagFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Tag
}

const formSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(50),
})
type TagForm = z.infer<typeof formSchema>

export function TagFormDialog({
  open,
  onOpenChange,
  currentRow,
}: TagFormDialogProps) {
  const isUpdate = !!currentRow
  const createTag = useCreateTag()
  const updateTag = useUpdateTag()
  const isPending = createTag.isPending || updateTag.isPending

  const form = useForm<TagForm>({
    resolver: zodResolver(formSchema),
    values: { name: currentRow?.name ?? '' },
  })

  function onSubmit(data: TagForm) {
    if (isUpdate) {
      updateTag.mutate(
        { id: currentRow.id, name: data.name },
        {
          onSuccess: () => {
            toast.success('Tag updated successfully!')
            onOpenChange(false)
          },
        }
      )
      return
    }

    createTag.mutate(data, {
      onSuccess: () => {
        toast.success('Tag created successfully!')
        form.reset({ name: '' })
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
          <DialogTitle>{isUpdate ? 'Update' : 'Add'} Tag</DialogTitle>
          <DialogDescription>
            {isUpdate
              ? 'Update the tag name below.'
              : 'Create a new tag to organize your bookmarks.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id='tag-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter a tag name' {...field} />
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
          <Button form='tag-form' type='submit' disabled={isPending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
