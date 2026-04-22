# Claude Code 運用方針

## 基本方針

- このリポジトリでは Claude Code を「若手メンバーの自走支援ツール」として活用する
- PM は最終責任者・レビュー担当・判断者であり、Claude Code は PM レビューを補助する
- **品質責任は最終的に人間が持つ。AI 出力をそのまま納品物にしない**

## 標準技術スタック

| 領域             | 技術                 |
| ---------------- | -------------------- |
| 言語             | TypeScript           |
| ランタイム       | Node.js              |
| パッケージ管理   | **pnpm**             |
| アプリ基盤       | Next.js (App Router) |
| UI               | React + Tailwind CSS |
| DB               | firebase             |
| ORM              | Prisma               |
| 認証             | firebase             |
| 単体・結合テスト | Vitest               |
| E2E・受入テスト  | Playwright           |
| デプロイ         | Vercel               |

案件によって例外はあり得るが、**標準はこの構成**として扱う。

## ルールと Skills の使い分け

| 種別   | 場所              | 用途                                                           |
| ------ | ----------------- | -------------------------------------------------------------- |
| Rules  | `.claude/rules/`  | 常時守るべきルール。コード生成・レビュー時に常に適用           |
| Skills | `.claude/skills/` | 必要なときだけ呼び出す手順書。テスト設計・セキュリティ確認など |

## 詳細ルール参照先

- コードスタイル: `.claude/rules/code-style.md`
- テスト方針: `.claude/rules/testing.md`
- セキュリティ: `.claude/rules/security.md`
- UI/UX: `.claude/rules/ui.md`
- 要件定義: `.claude/rules/requirements.md`
- デザイン: `.claude/rules/design.md`

## 運用上の注意

- Skills は目的に合ったものだけ使う。全部毎回実行する必要はない
- 外部 Skills の採用は PM 承認が必要（`docs/skills/adoption-policy.md` 参照）
- 承認済み Skills 一覧は `docs/skills/approved-skills-register.md` で管理する
- 顧客の機密データを AI に直接入力しない（`.claude/rules/security.md` 参照）
- 曖昧な仕様を AI に勝手に埋めさせない。確認事項として切り出す
