import { createFileRoute, redirect } from '@tanstack/react-router'
import { getCurrentAccount } from '../server/auth.functions'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const account = await getCurrentAccount()
    throw redirect({ to: account ? '/admin' : '/login' })
  },
})
