import { BarChart2 } from 'lucide-react'
import { ComingSoon } from '@/components/ui/coming-soon'

export default function RelatoriosPage() {
  return (
    <ComingSoon
      icon={BarChart2}
      title="Relatórios"
      description="Análises detalhadas do funil comercial, performance por vendedor e inteligência de leads. Em breve disponível."
      features={['Funil de conversão', 'Performance por vendedor', 'Leads por segmento e fonte', 'Exportar para Excel / PDF']}
    />
  )
}
