import { PricingCard } from "@/components/landing/pricing-card";

export const plans = [
  {
    name: "Básico",
    price: "R$ 19/mês",
    description: "Para triagens menores e rotina simples.",
    features: [
      "Até 1.000 fotos/mês",
      "Separação em claras, escuras e desfocadas",
      "ZIP organizado",
      "Preview das categorias",
      "Histórico por 7 dias",
    ],
  },
  {
    name: "Pro",
    price: "R$ 49/mês",
    description: "Para eventos, esportes e grandes lotes.",
    highlighted: true,
    features: [
      "Até 10.000 fotos/mês",
      "Processamento prioritário",
      "Relatório CSV",
      "Histórico por 30 dias",
      "Presets: geral, esporte, evento e retrato",
      "Reprocessamento com sensibilidade ajustada",
    ],
  },
  {
    name: "Vitalício",
    price: "R$ 197 pagamento único",
    description: "Ideal para primeiros usuários.",
    features: [
      "Até 3.000 fotos/mês",
      "Acesso às funções principais",
      "Sem mensalidade",
      "ZIP organizado",
      "Preview das categorias",
    ],
  },
];

export function PricingSection() {
  return (
    <section id="planos" className="border-y border-white/10 bg-white/[0.018]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold sm:text-4xl">Planos simples.</h2>
          <p className="mt-3 text-muted-foreground">
            Comece com uma triagem técnica clara. Pagamentos reais ficam para a
            próxima etapa.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <PricingCard key={plan.name} {...plan} />
          ))}
        </div>
      </div>
    </section>
  );
}

