import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Plus } from 'lucide-react'
import { type Bookmark, bookmarksQueryOptions } from '@/features/bookmarks/api'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { BookmarkDeleteDialog } from './components/bookmark-delete-dialog'
import { BookmarkFormDialog } from './components/bookmark-form-dialog'
import { BookmarksTable } from './components/bookmarks-table'

export function Bookmarks() {
  const { data, isPending } = useQuery(bookmarksQueryOptions())
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [currentRow, setCurrentRow] = useState<Bookmark | undefined>()

  function handleAdd() {
    setCurrentRow(undefined)
    setFormOpen(true)
  }

  function handleEdit(bookmark: Bookmark) {
    setCurrentRow(bookmark)
    setFormOpen(true)
  }

  function handleDelete(bookmark: Bookmark) {
    setCurrentRow(bookmark)
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
            <h2 className='text-2xl font-bold tracking-tight'>Bookmarks</h2>
            <p className='text-muted-foreground'>
              Manage the links you&apos;ve saved.
            </p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className='me-1 size-4' /> Add Bookmark
          </Button>
        </div>

        {isPending ? (
          <div className='text-muted-foreground flex h-32 items-center justify-center'>
            <Loader2 className='size-5 animate-spin' />
          </div>
        ) : (
          <BookmarksTable
            data={data ?? []}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </Main>

      <BookmarkFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        currentRow={currentRow}
      />
      {currentRow && (
        <BookmarkDeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          currentRow={currentRow}
        />
      )}
    </>
  )
}
