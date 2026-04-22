# セキュリティルール

> 前提: Next.js / Auth.js / Prisma / PostgreSQL / Vercel / pnpm

## 基本姿勢

- セキュリティはアプリケーションだけでなく、**開発基盤・AI ツール利用も対象**
- 「開発中だから大丈夫」という考え方をしない
- 迷ったら安全側に倒す。判断できない場合は PM に相談する

## 顧客データの取り扱い

### 絶対に守ること

- 顧客の機密データ（個人情報、認証情報、決済情報など）を AI に直接入力しない
- Claude Code のプロンプトにも、チャットにも、ファイルとしても渡さない
- ログや証跡に顧客の実データを含めない

### ダミーデータ・マスキング

- テスト・開発にはダミーデータを使う
- Prisma の seed スクリプト（`prisma/seed.ts`）でダミーデータを管理する
- ダミーデータは現実的だが特定個人を指さないものにする
- やむを得ず実データを参照する場合は以下を守る:
  - PM の承認を得る
  - マスキング処理を行う（氏名→イニシャル、メール→ドメインのみ等）
  - 作業後にローカルのデータを削除する

## AI ツール利用時のセキュリティ

- API キー、パスワード、トークンをコードにハードコードしない
- `.env` / `.env.local` ファイルは `.gitignore` に含める
- AI に渡すコンテキストに秘密情報が含まれていないか確認する
- AI が提案したコードにハードコードされた秘密情報がないか確認する
- **AI ツールに機密情報をそもそも入力しない**のが基本。事後のログ確認に頼らない

## Auth.js 前提の認証・認可

- 認証は Auth.js の仕組みに乗る。独自の認証処理を自作しない
- セッション管理は Auth.js に任せ、`getServerSession()` で取得する
- API Route / Server Actions では必ずセッション確認を行う
- ロールベースの認可チェックは middleware または各ハンドラで行う
- CSRF: Auth.js は Cookie ベースセッションの場合に内蔵 CSRF 保護を提供する。**Bearer トークンのみの API は対象外だが、その場合は理由を記録する**

```typescript
// API Route でのセッション確認例
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return Response.json({ error: "認証が必要です" }, { status: 401 })
  }
  // ...
}
```

## Prisma / PostgreSQL 利用時の注意

- `prisma.$queryRaw` 使用時は必ず `Prisma.sql` テンプレートリテラルでパラメータバインドする
- 文字列結合で SQL を組み立てない
- `prisma.$executeRawUnsafe` は原則使用禁止。使う場合は PM 承認 + コメントで理由を残す
- DB 接続文字列（`DATABASE_URL`）は `.env` で管理し、コードにハードコードしない
- マイグレーションは `prisma migrate dev` / `prisma migrate deploy` を使う

```typescript
// 悪い例
const users = await prisma.$queryRawUnsafe(`SELECT * FROM "User" WHERE name = '${name}'`)

// 良い例
const users = await prisma.$queryRaw`SELECT * FROM "User" WHERE name = ${name}`
```

## .env と秘密情報の扱い

- `.env`, `.env.local`, `.env.production` は `.gitignore` に含める
- 環境変数は `NEXT_PUBLIC_` プレフィックス付きのもの以外をクライアントに露出させない
- Vercel の Environment Variables 設定で本番の秘密情報を管理する
- ローカル開発用の `.env.local` には本番の値を入れない

## 外部Git由来資産の取り扱い

外部Gitリポジトリ上の Skills / rules / スクリプト等は、**セキュリティ確認と PM 承認を前提に利用可能**とする。
ただし「便利そう」「人気がある」だけでは採用しない。

### 基本方針

- 外部Git由来の資産は「アプリの外側のリスク」として扱う
- **情報漏洩リスクが少しでも疑われる場合は採用しない**
- 判断に迷う場合は不採用を基本とする
- 導入の優先順位: 自社向け再構成 > 限定採用 > 正式採用
- **commit hash / tag を固定して評価する。main / master のような可変参照で本番導入しない**

### 導入区分

