import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface ClaimData {
  patientFirstName: string
  patientLastName: string
  mrn: string
  dateOfBirth: Date
  dateOfService: Date
  chargeAmount: number
  primaryInsurance: string
  primaryMemberId: string
  secondaryInsurance?: string
  secondaryMemberId?: string
  providerFirstName: string
  providerLastName: string
  providerNpi: string
  claimId: string
  stage: string
  claimStatus?: string
  claimNumber?: string
  claimReceivedDate?: Date
  checkNumber?: string
  checkDate?: Date
  paidAmount?: number
  paymentDate?: Date
  denialCodes?: string
  deniedLineItems?: string
  denialDescription?: string
  remarks?: string
}

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n').filter((line) => line.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())

    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index]?.replace(/^"|"$/g, '') || ''
    })
    rows.push(row)
  }

  return rows
}

function mapRowToClaim(row: Record<string, string>): ClaimData | null {
  // Map common CSV header variations to our schema
  const getValue = (keys: string[]): string => {
    for (const key of keys) {
      if (row[key]) return row[key]
    }
    return ''
  }

  const patientFirstName = getValue(['Patient First Name', 'patientFirstName', 'FirstName', 'First Name'])
  const patientLastName = getValue(['Patient Last Name', 'patientLastName', 'LastName', 'Last Name'])
  const mrn = getValue(['MRN', 'mrn', 'Medical Record Number'])
  const dateOfBirth = getValue(['Date of Birth', 'dateOfBirth', 'DOB', 'dob'])
  const dateOfService = getValue(['Date of Service', 'dateOfService', 'DOS', 'dos'])
  const chargeAmount = getValue(['Charge Amount', 'chargeAmount', 'Charge', 'Amount'])
  const primaryInsurance = getValue(['Primary Insurance', 'primaryInsurance', 'Primary Plan', 'Payer'])
  const primaryMemberId = getValue(['Primary Member ID', 'primaryMemberId', 'Member ID', 'MemberID'])
  const providerFirstName = getValue(['Provider First Name', 'providerFirstName', 'Provider FirstName'])
  const providerLastName = getValue(['Provider Last Name', 'providerLastName', 'Provider LastName'])
  const providerNpi = getValue(['Provider NPI', 'providerNpi', 'NPI', 'npi'])
  const claimId = getValue(['Claim ID', 'claimId', 'ClaimID', 'Claim Number'])

  // Validate required fields
  if (!patientFirstName || !patientLastName || !mrn || !primaryInsurance || !claimId) {
    return null
  }

  const claim: ClaimData = {
    patientFirstName,
    patientLastName,
    mrn,
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(),
    dateOfService: dateOfService ? new Date(dateOfService) : new Date(),
    chargeAmount: parseFloat(chargeAmount) || 0,
    primaryInsurance,
    primaryMemberId: primaryMemberId || '',
    providerFirstName: providerFirstName || 'Unknown',
    providerLastName: providerLastName || 'Provider',
    providerNpi: providerNpi || '0000000000',
    claimId,
    stage: 'PENDING',
  }

  // Optional fields
  const secondaryInsurance = getValue(['Secondary Insurance', 'secondaryInsurance', 'Secondary Plan'])
  if (secondaryInsurance) {
    claim.secondaryInsurance = secondaryInsurance
    claim.secondaryMemberId = getValue(['Secondary Member ID', 'secondaryMemberId']) || undefined
  }

  return claim
}

// Simulate automation - randomly populate claim details for some records
function simulateAutomation(claims: ClaimData[]): ClaimData[] {
  const statuses = ['PAID', 'DENIED', 'PARTIALLY_PAID', 'IN_PROCESS', 'NOT_ON_FILE']

  return claims.map((claim) => {
    // 30% chance of having automation data
    if (Math.random() < 0.3) {
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      claim.stage = 'PENDING_VALIDATION'
      claim.claimStatus = status
      claim.claimNumber = `CLM${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`
      claim.claimReceivedDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)

      if (status === 'PAID' || status === 'PARTIALLY_PAID') {
        claim.paidAmount = Math.round(Math.random() * Number(claim.chargeAmount) * 100) / 100
        claim.checkNumber = `CHK${Math.floor(Math.random() * 100000)}`
        claim.checkDate = new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000)
        claim.paymentDate = claim.checkDate
      }

      if (status === 'DENIED' || status === 'PARTIALLY_PAID') {
        const denialCodes = ['CO-4', 'PR-1', 'CO-16', 'PR-96', 'CO-45']
        claim.denialCodes = denialCodes.slice(0, Math.floor(Math.random() * 2) + 1).join(', ')
        claim.deniedLineItems = Array.from(
          { length: Math.floor(Math.random() * 3) + 1 },
          (_, i) => i + 1
        ).join(', ')
        claim.denialDescription = 'Service not covered under plan benefits'
      }
    }

    return claim
  })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const content = await file.text()
    const rows = parseCSV(content)

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid data found in CSV' }, { status: 400 })
    }

    const claims = rows.map(mapRowToClaim).filter((c): c is ClaimData => c !== null)

    if (claims.length === 0) {
      return NextResponse.json(
        { error: 'No valid claims found. Please check CSV format.' },
        { status: 400 }
      )
    }

    // Simulate automation for some claims
    const processedClaims = simulateAutomation(claims)

    // Create claims in database
    const created = await prisma.claim.createMany({
      data: processedClaims,
    })

    return NextResponse.json({
      success: true,
      imported: created.count,
      total: rows.length,
    })
  } catch (error) {
    console.error('Failed to upload claims:', error)
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    )
  }
}
