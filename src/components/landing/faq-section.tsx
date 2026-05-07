import { Separator } from "@/components/ui/separator";

const faqs = [
  {
    question: "O sistema apaga minhas fotos?",
    answer:
      "Não. O SelecShot preserva os arquivos originais e organiza cópias analisadas em um pacote ZIP.",
  },
  {
    question: "Ele escolhe minhas melhores fotos?",
    answer:
      "Não exatamente. O foco é separar fotos tecnicamente problemáticas, como imagens escuras, claras ou desfocadas. A escolha artística continua sendo sua.",
  },
  {
    question: "Preciso instalar algo?",
    answer: "Não. O envio e acompanhamento são feitos pelo navegador.",
  },
  {
    question: "Posso usar com fotos de eventos?",
    answer:
      "Sim. O produto foi pensado para lotes grandes de fotografia, como eventos, esportes e ensaios.",
  },
];

export function FAQSection() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-20 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-semibold sm:text-4xl">Perguntas comuns</h2>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.025]">
        {faqs.map((faq, index) => (
          <div key={faq.question}>
            <div className="grid gap-2 p-5 sm:grid-cols-[0.85fr_1.15fr]">
              <h3 className="font-medium">{faq.question}</h3>
              <p className="text-sm leading-6 text-muted-foreground">
                {faq.answer}
              </p>
            </div>
            {index < faqs.length - 1 && <Separator />}
          </div>
        ))}
      </div>
    </section>
  );
}

