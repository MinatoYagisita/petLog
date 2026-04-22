# Claude Code 品質共通基盤 ガイド

## 概要

このプロジェクトでは、Claude Code を「若手メンバーの自走支援ツール」として活用します。
品質共通基盤は、テスト・レビュー・セキュリティの品質を個人依存にせず、チームで一定水準を保つための仕組みです。

## 標準技術スタック

この品質基盤は以下の標準スタックを前提としています。rules / skills の内容はこの前提に沿って記述されています。

| 領域 | 技術 |
|------|------|
| 言語 | TypeScript |
| パッケージ管理 | pnpm |
| アプリ基盤 | Next.js (App Router) |
| UI | React + Tailwind CSS |
| DB | PostgreSQL |
| ORM | Prisma |
| 認証 | Auth.js |
| 単体・結合テスト | Vitest |
| E2E・受入テスト | Playwright |
| デプロイ | Vercel |

## CLAUDE.md / Rules / Skills の役割

| 種別 | 場所 | 役割 | 読むタイミング |
|------|------|------|---------------|
| **CLAUDE.md** | `.claude/CLAUDE.md` | 全体方針・最重要ルール・参照先 | 常時（自動読込） |
| **Rules** | `.claude/rules/*.md` | 常時守るべきルール | 常時（自動適用） |
| **Skills** | `.claude/skills/*/SKILL.md` | 必要なときだけ呼び出す手順書 | 必要時のみ |

### 使い分けの原則

- **CLAUDE.md** には全体方針だけ書く。詳細はここに書かない
- **Rules** はコーディング・テスト・セキュリティ・UI のルール。常に守る
- **Skills** は特定の作業を行うときに呼び出す手順書。毎回使う必要はない

## 利用可能な Skills 一覧

| Skill | 用途 | 使うタイミング |
|-------|------|---------------|
| `test-spec-creator` | 仕様書からテストケースを作成 | 新規機能・改修のテスト設計時 |
| `test-executor` | テスト実施と証跡整理 | テスト実施時 |
| `boundary-and-validation-test` | 境界値・バリデーションテスト設計 | フォーム・入力系のテスト設計時 |
| `acceptance-test-support` | 受入テスト観点整理・指摘票管理 | 受入テスト前後 |
| `security-check` | セキュリティチェック | 納品前・外部依存追加時 |
| `code-review` | コードレビュー補助 | PR レビュー時 |
| `design-guidelines` | UI/UX 品質チェック | 画面設計・レビュー時 |

## 開発フェーズと Skills の対応

```
要件定義 → 設計 → 実装 → テスト → レビュー → 受入テスト → 納品
                      │        │        │           │          │
                      │   test-spec-creator    │           │          │
                      │   boundary-and-        │           │          │
                      │   validation-test      │           │          │
                      │        │        │           │          │
                      │   test-executor │           │          │
                      │        │        │           │          │
               design-guidelines │   code-review    │          │
                                 │        │    acceptance-     │
                                 │        │    test-support    │
                                 │        │           │   security-check
```

## 運用方針

### 若手主体・PM レビュー前提

- 若手メンバーが Skills を使って作業し、成果物を作成する
- PM は成果物をレビューし、品質を最終確認する
- **AI の出力は PM レビューの材料であり、最終成果物ではない**

### 品質責任

- AI は作業の補助ツールである
- 品質の最終責任は人間（PM およびチームメンバー）が持つ
- 「AI がOKと言ったから大丈夫」は通用しない

### 段階的な導入

- 最初からすべての Skills を使う必要はない
- まずは `test-spec-creator` と `code-review` から始めることを推奨
- 運用に慣れてから他の Skills を追加していく

## Hooks / Orchestration について

現時点では Hooks（特定イベントに応じた自動実行）や Orchestration（Skills の連鎖実行）は導入していません。

### 理由

- 初期段階では仕組みをシンプルに保つことを優先する
- まず個々の Skills を手動で使い、運用知見を貯める
- 自動化は「何を自動化すべきか」が明確になってから導入する

### 将来の拡張候補

- コミット時に `code-review` を自動実行する Hook
- テスト設計 → テスト実施 → レポート作成の Orchestration
- PR 作成時に `security-check` を自動実行する Hook

これらは運用実績を踏まえて、必要性が確認できた段階で導入を検討します。

## 標準技術スタックとの関係

- rules は TypeScript / Next.js / Prisma / Tailwind / Auth.js 前提の実務ルール
- skills も同スタック前提の手順書。一般論ではなく「この構成でどう作るか」に落とし込んでいる
- テスト関連 skills は Vitest（ロジック）と Playwright（E2E）の使い分けを前提としている
- パッケージ管理は npm ではなく **pnpm** を前提としている
- 案件によって例外はあり得るが、標準はこの構成として扱う
