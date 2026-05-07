import {
  Archive,
  Clock3,
  Download,
  Eye,
  FileImage,
  Layers3,
  ScanLine,
  ShieldCheck,
  SlidersHorizontal,
  UploadCloud,
} from "lucide-react";

import { CTASection } from "@/components/landing/cta-section";
import { FAQSection } from "@/components/landing/faq-section";
import { FeatureCard } from "@/components/landing/feature-card";
import { HeroMockup } from "@/components/landing/hero-mockup";
import { HeroSection } from "@/components/landing/hero-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";

const problemCards = [
  {
    icon: Clock3,
    title: "Seleção manual cansativa",
    description:
      "Você não deveria perder horas separando foto escura, estourada ou tremida depois de cada evento.",
  },
  {
    icon: Layers3,
    title: "Lotes grandes de imagens",
    description:
      "Eventos, esportes e social media geram centenas de arquivos antes da primeira edição.",
  },
  {
    icon: FileImage,
    title: "Fotos ruins misturadas",
    description:
      "Imagens claras, escuras e desfocadas ficam no mesmo pacote das fotos prontas para revisar.",
  },
  {
    icon: SlidersHorizontal,
    title: "Tempo perdido antes da edição",
    description:
      "O SelecShot organiza a primeira triagem para você chegar mais rápido ao pós-evento.",
  },
];

const benefits = [
  {
    icon: Clock3,
    title: "Economize tempo na triagem",
    description: "Reduza o volume de arquivos que precisam de revisão manual.",
  },
  {
    icon: Archive,
    title: "Organize grandes lotes",
    description: "Receba categorias técnicas claras para continuar o fluxo.",
  },
  {
    icon: ShieldCheck,
    title: "Preserve os arquivos originais",
    description: "O sistema não apaga fotos originais do seu lote.",
  },
  {
    icon: Download,
    title: "ZIP pronto para baixar",
    description: "Pastas separadas em escuras, claras, desfocadas e boas.",
  },
  {
    icon: Eye,
    title: "Previews antes do download",
    description: "Veja amostras das categorias antes de baixar o pacote.",
  },
  {
    icon: ScanLine,
    title: "Melhor pós-evento",
    description: "Comece a edição com o lote tecnicamente mais organizado.",
  },
];

const steps = [
  { number: "1", title: "Envie suas fotos", icon: UploadCloud },
  { number: "2", title: "Aguarde a análise", icon: ScanLine },
  { number: "3", title: "Baixe o ZIP organizado", icon: Download },
];

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold sm:text-4xl">
              A primeira triagem não precisa travar seu fluxo.
            </h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              O SelecShot ajuda você a separar fotos tecnicamente problemáticas
              antes da seleção artística.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {problemCards.map((card) => (
              <FeatureCard key={card.title} {...card} />
            ))}
          </div>
        </section>
        <section
          id="como-funciona"
          className="border-y border-white/10 bg-white/[0.018]"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <div>
              <h2 className="text-3xl font-semibold sm:text-4xl">
                Como funciona
              </h2>
              <p className="mt-3 leading-7 text-muted-foreground">
                Um fluxo simples para transformar lotes confusos em pacotes
                organizados.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {steps.map(({ number, title, icon: Icon }) => (
                <div
                  key={title}
                  className="rounded-xl border border-white/10 bg-white/[0.035] p-5"
                >
                  <div className="mb-8 flex items-center justify-between">
                    <span className="font-mono text-sm text-muted-foreground">
                      {number}
                    </span>
                    <Icon aria-hidden="true" className="text-sky-200" />
                  </div>
                  <h3 className="font-medium">{title}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl font-semibold sm:text-4xl">
              Veja o lote antes de baixar.
            </h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              A tela de resultado mostra quantidades por categoria, previews e o
              pacote final para download.
            </p>
          </div>
          <HeroMockup />
        </section>
        <section
          id="beneficios"
          className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold sm:text-4xl">
              Feito para fotógrafos que lidam com volume.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit) => (
              <FeatureCard key={benefit.title} {...benefit} />
            ))}
          </div>
        </section>
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
