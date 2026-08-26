import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { type Bookmark, bookmarksQueryOptions } from '@/features/bookmarks/api'
import { BookmarkDeleteDialog } from './components/bookmark-delete-dialog'
import { BookmarkFormDialog } from './components/bookmark-form-dialog'
import { BookmarksPagination } from './components/bookmarks-pagination'
import { BookmarksTable } from './components/bookmarks-table'
import { BookmarksToolbar } from './components/bookmarks-toolbar'

const routeApi = getRouteApi('/_authenticated/bookmarks/')

export function Bookmarks() {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()

  const { data, isPending, isPlaceholderData } = useQuery({
    ...bookmarksQueryOptions({
      search: search.search,
      tagId: search.tagId,
      page: search.page,
      pageSize: search.pageSize,
    }),
    placeholderData: keepPreviousData,
  })

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

        <BookmarksToolbar
          search={search.search ?? ''}
          tagId={search.tagId}
          onSearchChange={(value) =>
            navigate({
              search: (prev) => ({
                ...prev,
                search: value || undefined,
                page: undefined,
              }),
            })
          }
          onTagIdChange={(value) =>
            navigate({
              search: (prev) => ({ ...prev, tagId: value, page: undefined }),
            })
          }
        />

        <div className='mt-4'>
          {isPending ? (
            <div className='text-muted-foreground flex h-32 items-center justify-center'>
              <Loader2 className='size-5 animate-spin' />
            </div>
          ) : (
            <div className={isPlaceholderData ? 'opacity-60' : undefined}>
              <BookmarksTable
                data={data?.data ?? []}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          )}
        </div>

        {data?.meta && (
          <BookmarksPagination
            meta={data.meta}
            onPageChange={(page) =>
              navigate({ search: (prev) => ({ ...prev, page }) })
            }
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
