"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";

type Mode = "login" | "signup";

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      router.replace("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "エラーが発生しました";
      if (message.includes("user-not-found") || message.includes("wrong-password") || message.includes("invalid-credential")) {
        toast.error("メールアドレスまたはパスワードが違います");
      } else if (message.includes("email-already-in-use")) {
        toast.error("このメールアドレスは既に使われています");
      } else {
        toast.error("ログインできませんでした。しばらく後に再試行してください");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[480px]">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐾</div>
          <h1 className="text-2xl font-bold text-text-primary">ペットお薬手帳</h1>
          <p className="text-sm text-text-secondary mt-1">投薬・健康管理アプリ</p>
        </div>

        <div className="bg-surface rounded-[12px] shadow-sm border border-border p-6">
          <div className="flex rounded-xl bg-app-bg p-1 mb-6">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                mode === "login"
                  ? "bg-surface shadow-sm text-text-primary"
                  : "text-text-secondary"
              }`}
            >
              ログイン
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                mode === "signup"
                  ? "bg-surface shadow-sm text-text-primary"
                  : "text-text-secondary"
              }`}
            >
              新規登録
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="メールアドレス"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              autoComplete="email"
            />
            <Input
              label="パスワード"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6文字以上"
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              hint={mode === "signup" ? "6文字以上で入力してください" : undefined}
            />
            <Button type="submit" loading={loading} fullWidth size="lg" className="mt-2">
              {mode === "login" ? "ログイン" : "アカウント作成"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
