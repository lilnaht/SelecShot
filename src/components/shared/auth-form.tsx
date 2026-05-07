"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  isValidEmail,
  isValidPassword,
  normalizeEmailInput,
  sanitizeDisplayName,
  sanitizeRedirectPath,
} from "@/lib/security";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeRedirectPath(searchParams.get("next"));
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const isRegister = mode === "register";

  const copy = useMemo(
    () => ({
      title: isRegister ? "Crie sua conta" : "Entre no SelecShot",
      description: isRegister
        ? "Comece a organizar seus lotes de fotos."
        : "Acesse seu dashboard e acompanhe suas análises.",
      submit: isRegister ? "Criar conta" : "Entrar",
      footer: isRegister ? "Já tem conta?" : "Ainda não tem conta?",
      footerLink: isRegister ? "Entrar" : "Criar conta",
      footerHref: isRegister ? "/login" : "/register",
    }),
    [isRegister]
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setIsPending(true);

    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setError(
        "Supabase não está configurado. Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
      setIsPending(false);
      return;
    }

    const form = new FormData(event.currentTarget);
    const email = normalizeEmailInput(String(form.get("email") ?? ""));
    const password = String(form.get("password") ?? "");
    const fullName = sanitizeDisplayName(String(form.get("full_name") ?? ""));

    if (!isValidEmail(email)) {
      setError("Informe um e-mail válido.");
      setIsPending(false);
      return;
    }

    if (!isValidPassword(password)) {
      setError("A senha deve ter entre 6 e 128 caracteres.");
      setIsPending(false);
      return;
    }

    if (isRegister && !fullName) {
      setError("Informe seu nome.");
      setIsPending(false);
      return;
    }

    if (isRegister) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        console.error("Supabase sign up failed", signUpError);
        setError("Não foi possível criar a conta com esses dados.");
        setIsPending(false);
        return;
      }

      if (data.user && data.session) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          email,
          full_name: fullName,
        });
      }

      if (!data.session) {
        setInfo("Conta criada. Confirme seu e-mail para entrar.");
        setIsPending(false);
        return;
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error("Supabase sign in failed", signInError);
        setError("E-mail ou senha inválidos.");
        setIsPending(false);
        return;
      }
    }

    router.push(next);
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md border-white/10 bg-white/[0.035]">
      <CardHeader>
        <CardTitle className="text-2xl">{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit}>
          <FieldGroup>
            {isRegister && (
              <Field>
                <FieldLabel htmlFor="full_name">Nome</FieldLabel>
                <Input
                  id="full_name"
                  name="full_name"
                  autoComplete="name"
                  placeholder="Seu nome"
                  maxLength={120}
                  required
                />
              </Field>
            )}
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="voce@email.com"
                aria-invalid={Boolean(error)}
                maxLength={254}
                required
              />
            </Field>
            <Field data-invalid={Boolean(error)}>
              <FieldLabel htmlFor="password">Senha</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                placeholder="Mínimo de 6 caracteres"
                aria-invalid={Boolean(error)}
                minLength={6}
                maxLength={128}
                required
              />
              {isRegister && (
                <FieldDescription>
                  Use uma senha segura para proteger seus lotes.
                </FieldDescription>
              )}
              {error && <FieldError>{error}</FieldError>}
            </Field>
            {info && (
              <Alert>
                <AlertCircle data-icon="inline-start" />
                <AlertTitle>Verifique seu e-mail</AlertTitle>
                <AlertDescription>{info}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="brand-gradient" disabled={isPending}>
              {isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
              {copy.submit}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {copy.footer}{" "}
              <Link href={copy.footerHref} className="text-sky-200 hover:text-sky-100">
                {copy.footerLink}
              </Link>
            </p>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
