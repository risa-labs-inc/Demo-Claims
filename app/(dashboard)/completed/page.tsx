import { ClaimsTable } from '@/components/claims/ClaimsTable'

export default function CompletedCasesPage() {
  return <ClaimsTable title="Completed Cases" filterByStage={['PROCESSED']} />
}
