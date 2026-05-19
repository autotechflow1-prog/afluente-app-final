import { toast } from 'sonner'
import { useProdutos, useToggleAtivo } from '@/hooks/useProdutos'
import { ProdutoTable, ProdutoTableSkeleton } from './components/ProdutoTable'

export function ProdutosPage() {
  const { data: produtos, isLoading, error } = useProdutos()
  const toggle = useToggleAtivo()

  if (error) {
    toast.error('Erro ao carregar produtos')
  }

  function handleToggle(id: string, valor: boolean) {
    toggle.mutate(
      { id, ativo_frontend: valor },
      { onError: () => toast.error('Erro ao atualizar produto') }
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Produtos</h2>
      {isLoading ? (
        <ProdutoTableSkeleton />
      ) : (
        <ProdutoTable produtos={produtos ?? []} onToggle={handleToggle} />
      )}
    </div>
  )
}
