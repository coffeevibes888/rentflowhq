import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export async function requireAdmin() {
  const session = await auth()
  const role = session?.user?.role

  const isAllowed =
    role === 'admin' ||
    role === 'superAdmin' ||
    role === 'landlord' ||
    role === 'property_manager'

  if (!isAllowed) {
    redirect('/unauthorized')
  }

  return session
}

export async function requireUser() {
  const session = await auth()

  if (!session?.user) {
    redirect('/sign-in')
  }

  return session
}
