import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ClaimsTable } from '@/components/claims/ClaimsTable'
import prisma from '@/lib/prisma'
import { serializeClaims } from '@/lib/serialize'

export default async function MyCasesPage() {
  const session = await getServerSession(authOptions)
  const userName = session?.user?.name || ''

  const raw = await prisma.claim.findMany({
    where: userName ? { assignedTo: { name: userName } } : {},
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
    take: 100,
  })

  return <ClaimsTable title="My Cases" filterByAssignee={userName} initialClaims={serializeClaims(raw)} />
}
