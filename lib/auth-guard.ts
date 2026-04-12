import { auth } from '@/auth'
import { prisma } from '@/db/prisma'
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
    const userId = session?.user?.id
    if (userId) {
      try {
        // TeamMember check — prisma client may not have this model on all schema versions
        const membership = await prisma.teamMember.findFirst({
          where: { userId, status: 'active' },
          select: { id: true },
        })
        if (membership?.id) {
          return session
        }
      } catch {
        // TeamMember model not available in current schema — skip check
      }
    }

    redirect('/unauthorized')
  }

  return session
}

export async function requireSuperAdmin() {
  const session = await auth()
  if (session?.user?.role !== 'superAdmin') {
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

export async function requireContractor() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/sign-in')
  }

  const profile = await prisma.contractorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, subscriptionStatus: true },
  })

  if (!profile) {
    redirect('/onboarding/contractor')
  }

  return session
}
