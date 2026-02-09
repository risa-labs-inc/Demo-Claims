import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get unique providers from claims
    const claims = await prisma.claim.findMany({
      select: {
        providerFirstName: true,
        providerLastName: true,
        providerNpi: true,
      },
      distinct: ['providerNpi'],
    })

    const providers = claims.map(claim => ({
      name: `Dr. ${claim.providerFirstName} ${claim.providerLastName}`,
      npi: claim.providerNpi,
    }))

    // Sort by name
    providers.sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json(providers)
  } catch (error) {
    console.error('Failed to fetch providers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    )
  }
}
