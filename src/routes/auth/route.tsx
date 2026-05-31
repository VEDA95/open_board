import { createFileRoute, Outlet } from "@tanstack/react-router"
import { ModeToggle } from "@components/theme-toggle"
import type { ReactElement, FC } from "react"

function AuthLayout(): ReactElement<FC> {
  return (
    <div className="flex min-h-svh w-full flex-col">
      <main className="flex w-full flex-1 items-center justify-center p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col">
          <Outlet />
        </div>
      </main>
      <footer className="flex w-full flex-col items-end px-6 pb-6 md:px-10 md:pb-10">
        <ModeToggle />
      </footer>
    </div>
  )
}

export const Route = createFileRoute("/auth")({ component: AuthLayout })
