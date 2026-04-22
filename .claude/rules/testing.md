# テストルール

> 前提: Vitest（単体・結合）/ Playwright（E2E・受入）/ pnpm

## 基本姿勢

- テストは「動作確認」ではなく「仕様確認の証拠」である
- テストケースは仕様書から起こす。思いつきで書かない
- テスト結果は PM レビューの材料になる。第三者が読んで分かる形式で残す

## Vitest と Playwright の役割分担

| 種別 | ツール | 対象 | 実行速度 |
|------|--------|------|---------|
| 単体テスト | Vitest | 関数・ユーティリティ・ロジック | 速い |
| 結合テスト | Vitest | API Route・Service層・DB連携 | 中程度 |
| コンポーネントテスト | Vitest + Testing Library | React コンポーネント | 中程度 |
| E2Eテスト | Playwright | 画面操作・ブラウザ上の動作 | 遅い |
| 受入テスト | Playwright | 業務フロー全体・画面遷移 | 遅い |

### 使い分けの原則

- ロジックのテストは Vitest で書く（速く回せる）
- 画面操作・遷移・ユーザー体験のテストは Playwright で書く
- 「Vitest で書けるものは Vitest」が基本。Playwright は統合的な確認に使う
- Prisma を使う結合テストはテスト用 DB に接続する

```typescript
// Vitest: ロジックのテスト
import { describe, it, expect } from "vitest"
import { validateEmail } from "@/lib/validation"

describe("validateEmail", () => {
  it("有効なメールアドレスを受け入れる", () => {
    expect(validateEmail("user@example.com")).toBe(true)
  })
  it("不正な形式を拒否する", () => {
    expect(validateEmail("invalid")).toBe(false)
  })
})
```

```typescript
// Playwright: E2Eテスト
import { test, expect } from "@playwright/test"

test("ユーザー登録フロー", async ({ page }) => {
  await page.goto("/register")
  await page.fill('[name="email"]', "test@example.com")
  await page.fill('[name="password"]', "Passw0rd!")
  await page.click('button[type="submit"]')
  await expect(page.locator(".success-message")).toBeVisible()
})
```

## テスト観点の分類

すべての機能について、以下の観点を漏れなく検討する。

| 観点 | 内容 | 例 |
|------|------|-----|
| 正常系 | 仕様通りの入力で期待通り動作するか | 有効なメールアドレスで登録できる |
| 異常系 | 不正な入力やエラー条件で適切に処理されるか | 存在しない ID を指定したときにエラーが返る |
| 境界値 | 上限・下限・ちょうどの値で正しく動くか | 文字数上限ちょうど / 上限+1 |
| 権限 | 操作権限がない場合に適切に制御されるか | 一般ユーザーが管理画面にアクセスできない |
| 重複 | 重複データの登録・処理が正しく扱われるか | 同一メールアドレスでの二重登録 |
| 画面遷移 | 操作後に正しい画面に遷移するか | 保存後に一覧画面に戻る |

## 仕様書からテスト観点を起こす方針

1. 仕様書の各項目を読み、入力・処理・出力を整理する
2. 上記6観点に沿ってテストケースを洗い出す
3. 各ケースを Vitest 向き / Playwright 向きに振り分ける
4. 仕様に書かれていない曖昧な部分は「確認事項」として切り出す（勝手に解釈しない）
5. テストケース一覧を作成し、PM に確認を依頼する

## テスト実行コマンド

```bash
# 単体・結合テスト
pnpm test              # Vitest 全体実行
pnpm test:watch        # Vitest ウォッチモード
pnpm test -- path/to/file  # 特定ファイル

# E2Eテスト
pnpm test:e2e          # Playwright 全体実行
pnpm test:e2e -- --ui  # Playwright UIモード
```

## テスト証跡の残し方

テスト証跡は以下を含めること。

- **テストケース ID**: TC-001 など一意の番号
- **テスト観点**: どの観点のテストか
- **テスト種別**: Vitest / Playwright
- **前提条件**: テスト実施前に必要な状態
- **操作手順**: 誰がやっても同じ操作ができる粒度で書く
- **期待結果**: 仕様に基づく期待値
- **実施結果**: OK / NG
- **実施日・実施者**
- **エビデンス**: スクリーンショット、テスト実行ログ、Playwright トレースなど

## 再現手順の書き方（不具合報告時）

```
## 不具合報告
- 対象機能: ユーザー登録画面
- 発生環境: Vercel Preview / Chrome 120
- 再現手順:
  1. /register にアクセスする
  2. メールアドレスに "test@example" を入力する
  3. 「登録」ボタンを押す
- 期待結果: バリデーションエラーが表示される
- 実際の結果: 500エラーが発生する（Next.js error.tsx が表示）
- 再現率: 毎回
- エビデンス: [Playwright トレース / スクリーンショット添付]
```

## PM レビュー前提のルール

- テストケース一覧は実施前に PM に確認を依頼する
- NG が出た場合、修正後に再テストし、再テスト結果も記録する
- 全テスト完了後、テスト結果サマリを作成して PM に報告する
- テストを「やった」だけでなく「何を確認したか」が伝わる記録にする
- Vitest / Playwright のテスト実行結果（CI ログ）もエビデンスとして保存する
