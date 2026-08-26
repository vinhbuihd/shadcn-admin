import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { type Tag, tagsQueryOptions } from '@/features/tags/api'
import { TagDeleteDialog } from './components/tag-delete-dialog'
import { TagFormDialog } from './components/tag-form-dialog'
import { TagsTable } from './components/tags-table'

export function Tags() {
  const { data, isPending } = useQuery(tagsQueryOptions())
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [currentRow, setCurrentRow] = useState<Tag | undefined>()

  function handleAdd() {
    setCurrentRow(undefined)
    setFormOpen(true)
  }

  function handleEdit(tag: Tag) {
    setCurrentRow(tag)
    setFormOpen(true)
  }

  function handleDelete(tag: Tag) {
    setCurrentRow(tag)
    setDeleteOpen(true)
  }

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Tags</h2>
            <p className='text-muted-foreground'>
              Manage the tags used to organize your bookmarks.
            </p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className='me-1 size-4' /> Add Tag
          </Button>
        </div>

        {isPending ? (
          <div className='text-muted-foreground flex h-32 items-center justify-center'>
            <Loader2 className='size-5 animate-spin' />
          </div>
        ) : (
          <TagsTable
            data={data ?? []}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </Main>

      <TagFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        currentRow={currentRow}
      />
      {currentRow && (
        <TagDeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          currentRow={currentRow}
        />
      )}
    </>
  )
}
