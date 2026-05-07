import { CTASection } from "@/components/landing/cta-section";
import { FAQSection } from "@/components/landing/faq-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-balance text-4xl font-semibold sm:text-5xl">
            Planos para organizar seus lotes com menos fricção.
          </h1>
          <p className="mx-auto max-w-2xl leading-7 text-muted-foreground">
            Escolha uma opção para começar a separar fotos tecnicamente
            problemáticas. Pagamento real será conectado em uma próxima etapa.
          </p>
        </section>
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}

