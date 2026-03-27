import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const stage = searchParams.get('stage')
    const providerNpi = searchParams.get('providerNpi')

    const where: Record<string, unknown> = {}

    if (stage && stage !== 'ALL') {
      where.stage = stage
    }

    if (providerNpi) {
      const npiList = providerNpi.split(',').filter(Boolean)
      if (npiList.length > 0) {
        where.providerNpi = { in: npiList }
      }
    }

    if (search) {
      where.OR = [
        { patientFirstName: { contains: search, mode: 'insensitive' } },
        { patientLastName: { contains: search, mode: 'insensitive' } },
        { primaryMemberId: { contains: search, mode: 'insensitive' } },
        { secondaryMemberId: { contains: search, mode: 'insensitive' } },
        { claimId: { contains: search, mode: 'insensitive' } },
      ]
    }

    const claims = await prisma.claim.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Generate CSV
    const headers = [
      'Patient First Name',
      'Patient Last Name',
      'MRN',
      'Date of Birth',
      'Date of Service',
      'Charge Amount',
      'Primary Insurance',
      'Primary Member ID',
      'Secondary Insurance',
      'Secondary Member ID',
      'Provider First Name',
      'Provider Last Name',
      'Provider NPI',
      'Claim ID',
      'Stage',
      'Claim Status',
      'Claim Number',
      'Claim Received Date',
      'Check Number',
      'Check Date',
      'Paid Amount',
      'Payment Date',
      'Denial Codes',
      'Denied Line Items',
      'Denial Description',
      'Remarks',
      'Assigned To',
    ]

    const rows = claims.map((claim) => [
      claim.patientFirstName,
      claim.patientLastName,
      claim.mrn,
      claim.dateOfBirth.toISOString().split('T')[0],
      claim.dateOfService.toISOString().split('T')[0],
      claim.chargeAmount.toString(),
      claim.primaryInsurance,
      claim.primaryMemberId,
      claim.secondaryInsurance || '',
      claim.secondaryMemberId || '',
      claim.providerFirstName,
      claim.providerLastName,
      claim.providerNpi,
      claim.claimId,
      claim.stage,
      claim.claimStatus || '',
      claim.claimNumber || '',
      claim.claimReceivedDate?.toISOString().split('T')[0] || '',
      claim.checkNumber || '',
      claim.checkDate?.toISOString().split('T')[0] || '',
      claim.paidAmount?.toString() || '',
      claim.paymentDate?.toISOString().split('T')[0] || '',
      claim.denialCodes || '',
      claim.deniedLineItems || '',
      claim.denialDescription || '',
      claim.remarks || '',
      claim.assignedTo?.name || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="claims-export.csv"`,
      },
    })
  } catch (error) {
    console.error('Failed to export claims:', error)
    return NextResponse.json(
      { error: 'Failed to export claims' },
      { status: 500 }
    )
  }
}
