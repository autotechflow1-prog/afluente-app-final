export const CANAIS: Record<number, { nome: string; cor: string; marketplaceId: string | null }> = {
  0: {
    nome: 'Venda Direta',
    cor: '#6B7280',
    marketplaceId: null,
  },
  1759519: {
    nome: 'Shopee',
    cor: '#EE4D2D',
    marketplaceId: 'f1f12da2-4e28-469f-8a6e-af3402124b6c',
  },
  1775320: {
    nome: 'Mercado Livre',
    cor: '#FFE600',
    marketplaceId: '24cbe02e-ba75-4ca9-a4fd-c7fab63a351e',
  },
  1788181: {
    nome: 'Mercos',
    cor: '#6B7280',
    marketplaceId: 'e498d8ee-0ac2-4a8d-a614-75b7d137dde3',
  },
  2456400: {
    nome: 'Loja Integrada',
    cor: '#8B5CF6',
    marketplaceId: '685521c3-a824-4386-95a6-ec17921fc31d',
  },
  2577541: {
    nome: 'TikTok Shop',
    cor: '#69C9D0',
    marketplaceId: '2fabd699-0890-45c3-9e9c-91addf123d1d',
  },
}

export function getCanalInfo(unidadeNegocioId: number) {
  return CANAIS[unidadeNegocioId] ?? { nome: `Canal ${unidadeNegocioId}`, cor: '#9CA3AF', marketplaceId: null }
}
