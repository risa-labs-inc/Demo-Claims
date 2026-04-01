import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const r = await prisma.claim.updateMany({
    where: { mrn: '584921' },
    data: { patientFirstName: 'Jeremy', patientLastName: 'Wade' },
  })
  console.log('Updated:', r.count, 'record(s)')
}
main().catch(console.error).finally(() => prisma.$disconnect())
