export const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0)

export const pct = (v: number, decimals = 1) =>
  `${((v ?? 0) * 100).toFixed(decimals).replace('.', ',')}%`

export const num = (v: number) =>
  new Intl.NumberFormat('pt-BR').format(Math.round(v ?? 0))

export const dias = (v: number | null) =>
  v === null ? '—' : `${v.toFixed(1).replace('.', ',')}d`

export const dt = (v: string) => {
  const d = new Date(v)
  return (
    d.toLocaleDateString('pt-BR') +
    ' ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  )
}
