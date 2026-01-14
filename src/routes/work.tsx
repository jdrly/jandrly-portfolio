import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/work')({
  component: WorkPage,
})

function WorkPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-4xl font-bold">Work</h1>
    </main>
  )
}
