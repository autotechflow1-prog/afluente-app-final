import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useGruposProdutos } from '../hooks/useConferenciaEstoque'
import { useInserirMovimentacao } from '../hooks/useMovimentacoes'
import type { GrupoProduto, VariacaoEstoque } from '@/types'

const MOTIVOS: Record<string, string[]> = {
  entrada: ['Compra', 'Devolução de cliente', 'Transferência', 'Outro'],
  saida:   ['Venda manual', 'Avaria', 'Perda', 'Transferência', 'Outro'],
  ajuste:  ['Conferência de estoque', 'Correção', 'Outro'],
}

interface MovimentacaoSheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultTipo?: 'entrada' | 'saida' | 'ajuste'
}

export function MovimentacaoSheet({ open, onOpenChange, defaultTipo = 'entrada' }: MovimentacaoSheetProps) {
  const { data: grupos = [] } = useGruposProdutos()
  const inserir = useInserirMovimentacao()

  const [tipo, setTipo] = useState<'entrada' | 'saida' | 'ajuste'>(defaultTipo)
  const [grupoSel, setGrupoSel] = useState<GrupoProduto | null>(null)
  const [variacaoSel, setVariacaoSel] = useState<VariacaoEstoque | null>(null)
  const [quantidade, setQuantidade] = useState('')
  const [motivo, setMotivo] = useState('')
  const [observacao, setObservacao] = useState('')

  useEffect(() => {
    if (open) {
      setTipo(defaultTipo)
      setGrupoSel(null)
      setVariacaoSel(null)
      setQuantidade('')
      setMotivo('')
      setObservacao('')
    }
  }, [open, defaultTipo])

  useEffect(() => {
    setMotivo('')
  }, [tipo])

  useEffect(() => {
    setVariacaoSel(null)
  }, [grupoSel])

  async function handleSalvar() {
    if (!grupoSel || !variacaoSel || !quantidade || !motivo) return
    const qtd = parseInt(quantidade, 10)
    if (isNaN(qtd) || qtd <= 0) return

    const estoqueAtual = variacaoSel.estoque_bling
    const quantidade_nova = tipo === 'entrada'
      ? estoqueAtual + qtd
      : estoqueAtual - qtd

    try {
      await inserir.mutateAsync({
        sku: variacaoSel.sku,
        produto_nome: grupoSel.nome,
        cor: grupoSel.cor,
        tamanho: variacaoSel.tamanho,
        tipo,
        quantidade: qtd,
        quantidade_anterior: estoqueAtual,
        quantidade_nova,
        motivo,
        observacao: observacao || undefined,
      })
      toast.success('Movimentação registrada')
      onOpenChange(false)
    } catch {
      toast.error('Erro ao salvar movimentação')
    }
  }

  const tipoLabel = tipo === 'entrada' ? 'Nova Entrada' : tipo === 'saida' ? 'Nova Saída' : 'Novo Ajuste'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{tipoLabel}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={v => setTipo(v as typeof tipo)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
                <SelectItem value="ajuste">Ajuste</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Produto</Label>
            <Select
              value={grupoSel?.chave ?? ''}
              onValueChange={v => setGrupoSel(grupos.find(g => g.chave === v) ?? null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o produto..." />
              </SelectTrigger>
              <SelectContent>
                {grupos.map(g => (
                  <SelectItem key={g.chave} value={g.chave}>
                    {g.nome}{g.cor ? ` · ${g.cor}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {grupoSel && (
            <div className="space-y-1">
              <Label>Tamanho</Label>
              <Select
                value={variacaoSel?.sku ?? ''}
                onValueChange={v => setVariacaoSel(grupoSel.variacoes.find(x => x.sku === v) ?? null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tamanho..." />
                </SelectTrigger>
                <SelectContent>
                  {grupoSel.variacoes.map(v => (
                    <SelectItem key={v.sku} value={v.sku}>
                      {v.tamanho} — estoque atual: {v.estoque_bling}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <Label>Quantidade</Label>
            <Input
              type="number"
              min={1}
              value={quantidade}
              onChange={e => setQuantidade(e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="space-y-1">
            <Label>Motivo</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo..." />
              </SelectTrigger>
              <SelectContent>
                {(MOTIVOS[tipo] ?? []).map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Observação <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <textarea
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              placeholder="Observações adicionais..."
            />
          </div>

          <Button
            className="w-full"
            disabled={!grupoSel || !variacaoSel || !quantidade || !motivo || inserir.isPending}
            onClick={handleSalvar}
          >
            {inserir.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
