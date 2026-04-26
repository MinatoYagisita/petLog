"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import toast from "react-hot-toast";

type Mode = "login" | "signup";
type UserType = "owner" | "place";
type PlaceType = "hospital" | "salon";

const ADMIN_EMAIL = "minato.yagishita@gmail.com";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [userType, setUserType] = useState<UserType>("owner");
  const [placeType, setPlaceType] = useState<PlaceType>("hospital");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function afterLogin(token: string, emailAddr: string) {
    if (emailAddr === ADMIN_EMAIL) {
      router.replace("/admin");
      return;
    }
    try {
      const res = await fetch("/api/place-accounts/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        router.replace("/place-dashboard");
        return;
      }
    } catch {
      // not a place account
    }
    router.replace("/dashboard");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const token = await cred.user.getIdToken();
        await afterLogin(token, cred.user.email ?? "");
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const token = await cred.user.getIdToken();
        if (userType === "place") {
          const res = await fetch("/api/place-accounts", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ accountType: placeType }),
          });
          if (!res.ok) {
            toast.error("施設アカウントの作成に失敗しました");
            setLoading(false);
            return;
          }
          router.replace("/place-dashboard");
        } else {
          router.replace("/dashboard");
        }
      }
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
                mode === "login" ? "bg-surface shadow-sm text-text-primary" : "text-text-secondary"
              }`}
            >
              ログイン
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                mode === "signup" ? "bg-surface shadow-sm text-text-primary" : "text-text-secondary"
              }`}
            >
              新規登録
            </button>
          </div>

          {mode === "signup" && (
            <div className="mb-5">
              <p className="text-sm font-medium text-text-primary mb-2">アカウント種別</p>
              <div className="flex rounded-xl border border-border overflow-hidden mb-3">
                <button
                  type="button"
                  onClick={() => setUserType("owner")}
                  className={`flex-1 py-2.5 text-sm transition-colors ${
                    userType === "owner"
                      ? "bg-primary text-text-primary font-semibold"
                      : "bg-surface text-text-secondary"
                  }`}
                >
                  🐾 飼い主
                </button>
                <button
                  type="button"
                  onClick={() => setUserType("place")}
                  className={`flex-1 py-2.5 text-sm transition-colors ${
                    userType === "place"
                      ? "bg-primary text-text-primary font-semibold"
                      : "bg-surface text-text-secondary"
                  }`}
                >
                  🏥 病院・サロン
                </button>
              </div>
              {userType === "place" && (
                <div className="flex rounded-xl border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setPlaceType("hospital")}
                    className={`flex-1 py-2.5 text-sm transition-colors ${
                      placeType === "hospital"
                        ? "bg-accent text-text-primary font-semibold"
                        : "bg-surface text-text-secondary"
                    }`}
                  >
                    動物病院
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlaceType("salon")}
                    className={`flex-1 py-2.5 text-sm transition-colors ${
                      placeType === "salon"
                        ? "bg-accent text-text-primary font-semibold"
                        : "bg-surface text-text-secondary"
                    }`}
                  >
                    トリミングサロン
                  </button>
                </div>
              )}
            </div>
          )}

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
