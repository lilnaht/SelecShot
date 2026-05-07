"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  MailCheck,
} from "lucide-react";

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

type LoginFlow = "credentials" | "recovery" | "update-password";

type Notice = {
  type: "info" | "success";
  title: string;
  description: string;
};

function getRedirectUrl(path: string) {
  if (typeof window === "undefined") {
    return undefined;
  }

  return `${window.location.origin}${path}`;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeRedirectPath(searchParams.get("next"));
  const isRegister = mode === "register";
  const wantsPasswordUpdate =
    !isRegister &&
    (searchParams.get("reset") === "1" ||
      searchParams.get("type") === "recovery");
  const [loginFlow, setLoginFlow] = useState<LoginFlow>(
    wantsPasswordUpdate ? "update-password" : "credentials"
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isPending, setIsPending] = useState(false);
  const isRecoveryRequest = !isRegister && loginFlow === "recovery";
  const isPasswordUpdate = !isRegister && loginFlow === "update-password";

  const routeNotice = useMemo<Notice | null>(() => {
    if (searchParams.get("confirmed") === "1") {
      return {
        type: "success",
        title: "E-mail confirmado",
        description: "Sua conta foi confirmada. Entre para acessar o dashboard.",
      };
    }

    if (searchParams.get("reset") === "1") {
      return {
        type: "info",
        title: "Recuperação de senha",
        description: "Defina uma nova senha para concluir a recuperação.",
      };
    }

    if (searchParams.get("error") || searchParams.get("error_description")) {
      return {
        type: "info",
        title: "Link inválido ou expirado",
        description: "Solicite um novo link de acesso e tente novamente.",
      };
    }

    return null;
  }, [searchParams]);

  const activeNotice = notice ?? routeNotice;

  const copy = useMemo(() => {
    if (isPasswordUpdate) {
      return {
        title: "Defina uma nova senha",
        description: "Use uma senha segura para recuperar o acesso.",
        submit: "Salvar nova senha",
        footer: "Voltar para entrada",
        footerLink: "Entrar",
        footerHref: "/login",
      };
    }

    if (isRecoveryRequest) {
      return {
        title: "Recupere sua senha",
        description: "Enviaremos um link de recuperação para o seu e-mail.",
        submit: "Enviar link",
        footer: "Lembrou a senha?",
        footerLink: "Entrar",
        footerHref: "/login",
      };
    }

    return {
      title: isRegister ? "Crie sua conta" : "Entre no SelecShot",
      description: isRegister
        ? "Comece a organizar seus lotes de fotos."
        : "Acesse seu dashboard e acompanhe suas análises.",
      submit: isRegister ? "Criar conta" : "Entrar",
      footer: isRegister ? "Já tem conta?" : "Ainda não tem conta?",
      footerLink: isRegister ? "Entrar" : "Criar conta",
      footerHref: isRegister ? "/login" : "/register",
    };
  }, [isPasswordUpdate, isRecoveryRequest, isRegister]);

  function switchLoginFlow(flow: LoginFlow) {
    setError(null);
    setNotice(null);
    setLoginFlow(flow);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
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

    if (isPasswordUpdate) {
      if (!isValidPassword(password)) {
        setError("A senha deve ter entre 6 e 128 caracteres.");
        setIsPending(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        console.error("Supabase password update failed", updateError);
        setError("O link de recuperação expirou. Solicite um novo link.");
        setIsPending(false);
        return;
      }

      router.push(next);
      router.refresh();
      return;
    }

    if (!isValidEmail(email)) {
      setError("Informe um e-mail válido.");
      setIsPending(false);
      return;
    }

    if (isRecoveryRequest) {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: getRedirectUrl("/login?reset=1"),
        }
      );

      if (resetError) {
        console.error("Supabase password recovery failed", resetError);
        setError("Não foi possível enviar o link agora. Tente novamente.");
        setIsPending(false);
        return;
      }

      setNotice({
        type: "success",
        title: "Verifique seu e-mail",
        description:
          "Se o endereço estiver cadastrado, você receberá um link para redefinir a senha.",
      });
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
          emailRedirectTo: getRedirectUrl("/login?confirmed=1"),
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
        setNotice({
          type: "success",
          title: "Confirme seu e-mail",
          description:
            "Conta criada. Abra o link enviado para o seu e-mail antes de entrar.",
        });
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
            {!isPasswordUpdate && (
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
            )}
            {!isRecoveryRequest && (
              <Field data-invalid={Boolean(error)}>
                <FieldLabel htmlFor="password">
                  {isPasswordUpdate ? "Nova senha" : "Senha"}
                </FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={
                    isRegister || isPasswordUpdate
                      ? "new-password"
                      : "current-password"
                  }
                  placeholder="Mínimo de 6 caracteres"
                  aria-invalid={Boolean(error)}
                  minLength={6}
                  maxLength={128}
                  required
                />
                {(isRegister || isPasswordUpdate) && (
                  <FieldDescription>
                    Use uma senha segura para proteger seus lotes.
                  </FieldDescription>
                )}
                {error && <FieldError>{error}</FieldError>}
              </Field>
            )}
            {isRecoveryRequest && error && (
              <Field data-invalid>
                <FieldError>{error}</FieldError>
              </Field>
            )}
            {activeNotice && (
              <Alert>
                {activeNotice.type === "success" ? (
                  <CheckCircle2 data-icon="inline-start" />
                ) : isPasswordUpdate ? (
                  <KeyRound data-icon="inline-start" />
                ) : (
                  <MailCheck data-icon="inline-start" />
                )}
                <AlertTitle>{activeNotice.title}</AlertTitle>
                <AlertDescription>{activeNotice.description}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="brand-gradient" disabled={isPending}>
              {isPending && (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              )}
              {copy.submit}
            </Button>
            {!isRegister && loginFlow === "credentials" && (
              <button
                type="button"
                className="text-center text-sm text-sky-200 hover:text-sky-100"
                onClick={() => switchLoginFlow("recovery")}
              >
                Esqueci minha senha
              </button>
            )}
            {!isRegister && loginFlow !== "credentials" ? (
              <button
                type="button"
                className="text-center text-sm text-muted-foreground hover:text-foreground"
                onClick={() => switchLoginFlow("credentials")}
              >
                Voltar para entrada
              </button>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                {copy.footer}{" "}
                <Link
                  href={copy.footerHref}
                  className="text-sky-200 hover:text-sky-100"
                >
                  {copy.footerLink}
                </Link>
              </p>
            )}
            {error && !isRecoveryRequest && (
              <Alert variant="destructive">
                <AlertCircle data-icon="inline-start" />
                <AlertTitle>Não foi possível continuar</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
