export const dynamic = 'force-dynamic'

import { ClaimsTable } from '@/components/claims/ClaimsTable'
import prisma from '@/lib/prisma'
import { serializeClaims } from '@/lib/serialize'

export default async function DashboardPage() {
  const raw = await prisma.claim.findMany({
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
    take: 100,
  })

  return <ClaimsTable title="All Claims" initialClaims={serializeClaims(raw)} />
}