| 区分 | 内容 | PM承認 |
|------|------|--------|
| 参考利用 | 考え方だけ取り込む。コードは使わない | 不要 |
| 部分採用 | 一部の記述・観点を自社 skills/rules に組み込む | 必要 |
| 限定導入 | 特定案件または検証環境のみで使う | 必要 |
| 正式採用 | 承認済み資産として継続利用する | 必要 |

### 即時不採用の基準

以下のいずれかに該当する場合は **採用しない**。

- 業務上不要な外部送信処理がある（telemetry・analytics 含む）
- 環境変数・認証情報・ローカルファイルの取得範囲が広すぎる
- 実行内容が明確に説明できない
- 難読化・圧縮されたコードが含まれる
- `npx` やスクリプト実行の安全性が確認できない
- 依存関係が追い切れない
- OS情報 / ユーザー名 / ホスト名 / shell history / git config 等を収集している
- 追加ダウンロードや自己更新の仕組みがある

詳細は `docs/skills/adoption-policy.md` および `docs/skills/external-skills-evaluation-checklist.md` を参照。

## サプライチェーン攻撃への対策

npm パッケージのメンテナーアカウント乗っ取りにより、正規パッケージにマルウェアが混入される事例がある（2026年3月 axios 事例等）。以下を徹底すること。

### lockfile の厳格運用

- **本番・CI では `pnpm install --frozen-lockfile` を必須とする**（lockfile と一致しないインストールを拒否）
- lockfile の変更がある PR は、**変更差分を必ずレビュー**する
- `pnpm install` を気軽に実行しない。依存追加時は `pnpm add パッケージ名` で明示的に追加する

### バージョン固定

- `package.json` のバージョン指定は `^`（キャレット）ではなく**完全固定**を推奨する
- `pnpm add --save-exact パッケージ名` で固定バージョンでインストールする
- 依存の自動更新は使わない。更新は手動で行い、変更内容を確認する

### postinstall スクリプトの制御

- `pnpm` の `onlyBuiltDependencies` でビルドスクリプトの実行を許可するパッケージを明示する
- 新しいパッケージ追加時に `postinstall` / `preinstall` / `prepare` が含まれていないか確認する
- `pnpm install --ignore-scripts` で一旦インストールし、スクリプトの中身を確認してから許可する方法もある

### 推移的依存の確認

- 直接使っていないパッケージも推移的依存として含まれる可能性がある
- `pnpm why パッケージ名` で依存経路を確認する
- `pnpm audit` で既知の脆弱性を定期的にチェックする（ただし未知の攻撃は検出できない）

### 侵害が疑われる場合

- 該当パッケージをインストールした環境は**侵害済み**として扱う
- 追加のインストール実行を行わない（マルウェア再実行のリスク）
- 全認証情報（API キー、トークン、パスワード等）をローテーションする
- PM に即時報告する

## npx / 外部スクリプト実行時の注意

- `npx` で実行するパッケージは、事前にパッケージ名と内容を確認する
- typosquatting（名前が似た悪意あるパッケージ）に注意する
- 初回実行時は `--yes` を付けず、確認プロンプトを読む
- 不明なスクリプトの実行前に PM に相談する
- `postinstall` / `preinstall` / `prepare` スクリプトの中身を必ず確認する
- 出所不明のスクリプトを `curl | bash` 等で実行しない

## アプリケーションセキュリティ基本

- 入力値は必ずサーバーサイドでバリデーションする（クライアントの Zod だけで済ませない）
- Prisma のパラメータバインドを使う（文字列結合で SQL を組み立てない）
- React は JSX でデフォルトエスケープされるが、`dangerouslySetInnerHTML` は使わない
- CSRF: Auth.js のセッション Cookie 保護に乗る。該当しない構成の場合は理由を記録する
- 認証・認可は Auth.js の仕組みを使う
- エラーメッセージにスタックトレースや内部情報を含めない（Next.js の `error.tsx` で制御）

## リポジトリ・権限管理

- リポジトリは private 設定を基本とする
- 不要になったアクセス権限は速やかに削除する
- ローカルに残った機密ファイルは作業完了後に削除する
- `.gitignore` に `.env*`, `node_modules`, `.next`, `prisma/*.db` を含める
