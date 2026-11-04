import Link from "next/link";

export default function AcessoNegadoPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-neutral-50 px-4 text-center">
      <h1 className="text-lg font-semibold text-neutral-900">
        Acesso não autorizado
      </h1>
      <p className="max-w-sm text-sm text-neutral-500">
        Seu e-mail ainda não foi liberado para o painel. Fale com o
        responsável pelo escritório para solicitar acesso.
      </p>
      <Link
        href="/login"
        className="mt-2 text-sm font-medium text-neutral-700 underline"
      >
        Voltar ao login
      </Link>
    </div>
  );
}
