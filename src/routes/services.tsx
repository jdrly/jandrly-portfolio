import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/services')({
  component: ServicesPage,
})

function ServicesPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-4xl font-bold">Services</h1>
    </main>
  )
}
