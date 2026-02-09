import { ClaimsTable } from '@/components/claims/ClaimsTable'

export default function DeniedCasesPage() {
  return <ClaimsTable title="My Denied Cases" filterByClaimStatus={['DENIED']} />
}
