import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { claimIds, userId } = body

    if (!claimIds || !Array.isArray(claimIds) || claimIds.length === 0) {
      return NextResponse.json(
        { error: 'No claims specified' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'No user specified' },
        { status: 400 }
      )
    }

    await prisma.claim.updateMany({
      where: {
        id: { in: claimIds },
      },
      data: {
        assignedToId: userId,
      },
    })

    return NextResponse.json({ success: true, count: claimIds.length })
  } catch (error) {
    console.error('Failed to bulk assign claims:', error)
    return NextResponse.json(
      { error: 'Failed to assign claims' },
      { status: 500 }
    )
  }
}
