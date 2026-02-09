import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

// Parse date from MM/DD/YYYY format
function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null
  const parts = dateStr.split('/')
  if (parts.length !== 3) return null
  const [month, day, year] = parts
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
}

async function main() {
  console.log('Seeding database...')

  // Create demo users
  const password = await hash('password123', 12)
  const johnPassword = await hash('risa@2026', 12)

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'alex@example.com' },
      update: {},
      create: { name: 'Alex Brown', email: 'alex@example.com', password },
    }),
    prisma.user.upsert({
      where: { email: 'jane@example.com' },
      update: {},
      create: { name: 'Jane Smith', email: 'jane@example.com', password },
    }),
    prisma.user.upsert({
      where: { email: 'sarah@example.com' },
      update: {},
      create: { name: 'Sarah Williams', email: 'sarah@example.com', password },
    }),
    prisma.user.upsert({
      where: { email: 'mike@example.com' },
      update: {},
      create: { name: 'Mike Johnson', email: 'mike@example.com', password },
    }),
    prisma.user.upsert({
      where: { email: 'john@example.com' },
      update: {},
      create: { name: 'John Doe', email: 'john@example.com', password },
    }),
    prisma.user.upsert({
      where: { email: 'john@risalabs.ai' },
      update: { password: johnPassword },
      create: { name: 'John Doe', email: 'john@risalabs.ai', password: johnPassword },
    }),
  ])

  console.log('Created users:', users.map(u => u.name))

  // Delete existing claims
  await prisma.claim.deleteMany()

  // Hardcoded claims data
  const claimsData = [
    { mrn: '770487', patientFirstName: 'Linda', patientLastName: 'Johnson', dateOfBirth: '05/04/1962', providerFirstName: 'Dr. Michael', providerLastName: 'Martinez', providerNpi: '121819600', primaryInsurance: 'Blue Cross Blue Shield', dateOfService: '12/13/2025', primaryMemberId: '389083863', secondaryInsurance: 'Medicare', secondaryMemberId: '794026542', claimId: 'GYK11615', chargeAmount: 8702.55, claimReceivedDate: '01/09/2026', claimNumber: '5940781618', claimStatus: 'PENDING', checkNumber: '', checkDate: '', paidAmount: 0, paidDate: '', deniedCode: '', denialDescription: '', deniedLineItems: '', stage: 'PENDING_VALIDATION', secondaryClaimReceivedDate: '', secondaryClaimNumber: '', secondaryClaimStatus: 'PENDING', secondaryCheckNumber: '', secondaryCheckDate: '', secondaryPaidAmount: 0, secondaryPaidDate: '', secondaryDeniedCode: '', secondaryDenialDescription: '', secondaryDeniedLineItems: '' },
    { mrn: '838797', patientFirstName: 'Robert', patientLastName: 'Williams', dateOfBirth: '08/31/1979', providerFirstName: 'Dr. Michael', providerLastName: 'Jackson', providerNpi: '141316475', primaryInsurance: 'United Healthcare', dateOfService: '12/11/2025', primaryMemberId: '534192832', secondaryInsurance: 'Aetna', secondaryMemberId: '764835030', claimId: 'ZKM41395', chargeAmount: 13477.56, claimReceivedDate: '01/04/2026', claimNumber: '3767242388', claimStatus: 'NOT_ON_FILE', checkNumber: '', checkDate: '', paidAmount: 0, paidDate: '', deniedCode: '', denialDescription: '', deniedLineItems: '', stage: 'PENDING_VALIDATION', secondaryClaimReceivedDate: '', secondaryClaimNumber: '', secondaryClaimStatus: 'PENDING', secondaryCheckNumber: '', secondaryCheckDate: '', secondaryPaidAmount: 0, secondaryPaidDate: '', secondaryDeniedCode: '', secondaryDenialDescription: '', secondaryDeniedLineItems: '' },
    { mrn: '518801', patientFirstName: 'Lisa', patientLastName: 'Anderson', dateOfBirth: '03/16/1956', providerFirstName: 'Dr. Amanda', providerLastName: 'Davis', providerNpi: '110122691', primaryInsurance: 'Aetna', dateOfService: '12/02/2025', primaryMemberId: '978480184', secondaryInsurance: 'Cigna', secondaryMemberId: '514627048', claimId: 'YFQ14893', chargeAmount: 13192.96, claimReceivedDate: '01/01/2026', claimNumber: '2528809570', claimStatus: 'PARTIALLY_PAID', checkNumber: '4303911718', checkDate: '01/10/2026', paidAmount: 10214.64, paidDate: '01/10/2026', deniedCode: 'PR-2', denialDescription: 'Coinsurance amount', deniedLineItems: '82063, 31643', stage: 'PROCESSED', secondaryClaimReceivedDate: '01/02/2026', secondaryClaimNumber: '6728865570', secondaryClaimStatus: 'DENIED', secondaryCheckNumber: '', secondaryCheckDate: '', secondaryPaidAmount: 0, secondaryPaidDate: '', secondaryDeniedCode: 'PR-2', secondaryDenialDescription: 'Coinsurance amount', secondaryDeniedLineItems: '82063, 31643' },
    { mrn: '377932', patientFirstName: 'Kimberly', patientLastName: 'Hill', dateOfBirth: '12/24/1968', providerFirstName: 'Dr. Michael', providerLastName: 'Wilson', providerNpi: '134657871', primaryInsurance: 'United Healthcare', dateOfService: '12/21/2025', primaryMemberId: '150983930', secondaryInsurance: 'Medicare', secondaryMemberId: '103105183', claimId: 'IVP38299', chargeAmount: 10133.13, claimReceivedDate: '01/05/2026', claimNumber: '7376311656', claimStatus: 'PENDING', checkNumber: '', checkDate: '', paidAmount: 0, paidDate: '', deniedCode: '', denialDescription: '', deniedLineItems: '', stage: 'PENDING', secondaryClaimReceivedDate: '', secondaryClaimNumber: '', secondaryClaimStatus: 'PENDING', secondaryCheckNumber: '', secondaryCheckDate: '', secondaryPaidAmount: 0, secondaryPaidDate: '', secondaryDeniedCode: '', secondaryDenialDescription: '', secondaryDeniedLineItems: '' },
    { mrn: '777568', patientFirstName: 'Michael', patientLastName: 'Brown', dateOfBirth: '01/23/1968', providerFirstName: 'Dr. Robert', providerLastName: 'Jackson', providerNpi: '113338726', primaryInsurance: 'United Healthcare', dateOfService: '01/11/2026', primaryMemberId: '731781080', secondaryInsurance: 'Aetna', secondaryMemberId: '132677360', claimId: 'FMA64746', chargeAmount: 847.12, claimReceivedDate: '01/22/2026', claimNumber: '8723430980', claimStatus: 'PAID', checkNumber: '7882081219', checkDate: '01/29/2026', paidAmount: 847.12, paidDate: '01/29/2026', deniedCode: '', denialDescription: '', deniedLineItems: '', stage: 'PROCESSED', secondaryClaimReceivedDate: '01/22/2026', secondaryClaimNumber: '7428195063', secondaryClaimStatus: 'DENIED', secondaryCheckNumber: '', secondaryCheckDate: '', secondaryPaidAmount: 0, secondaryPaidDate: '', secondaryDeniedCode: 'CO-22', secondaryDenialDescription: 'This care may be covered by another payer per coordination of benefits.', secondaryDeniedLineItems: '' },
    { mrn: '808011', patientFirstName: 'Jessica', patientLastName: 'Sanchez', dateOfBirth: '05/19/1955', providerFirstName: 'Dr. Christopher', providerLastName: 'Martinez', providerNpi: '199091699', primaryInsurance: 'Cigna', dateOfService: '01/06/2026', primaryMemberId: '435346247', secondaryInsurance: 'Medicare', secondaryMemberId: '510799118', claimId: 'GQI25135', chargeAmount: 4040.54, claimReceivedDate: '01/10/2026', claimNumber: '4278498084', claimStatus: 'DENIED', checkNumber: '', checkDate: '', paidAmount: 0, paidDate: '', deniedCode: 'CO-18', denialDescription: 'Exact duplicate claim/service', deniedLineItems: '82512, 30374, 45697', stage: 'PROCESSED', secondaryClaimReceivedDate: '01/11/2026', secondaryClaimNumber: '4258498084', secondaryClaimStatus: 'DENIED', secondaryCheckNumber: '', secondaryCheckDate: '', secondaryPaidAmount: 0, secondaryPaidDate: '', secondaryDeniedCode: 'CO-18', secondaryDenialDescription: 'Exact duplicate claim/service', secondaryDeniedLineItems: '82512, 30374, 45697' },
    { mrn: '395442', patientFirstName: 'Joshua', patientLastName: 'Wilson', dateOfBirth: '05/19/1965', providerFirstName: 'Dr. Michael', providerLastName: 'Taylor', providerNpi: '148740164', primaryInsurance: 'Blue Cross Blue Shield', dateOfService: '12/21/2025', primaryMemberId: '524278680', secondaryInsurance: 'United Healthcare', secondaryMemberId: '112805982', claimId: 'NEB45053', chargeAmount: 11074.81, claimReceivedDate: '12/22/2025', claimNumber: '3158692322', claimStatus: 'DENIED', checkNumber: '', checkDate: '', paidAmount: 0, paidDate: '', deniedCode: 'CO-31', denialDescription: 'Patient cannot be identified as our insured', deniedLineItems: '97806, 42527', stage: 'PROCESSED', secondaryClaimReceivedDate: '12/22/2025', secondaryClaimNumber: '5156693321', secondaryClaimStatus: 'PAID', secondaryCheckNumber: '9951386756', secondaryCheckDate: '01/02/2026', secondaryPaidAmount: 10073, secondaryPaidDate: '01/02/2026', secondaryDeniedCode: '', secondaryDenialDescription: '', secondaryDeniedLineItems: '' },
    { mrn: '379766', patientFirstName: 'David', patientLastName: 'Miller', dateOfBirth: '02/28/1967', providerFirstName: 'Dr. Emily', providerLastName: 'Thompson', providerNpi: '173375433', primaryInsurance: 'Blue Cross Blue Shield', dateOfService: '12/18/2025', primaryMemberId: '654145868', secondaryInsurance: 'Medicare', secondaryMemberId: '501429401', claimId: 'TNL56981', chargeAmount: 14238.23, claimReceivedDate: '01/01/2026', claimNumber: '6934060883', claimStatus: 'PAID', checkNumber: '5951484656', checkDate: '01/15/2026', paidAmount: 14238.23, paidDate: '01/15/2026', deniedCode: '', denialDescription: '', deniedLineItems: '', stage: 'PROCESSED', secondaryClaimReceivedDate: '01/01/2026', secondaryClaimNumber: '3984712650', secondaryClaimStatus: 'DENIED', secondaryCheckNumber: '', secondaryCheckDate: '', secondaryPaidAmount: 0, secondaryPaidDate: '', secondaryDeniedCode: 'CO-24', secondaryDenialDescription: 'Charges are covered under a capitation agreement/managed care plan.', secondaryDeniedLineItems: '' },
    { mrn: '681343', patientFirstName: 'William', patientLastName: 'Gonzalez', dateOfBirth: '11/10/1968', providerFirstName: 'Dr. Lisa', providerLastName: 'Taylor', providerNpi: '129946804', primaryInsurance: 'Medicare', dateOfService: '12/10/2025', primaryMemberId: '699577738', secondaryInsurance: 'United Healthcare', secondaryMemberId: '721489513', claimId: 'VJH32003', chargeAmount: 13400.63, claimReceivedDate: '12/15/2025', claimNumber: '7917693676', claimStatus: 'PENDING', checkNumber: '', checkDate: '', paidAmount: 0, paidDate: '', deniedCode: '', denialDescription: '', deniedLineItems: '', stage: 'PENDING', secondaryClaimReceivedDate: '', secondaryClaimNumber: '', secondaryClaimStatus: 'PENDING', secondaryCheckNumber: '', secondaryCheckDate: '', secondaryPaidAmount: 0, secondaryPaidDate: '', secondaryDeniedCode: '', secondaryDenialDescription: '', secondaryDeniedLineItems: '' },
    { mrn: '907451', patientFirstName: 'Michael', patientLastName: 'Ramirez', dateOfBirth: '10/26/1959', providerFirstName: 'Dr. Sarah', providerLastName: 'Jackson', providerNpi: '187083172', primaryInsurance: 'Aetna', dateOfService: '12/29/2025', primaryMemberId: '798687277', secondaryInsurance: 'Medicare', secondaryMemberId: '434873471', claimId: 'WJH45581', chargeAmount: 3181.83, claimReceivedDate: '01/13/2026', claimNumber: '2236231665', claimStatus: 'IN_PROCESS', checkNumber: '', checkDate: '', paidAmount: 0, paidDate: '', deniedCode: '', denialDescription: '', deniedLineItems: '', stage: 'VALIDATED', secondaryClaimReceivedDate: '', secondaryClaimNumber: '', secondaryClaimStatus: 'PENDING', secondaryCheckNumber: '', secondaryCheckDate: '', secondaryPaidAmount: 0, secondaryPaidDate: '', secondaryDeniedCode: '', secondaryDenialDescription: '', secondaryDeniedLineItems: '' },
    { mrn: '540552', patientFirstName: 'Matthew', patientLastName: 'Nguyen', dateOfBirth: '11/17/1950', providerFirstName: 'Dr. Christopher', providerLastName: 'Brown', providerNpi: '170546688', primaryInsurance: 'Cigna', dateOfService: '12/11/2025', primaryMemberId: '734670656', secondaryInsurance: 'United Healthcare', secondaryMemberId: '272980699', claimId: 'VAC62720', chargeAmount: 7107.57, claimReceivedDate: '01/07/2026', claimNumber: '4653755646', claimStatus: 'PAID', checkNumber: '8053100330', checkDate: '01/16/2026', paidAmount: 7107.57, paidDate: '01/16/2026', deniedCode: '', denialDescription: '', deniedLineItems: '', stage: 'PROCESSED', secondaryClaimReceivedDate: '01/07/2026', secondaryClaimNumber: '8602741938', secondaryClaimStatus: 'DENIED', secondaryCheckNumber: '', secondaryCheckDate: '', secondaryPaidAmount: 0, secondaryPaidDate: '', secondaryDeniedCode: 'CO-24', secondaryDenialDescription: 'Charges are covered under a capitation agreement/managed care plan.', secondaryDeniedLineItems: '' },
    { mrn: '943671', patientFirstName: 'Emily', patientLastName: 'White', dateOfBirth: '01/19/1954', providerFirstName: 'Dr. Lisa', providerLastName: 'Anderson', providerNpi: '148175496', primaryInsurance: 'Medicare', dateOfService: '11/27/2025', primaryMemberId: '370985931', secondaryInsurance: 'Blue Cross Blue Shield', secondaryMemberId: '746120047', claimId: 'DDH82675', chargeAmount: 3337.32, claimReceivedDate: '12/20/2025', claimNumber: '8692617964', claimStatus: 'PARTIALLY_PAID', checkNumber: '3515850643', checkDate: '12/28/2025', paidAmount: 2002.77, paidDate: '12/28/2025', deniedCode: 'CO-16', denialDescription: 'Claim/service lacks information or has submission/billing error(s)', deniedLineItems: '22015, 96870', stage: 'PROCESSED', secondaryClaimReceivedDate: '12/21/2025', secondaryClaimNumber: '7892917964', secondaryClaimStatus: 'PARTIALLY_PAID', secondaryCheckNumber: '5639082147', secondaryCheckDate: '12/31/2025', secondaryPaidAmount: 36.78, secondaryPaidDate: '12/29/2025', secondaryDeniedCode: '', secondaryDenialDescription: '', secondaryDeniedLineItems: '' },
    { mrn: '132663', patientFirstName: 'Patricia', patientLastName: 'Walker', dateOfBirth: '01/07/1968', providerFirstName: 'Dr. Lisa', providerLastName: 'Taylor', providerNpi: '117711592', primaryInsurance: 'Blue Cross Blue Shield', dateOfService: '11/30/2025', primaryMemberId: '499856984', secondaryInsurance: 'Medicare', secondaryMemberId: '789611836', claimId: 'OHN57661', chargeAmount: 11194.38, claimReceivedDate: '12/14/2025', claimNumber: '5654527111', claimStatus: 'PAID', checkNumber: '5280988516', checkDate: '12/30/2025', paidAmount: 11194.38, paidDate: '12/30/2025', deniedCode: '', denialDescription: '', deniedLineItems: '', stage: 'PROCESSED', secondaryClaimReceivedDate: '12/14/2025', secondaryClaimNumber: '9041765289', secondaryClaimStatus: 'DENIED', secondaryCheckNumber: '', secondaryCheckDate: '', secondaryPaidAmount: 0, secondaryPaidDate: '', secondaryDeniedCode: 'CO-24', secondaryDenialDescription: 'Charges are covered under a capitation agreement/managed care plan.', secondaryDeniedLineItems: '' },
    { mrn: '695164', patientFirstName: 'Joshua', patientLastName: 'Garcia', dateOfBirth: '05/11/1952', providerFirstName: 'Dr. Sarah', providerLastName: 'Williams', providerNpi: '190147679', primaryInsurance: 'Aetna', dateOfService: '01/06/2026', primaryMemberId: '438156149', secondaryInsurance: 'Cigna', secondaryMemberId: '784036900', claimId: 'GJG24451', chargeAmount: 1173.92, claimReceivedDate: '02/01/2026', claimNumber: '762268388', claimStatus: 'PARTIALLY_PAID', checkNumber: '607159696', checkDate: '02/19/2026', paidAmount: 924.81, paidDate: '02/19/2026', deniedCode: 'PR-3', denialDescription: 'Co-payment amount', deniedLineItems: '63088', stage: 'PROCESSED', secondaryClaimReceivedDate: '02/03/2026', secondaryClaimNumber: '1762268898', secondaryClaimStatus: 'DENIED', secondaryCheckNumber: '', secondaryCheckDate: '', secondaryPaidAmount: 0, secondaryPaidDate: '', secondaryDeniedCode: 'PR-3', secondaryDenialDescription: 'Co-payment amount', secondaryDeniedLineItems: '63088' },
    { mrn: '478120', patientFirstName: 'Robert', patientLastName: 'King', dateOfBirth: '05/29/1974', providerFirstName: 'Dr. Amanda', providerLastName: 'Jackson', providerNpi: '188067065', primaryInsurance: 'Medicare', dateOfService: '12/13/2025', primaryMemberId: '515319520', secondaryInsurance: 'Blue Cross Blue Shield', secondaryMemberId: '585277221', claimId: 'WYO04303', chargeAmount: 13000.39, claimReceivedDate: '12/25/2025', claimNumber: '548687403', claimStatus: 'PAID', checkNumber: '5415667652', checkDate: '01/14/2026', paidAmount: 13000.39, paidDate: '01/14/2026', deniedCode: '', denialDescription: '', deniedLineItems: '', stage: 'PROCESSED', secondaryClaimReceivedDate: '12/25/2025', secondaryClaimNumber: '2674509813', secondaryClaimStatus: 'DENIED', secondaryCheckNumber: '', secondaryCheckDate: '', secondaryPaidAmount: 0, secondaryPaidDate: '', secondaryDeniedCode: 'CO-22', secondaryDenialDescription: 'This care may be covered by another payer per coordination of benefits.', secondaryDeniedLineItems: '' },
    { mrn: '825686', patientFirstName: 'Ashley', patientLastName: 'White', dateOfBirth: '04/17/1973', providerFirstName: 'Dr. Jennifer', providerLastName: 'Jackson', providerNpi: '116169284', primaryInsurance: 'Medicare', dateOfService: '11/27/2025', primaryMemberId: '154479627', secondaryInsurance: 'Blue Cross Blue Shield', secondaryMemberId: '570596401', claimId: 'VUM58202', chargeAmount: 10218.02, claimReceivedDate: '12/17/2025', claimNumber: '9702135569', claimStatus: 'DENIED', checkNumber: '', checkDate: '', paidAmount: 0, paidDate: '', deniedCode: 'CO-31', denialDescription: 'Patient cannot be identified as our insured', deniedLineItems: '68188, 20077', stage: 'PROCESSED', secondaryClaimReceivedDate: '12/18/2025', secondaryClaimNumber: '4568749264', secondaryClaimStatus: 'PAID', secondaryCheckNumber: '5958785759', secondaryCheckDate: '01/07/2026', secondaryPaidAmount: 987, secondaryPaidDate: '01/07/2026', secondaryDeniedCode: '', secondaryDenialDescription: '', secondaryDeniedLineItems: '' },
    { mrn: '948102', patientFirstName: 'Linda', patientLastName: 'Perez', dateOfBirth: '04/16/1957', providerFirstName: 'Dr. David', providerLastName: 'Taylor', providerNpi: '142054932', primaryInsurance: 'Cigna', dateOfService: '12/18/2025', primaryMemberId: '685161227', secondaryInsurance: 'Aetna', secondaryMemberId: '530463745', claimId: 'JSX90453', chargeAmount: 3365.02, claimReceivedDate: '01/07/2026', claimNumber: '174268414', claimStatus: 'DENIED', checkNumber: '', checkDate: '', paidAmount: 0, paidDate: '', deniedCode: 'CO-22', denialDescription: 'This care may be covered by another payer per coordination of benefits', deniedLineItems: '30078, 69634', stage: 'PROCESSED', secondaryClaimReceivedDate: '01/06/2026', secondaryClaimNumber: '3980805207', secondaryClaimStatus: 'PAID', secondaryCheckNumber: '1966184762', secondaryCheckDate: '01/14/2026', secondaryPaidAmount: 2387.76, secondaryPaidDate: '01/14/2026', secondaryDeniedCode: '', secondaryDenialDescription: '', secondaryDeniedLineItems: '' },
    { mrn: '950069', patientFirstName: 'Sarah', patientLastName: 'Brown', dateOfBirth: '02/28/1971', providerFirstName: 'Dr. Amanda', providerLastName: 'Smith', providerNpi: '193213348', primaryInsurance: 'Blue Cross Blue Shield', dateOfService: '12/16/2025', primaryMemberId: '965223955', secondaryInsurance: 'Medicare', secondaryMemberId: '905992937', claimId: 'RJF70103', chargeAmount: 13789.83, claimReceivedDate: '01/08/2026', claimNumber: '9308705932', claimStatus: 'DENIED', checkNumber: '', checkDate: '', paidAmount: 0, paidDate: '', deniedCode: 'CO-31', denialDescription: 'Patient cannot be identified as our insured', deniedLineItems: '12872', stage: 'PROCESSED', secondaryClaimReceivedDate: '01/08/2026', secondaryClaimNumber: '2804917093', secondaryClaimStatus: 'PAID', secondaryCheckNumber: '6019017232', secondaryCheckDate: '01/23/2026', secondaryPaidAmount: 8765.5, secondaryPaidDate: '01/23/2026', secondaryDeniedCode: '', secondaryDenialDescription: '', secondaryDeniedLineItems: '' },
    { mrn: '893969', patientFirstName: 'Mark', patientLastName: 'Lopez', dateOfBirth: '07/01/1957', providerFirstName: 'Dr. Michael', providerLastName: 'Jackson', providerNpi: '132061632', primaryInsurance: 'Cigna', dateOfService: '12/25/2025', primaryMemberId: '511686854', secondaryInsurance: 'Medicare', secondaryMemberId: '870998616', claimId: 'EES99119', chargeAmount: 4203.67, claimReceivedDate: '12/27/2025', claimNumber: '1485646799', claimStatus: 'DENIED', checkNumber: '', checkDate: '', paidAmount: 0, paidDate: '', deniedCode: 'CO-22', denialDescription: 'This care may be covered by another payer per coordination of benefits', deniedLineItems: '89777, 99235, 62654', stage: 'PROCESSED', secondaryClaimReceivedDate: '12/28/2025', secondaryClaimNumber: '2216973036', secondaryClaimStatus: 'PAID', secondaryCheckNumber: '8011618229', secondaryCheckDate: '01/29/2026', secondaryPaidAmount: 3459.87, secondaryPaidDate: '01/29/2026', secondaryDeniedCode: '', secondaryDenialDescription: '', secondaryDeniedLineItems: '' },
    { mrn: '976052', patientFirstName: 'Robert', patientLastName: 'King', dateOfBirth: '04/14/1961', providerFirstName: 'Dr. Lisa', providerLastName: 'Martinez', providerNpi: '186557790', primaryInsurance: 'Cigna', dateOfService: '12/04/2025', primaryMemberId: '723184322', secondaryInsurance: 'United Healthcare', secondaryMemberId: '259136517', claimId: 'VPP39260', chargeAmount: 3948.07, claimReceivedDate: '12/06/2025', claimNumber: '3029922809', claimStatus: 'DENIED', checkNumber: '', checkDate: '', paidAmount: 0, paidDate: '', deniedCode: 'CO-22', denialDescription: 'This care may be covered by another payer per coordination of benefits', deniedLineItems: '63143, 88558, 83872', stage: 'PROCESSED', secondaryClaimReceivedDate: '12/06/2025', secondaryClaimNumber: '1629028979', secondaryClaimStatus: 'PAID', secondaryCheckNumber: '9804219226', secondaryCheckDate: '01/27/2026', secondaryPaidAmount: 2456.9, secondaryPaidDate: '01/27/2026', secondaryDeniedCode: '', secondaryDenialDescription: '', secondaryDeniedLineItems: '' },
    { mrn: '945328', patientFirstName: 'Elizabeth', patientLastName: 'Miller', dateOfBirth: '04/28/1954', providerFirstName: 'Dr. Amanda', providerLastName: 'Williams', providerNpi: '133984546', primaryInsurance: 'Blue Cross Blue Shield', dateOfService: '01/06/2026', primaryMemberId: '679334101', secondaryInsurance: 'Aetna', secondaryMemberId: '666870021', claimId: 'PNU59180', chargeAmount: 13938.62, claimReceivedDate: '01/08/2026', claimNumber: '3397401489', claimStatus: 'DENIED', checkNumber: '', checkDate: '', paidAmount: 0, paidDate: '', deniedCode: 'CO-31', denialDescription: 'Patient cannot be identified as our insured', deniedLineItems: '37152', stage: 'PROCESSED', secondaryClaimReceivedDate: '01/10/2026', secondaryClaimNumber: '3392861150', secondaryClaimStatus: 'PAID', secondaryCheckNumber: '2026416235', secondaryCheckDate: '01/24/2026', secondaryPaidAmount: 6987.92, secondaryPaidDate: '01/24/2026', secondaryDeniedCode: '', secondaryDenialDescription: '', secondaryDeniedLineItems: '' },
    { mrn: '208310', patientFirstName: 'Mary', patientLastName: 'Garcia', dateOfBirth: '11/16/1965', providerFirstName: 'Dr. Amanda', providerLastName: 'Chen', providerNpi: '199560466', primaryInsurance: 'Blue Cross Blue Shield', dateOfService: '01/15/2026', primaryMemberId: '982622444', secondaryInsurance: 'Medicare', secondaryMemberId: '721264647', claimId: 'ZCL43799', chargeAmount: 6659.32, claimReceivedDate: '02/12/2026', claimNumber: '3712406596', claimStatus: 'PARTIALLY_PAID', checkNumber: '9245937526', checkDate: '02/27/2026', paidAmount: 3954.15, paidDate: '02/27/2026', deniedCode: 'PR-3', denialDescription: 'Co-payment amount', deniedLineItems: '85481, 41775', stage: 'PROCESSED', secondaryClaimReceivedDate: '02/19/2026', secondaryClaimNumber: '3712406594', secondaryClaimStatus: 'DENIED', secondaryCheckNumber: '', secondaryCheckDate: '', secondaryPaidAmount: 0, secondaryPaidDate: '', secondaryDeniedCode: 'PR-3', secondaryDenialDescription: 'Co-payment amount', secondaryDeniedLineItems: '85481, 41775' },
    { mrn: '441716', patientFirstName: 'Matthew', patientLastName: 'Moore', dateOfBirth: '08/17/1967', providerFirstName: 'Dr. Robert', providerLastName: 'Chen', providerNpi: '193982807', primaryInsurance: 'United Healthcare', dateOfService: '01/14/2026', primaryMemberId: '416724342', secondaryInsurance: 'Cigna', secondaryMemberId: '661797968', claimId: 'QWN80589', chargeAmount: 257.16, claimReceivedDate: '01/28/2026', claimNumber: '1135290965', claimStatus: 'PAID', checkNumber: '4388899375', checkDate: '02/14/2026', paidAmount: 257.16, paidDate: '02/14/2026', deniedCode: '', denialDescription: '', deniedLineItems: '', stage: 'PROCESSED', secondaryClaimReceivedDate: '01/28/2026', secondaryClaimNumber: '9184507263', secondaryClaimStatus: 'DENIED', secondaryCheckNumber: '', secondaryCheckDate: '', secondaryPaidAmount: 0, secondaryPaidDate: '', secondaryDeniedCode: 'CO-22', secondaryDenialDescription: 'This care may be covered by another payer per coordination of benefits.', secondaryDeniedLineItems: '' },
    { mrn: '715551', patientFirstName: 'Barbara', patientLastName: 'Sanchez', dateOfBirth: '06/14/1953', providerFirstName: 'Dr. Jennifer', providerLastName: 'Williams', providerNpi: '193968562', primaryInsurance: 'Blue Cross Blue Shield', dateOfService: '12/01/2025', primaryMemberId: '16315999', secondaryInsurance: 'Aetna', secondaryMemberId: '650477358', claimId: 'MNF96194', chargeAmount: 14150.11, claimReceivedDate: '12/04/2025', claimNumber: '3114262655', claimStatus: 'PAID', checkNumber: '7541212678', checkDate: '12/22/2025', paidAmount: 14150.11, paidDate: '12/22/2025', deniedCode: '', denialDescription: '', deniedLineItems: '', stage: 'PROCESSED', secondaryClaimReceivedDate: '12/04/2025', secondaryClaimNumber: '3209647581', secondaryClaimStatus: 'DENIED', secondaryCheckNumber: '', secondaryCheckDate: '', secondaryPaidAmount: 0, secondaryPaidDate: '', secondaryDeniedCode: 'CO-24', secondaryDenialDescription: 'Charges are covered under a capitation agreement/managed care plan.', secondaryDeniedLineItems: '' },
    { mrn: '332022', patientFirstName: 'Barbara', patientLastName: 'Johnson', dateOfBirth: '09/12/1961', providerFirstName: 'Dr. Amanda', providerLastName: 'Garcia', providerNpi: '196423536', primaryInsurance: 'Cigna', dateOfService: '01/06/2026', primaryMemberId: '785477725', secondaryInsurance: 'United Healthcare', secondaryMemberId: '228728080', claimId: 'CVB06231', chargeAmount: 198.52, claimReceivedDate: '01/22/2026', claimNumber: '2038750997', claimStatus: 'PAID', checkNumber: '8600848408', checkDate: '02/09/2026', paidAmount: 198.52, paidDate: '02/09/2026', deniedCode: '', denialDescription: '', deniedLineItems: '', stage: 'PROCESSED', secondaryClaimReceivedDate: '01/22/2026', secondaryClaimNumber: '7951286340', secondaryClaimStatus: 'DENIED', secondaryCheckNumber: '', secondaryCheckDate: '', secondaryPaidAmount: 0, secondaryPaidDate: '', secondaryDeniedCode: 'CO-22', secondaryDenialDescription: 'This care may be covered by another payer per coordination of benefits.', secondaryDeniedLineItems: '' },
  ]

  // Create claims
  for (let i = 0; i < claimsData.length; i++) {
    const claim = claimsData[i]
    const assignedUser = users[i % users.length]

    await prisma.claim.create({
      data: {
        mrn: claim.mrn,
        patientFirstName: claim.patientFirstName,
        patientLastName: claim.patientLastName,
        dateOfBirth: parseDate(claim.dateOfBirth)!,
        providerFirstName: claim.providerFirstName,
        providerLastName: claim.providerLastName,
        providerNpi: claim.providerNpi,
        primaryInsurance: claim.primaryInsurance,
        dateOfService: parseDate(claim.dateOfService)!,
        primaryMemberId: claim.primaryMemberId,
        secondaryInsurance: claim.secondaryInsurance || null,
        secondaryMemberId: claim.secondaryMemberId || null,
        claimId: claim.claimId,
        chargeAmount: claim.chargeAmount,
        claimReceivedDate: parseDate(claim.claimReceivedDate),
        claimNumber: claim.claimNumber || null,
        claimStatus: claim.claimStatus as any,
        checkNumber: claim.checkNumber || null,
        checkDate: parseDate(claim.checkDate),
        paidAmount: claim.paidAmount || null,
        paymentDate: parseDate(claim.paidDate),
        denialCodes: claim.deniedCode || null,
        deniedLineItems: claim.deniedLineItems || null,
        denialDescription: claim.denialDescription || null,
        stage: claim.stage as any,
        secondaryClaimNumber: claim.secondaryClaimNumber || null,
        secondaryClaimReceivedDate: parseDate(claim.secondaryClaimReceivedDate),
        secondaryClaimStatus: claim.secondaryClaimStatus as any || null,
        secondaryCheckNumber: claim.secondaryCheckNumber || null,
        secondaryCheckDate: parseDate(claim.secondaryCheckDate),
        secondaryPaidAmount: claim.secondaryPaidAmount || null,
        secondaryPaymentDate: parseDate(claim.secondaryPaidDate),
        secondaryDenialCodes: claim.secondaryDeniedCode || null,
        secondaryDeniedLineItems: claim.secondaryDeniedLineItems || null,
        secondaryDenialDescription: claim.secondaryDenialDescription || null,
        assignedToId: assignedUser.id,
      },
    })
  }

  console.log(`Created ${claimsData.length} claims`)
  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
