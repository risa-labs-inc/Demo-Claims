import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const stages = searchParams.get('stages')
    const statuses = searchParams.get('statuses')
    const assignee = searchParams.get('assignee')
    const primaryPlan = searchParams.get('primaryPlan')
    const secondaryPlan = searchParams.get('secondaryPlan')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const providerNpi = searchParams.get('providerNpi')

    const where: Record<string, unknown> = {}

    // Handle multiple stages
    if (stages) {
      const stageList = stages.split(',').filter(Boolean)
      if (stageList.length > 0) {
        where.stage = { in: stageList }
      }
    }

    // Handle multiple statuses
    if (statuses) {
      const statusList = statuses.split(',').filter(Boolean)
      if (statusList.length > 0) {
        where.claimStatus = { in: statusList }
      }
    }

    // Handle assignee filter by name
    if (assignee) {
      where.assignedTo = { name: assignee }
    }

    // Handle primary plan filter
    if (primaryPlan) {
      const planList = primaryPlan.split(',').filter(Boolean)
      if (planList.length > 0) {
        where.primaryInsurance = { in: planList }
      }
    }

    // Handle secondary plan filter
    if (secondaryPlan) {
      const planList = secondaryPlan.split(',').filter(Boolean)
      if (planList.length > 0) {
        where.secondaryInsurance = { in: planList }
      }
    }

    // Handle date of service filter
    if (dateFrom || dateTo) {
      where.dateOfService = {}
      if (dateFrom) {
        (where.dateOfService as Record<string, unknown>).gte = new Date(dateFrom)
      }
      if (dateTo) {
        (where.dateOfService as Record<string, unknown>).lte = new Date(dateTo)
      }
    }

    // Handle provider NPI filter
    if (providerNpi) {
      const npiList = providerNpi.split(',').filter(Boolean)
      if (npiList.length > 0) {
        where.providerNpi = { in: npiList }
      }
    }

    if (search) {
      where.OR = [
        { patientFirstName: { contains: search } },
        { patientLastName: { contains: search } },
        { primaryMemberId: { contains: search } },
        { secondaryMemberId: { contains: search } },
        { claimId: { contains: search } },
        { mrn: { contains: search } },
      ]
    }

    const claims = await prisma.claim.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(claims)
  } catch (error) {
    console.error('Failed to fetch claims:', error)
    return NextResponse.json(
      { error: 'Failed to fetch claims' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const claim = await prisma.claim.create({
      data: {
        patientFirstName: body.patientFirstName,
        patientLastName: body.patientLastName,
        mrn: body.mrn,
        dateOfBirth: new Date(body.dateOfBirth),
        dateOfService: new Date(body.dateOfService),
        chargeAmount: body.chargeAmount,
        primaryInsurance: body.primaryInsurance,
        primaryMemberId: body.primaryMemberId,
        secondaryInsurance: body.secondaryInsurance,
        secondaryMemberId: body.secondaryMemberId,
        providerFirstName: body.providerFirstName,
        providerLastName: body.providerLastName,
        providerNpi: body.providerNpi,
        claimId: body.claimId,
        stage: body.stage || 'PENDING',
        claimStatus: body.claimStatus,
        assignedToId: body.assignedToId,
      },
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

    return NextResponse.json(claim, { status: 201 })
  } catch (error) {
    console.error('Failed to create claim:', error)
    return NextResponse.json(
      { error: 'Failed to create claim' },
      { status: 500 }
    )
  }
}
