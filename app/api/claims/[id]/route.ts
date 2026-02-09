import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }

    return NextResponse.json(claim)
  } catch (error) {
    console.error('Failed to fetch claim:', error)
    return NextResponse.json(
      { error: 'Failed to fetch claim' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const updateData: Record<string, unknown> = {}

    // Handle stage update
    if (body.stage) {
      updateData.stage = body.stage
    }

    // Handle claim details
    if (body.claimNumber) {
      updateData.claimNumber = body.claimNumber
    }
    if (body.claimReceivedDate) {
      updateData.claimReceivedDate = new Date(body.claimReceivedDate)
    }
    if (body.claimStatus) {
      updateData.claimStatus = body.claimStatus
    }

    // Handle payment details
    if (body.checkNumber !== undefined) {
      updateData.checkNumber = body.checkNumber || null
    }
    if (body.checkDate !== undefined) {
      updateData.checkDate = body.checkDate ? new Date(body.checkDate) : null
    }
    if (body.paidAmount !== undefined) {
      updateData.paidAmount = body.paidAmount ? parseFloat(body.paidAmount) : null
    }
    if (body.paymentDate !== undefined) {
      updateData.paymentDate = body.paymentDate ? new Date(body.paymentDate) : null
    }

    // Handle denial details
    if (body.denialCodes !== undefined) {
      updateData.denialCodes = body.denialCodes || null
    }
    if (body.deniedLineItems !== undefined) {
      updateData.deniedLineItems = body.deniedLineItems || null
    }
    if (body.denialDescription !== undefined) {
      updateData.denialDescription = body.denialDescription || null
    }

    // Handle remarks
    if (body.remarks !== undefined) {
      updateData.remarks = body.remarks || null
    }

    // Handle assignment
    if (body.assignedToId !== undefined) {
      updateData.assignedToId = body.assignedToId || null
    }

    const claim = await prisma.claim.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(claim)
  } catch (error) {
    console.error('Failed to update claim:', error)
    return NextResponse.json(
      { error: 'Failed to update claim' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.claim.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete claim:', error)
    return NextResponse.json(
      { error: 'Failed to delete claim' },
      { status: 500 }
    )
  }
}
