import { UploadDropzone } from "@/components/dashboard/upload-dropzone";

export default function NewAnalysisPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">Nova análise</h1>
        <p className="mt-2 text-muted-foreground">
          Envie múltiplas imagens para análise de brilho, exposição e nitidez.
        </p>
      </div>
      <UploadDropzone />
    </div>
  );
}
