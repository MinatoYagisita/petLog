# コードスタイルルール

> 前提: TypeScript / Next.js (App Router) / React / Prisma / pnpm

## 基本姿勢

- **「動けばよい」で終わらせない。** 読みやすく、保守しやすいコードを書く
- 3ヶ月後の自分、または別のメンバーが読んで理解できることを基準にする
- AI が生成したコードも、手書きと同じ品質基準を適用する

## 命名規則

- 変数名・関数名は camelCase（`getUserById`, `isActive`）
- 型・インターフェースは PascalCase（`User`, `CreateOrderInput`）
- 定数は UPPER_SNAKE_CASE（`MAX_RETRY_COUNT`）
- Boolean 型は `is`, `has`, `can`, `should` で始める
- 配列・リストは複数形にする（`users`, `items`）
- イベントハンドラは `handleXxx` / `onXxx`（`handleSubmit`, `onClick`）
- カスタムフックは `useXxx`（`useAuth`, `useUsers`）

```typescript
// 悪い例
const d = getData()
const flg = true
const lst: any[] = []

// 良い例
const deliveryDate = getDeliverySchedule()
const isApproved = true
const pendingOrders: Order[] = []
```

## 型安全性

- **`any` は原則禁止。** やむを得ず使う場合はコメントで理由を残す
- `as` によるキャストは最小限にする。型ガードを優先する
- API レスポンスには必ず型を定義する（`unknown` から型ガードで絞り込む）
- Prisma の生成型をそのまま使える箇所では自前の型を作らない
- `null` と `undefined` を混在させない。統一する

```typescript
// 悪い例
const data = response.json() as any
const user = data.user as User

// 良い例
const data: unknown = await response.json()
if (!isUserResponse(data)) {
  throw new Error("不正なレスポンス形式")
}
const user = data.user
```

## 関数分割

- 1つの関数は1つの責務にする
- 関数の行数は目安30行以内。超える場合は分割を検討する
- ネストが3段以上になったら、内側の処理を関数に切り出す
- 早期リターン（ガード節）を活用してネストを減らす

```typescript
// 悪い例
function process(data: Data | null) {
  if (data !== null) {
    if (data.isValid()) {
      if (data.status === "active") {
        // 本来の処理...
      }
    }
  }
}

// 良い例
function process(data: Data | null) {
  if (!data) return
  if (!data.isValid()) return
  if (data.status !== "active") return
  // 本来の処理...
}
```

## React / Next.js での責務分離

- Server Components と Client Components を意識して分ける
- `"use client"` は必要なコンポーネントにだけ付ける（安易に付けない）
- データ取得は Server Components または Route Handlers で行う
- クライアント側で直接 Prisma を呼ばない
- ビジネスロジックはコンポーネントの外に出す（`lib/` や `services/`）
- コンポーネントは表示に集中させる

```
app/
├── (routes)/         # ページ（Server Components 中心）
├── components/       # UIコンポーネント
│   ├── ui/          # 汎用（ボタン、入力など）
│   └── features/    # 機能固有
├── lib/             # ビジネスロジック・ユーティリティ
├── services/        # 外部API・DBアクセス
└── types/           # 型定義
```

## Prisma 使用時の注意

- `prisma.$queryRaw` を使う場合はパラメータバインドを必ず使う
- `select` / `include` で必要なフィールドだけ取得する（全カラム取得を避ける）
- リレーションの取得は N+1 にならないよう `include` でまとめる
- マイグレーションファイルは手動で編集しない（`prisma migrate dev` で生成）
- `prisma.user.findMany()` のような全件取得には `take` / `skip` を付ける

```typescript
// 悪い例
const users = await prisma.user.findMany()
for (const user of users) {
  const orders = await prisma.order.findMany({ where: { userId: user.id } })
}

// 良い例
const users = await prisma.user.findMany({
  take: 50,
  include: { orders: true },
})
```

## コメント方針

- コードで表現できることはコメントに書かない
- **なぜそうしたか（Why）** をコメントに書く。何をしているか（What）はコードで表現する
- TODO コメントには担当者と期限を書く: `// TODO(田中): 2024-04 までに認証方式を変更する`
- 仕様上の制約や業務ルールの背景はコメントで残す

```typescript
// 悪い例
// ユーザーを取得する
const user = await getUser(userId)

// 良い例
// 退会済みユーザーも含めて取得する（監査ログ表示のため）
const user = await getUser(userId, { includeInactive: true })
```

## 例外処理

- 例外は握りつぶさない。最低限ログに記録する
- `catch (e: unknown)` で捕捉し、`instanceof Error` で型を絞る
- ユーザー向けエラーメッセージと開発者向けログは分ける
- Next.js の `error.tsx` / `not-found.tsx` を活用する
- API Route では適切な HTTP ステータスコードを返す

```typescript
// 悪い例
try {
  await apiCall()
} catch (e) {
  // 何もしない
}

// 良い例
try {
  await apiCall()
} catch (e: unknown) {
  const message = e instanceof Error ? e.message : "不明なエラー"
  console.error("API呼び出しエラー:", message)
  throw new AppError("一時的に接続できません。しばらく後に再試行してください。")
}
```

## AI 生成コードの禁止事項

- AI が生成したコードをレビューなしでコミットしない
- AI の出力に含まれるライセンス不明のコード片をそのまま使わない
- AI が提案した外部パッケージは、必要性と安全性を確認してから `pnpm add` する
- AI が生成したテストコードも、テスト観点が正しいか人間が確認する
- AI が `any` を使ったコードを提案した場合、型を明示するよう修正する

## 守りやすくするために

- ESLint / Prettier の設定に従う
- `pnpm lint` / `pnpm format` を実行してから PR を出す
- 迷ったら「チームの既存コードに合わせる」を優先する
- ルールに書いていないことは、可読性と型安全性を優先して判断する
