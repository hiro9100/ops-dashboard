# 公開のしくみ（Firebase）

利用者が「公開する」を押すと、ここに預かって配信します。
プロジェクトは `bildy-4e45e`、公開されるサイトのアドレスは
`https://bildy-4e45e.web.app/s/<サイトID>` です。

```
編集画面 ──POST /api/publish──▶ publishSite ──▶ Storage（HTML）
                                          └──▶ Firestore（合言葉のハッシュ）

  訪問者 ──GET /s/<サイトID>──▶ serveSite ──▶ Storage から読んで返す
```

## ログインを求めない

対象は「いまホームページを持っていない人」です。アカウントを1つ作らせる
だけで脱落するので、Firebase Authentication は使っていません。

持ち主の証明は**合言葉**だけで行います。合言葉は書き出したHTMLの中に
入っているので、利用者は自分が持っていることを意識しません。
別の端末でそのHTMLを開けば、そのまま同じサイトを更新できます。

- **手元にダウンロードする版** … 組み立て情報 ＋ サイトID ＋ **合言葉**
- **公開される版** … 組み立て情報 ＋ サイトID（**合言葉は入れない**）

公開ページは誰でも保存できるので、合言葉を入れたままだと拾った人が
そのサイトを上書きできてしまいます。

合言葉そのものは保存せず、ハッシュだけを Firestore に持ちます。

## 悪用への備え

他人のHTMLを自分のドメインで配るため、置きっぱなしにはできません。

| | |
| --- | --- |
| 1ページの上限 | 3 MB |
| 新規サイト | 同じ回線から1日5件まで |
| 受け付ける中身 | このツールの目印（`id="hp-builder-data"`）を含むものだけ |

Storage と Firestore は、**ブラウザからは読み書きできません**（ルールで全部拒否）。
出入りはすべて Function を通ります。

## 出す手順

3通りあります。**パソコンが無くても出せます。**

### A. GitHub の画面から（スマホでも押せる・おすすめ）

一度だけ秘密の値を入れれば、以後はボタン1つです。

**1. 鍵を作る**（Firebase コンソール）

プロジェクトの設定 → **サービス アカウント** → 「新しい秘密鍵の生成」。
JSONファイルがダウンロードされます。

**2. その鍵に、出すための権限を足す**（Google Cloud コンソール）

`console.cloud.google.com/iam-admin/iam` を開き、プロジェクトを `bildy-4e45e` に。
`firebase-adminsdk-...@bildy-4e45e.iam.gserviceaccount.com` の行を編集して、
次のロールを足します。

| ロール | 何のため |
| --- | --- |
| Firebase Admin | Hosting とルールを出す |
| Cloud Functions 管理者 | Function を出す |
| サービス アカウント ユーザー | Function を動かす役を渡す |
| Cloud Build 編集者 | Function を組み立てる |
| Artifact Registry 管理者 | 組み立てたものを置く |

**3. GitHub に入れる**

リポジトリ → Settings → Secrets and variables → Actions → New repository secret

- Name: `FIREBASE_SERVICE_ACCOUNT`
- Secret: ダウンロードしたJSONの**中身を丸ごと**貼る

**4. 走らせる**

Actions タブ → 「Firebase へ出す」 → Run workflow

以後は `hp-builder/` か `docs/` を変更して push するたびに自動で出ます。

### B. Google Cloud Shell から（ブラウザだけ・その場でできる）

`shell.cloud.google.com` を開くと、ログイン済みのターミナルがブラウザに出ます。
鍵も権限の設定も要りません。これを1回貼るだけです。
（作業中のブランチを指定しています。`main` には入っていません）

```
git clone -b claude/hp-creator-template-tool-ohuuqb \
  https://github.com/hiro9100/ops-dashboard.git && \
cd ops-dashboard/hp-builder && node build-site.js && \
cd firebase && npm --prefix functions install && \
npx --yes firebase-tools@14 deploy --project bildy-4e45e
```

### C. パソコンから

```
npm i -g firebase-tools
firebase login

cd hp-builder
node build-site.js
cd firebase
npm --prefix functions install
firebase deploy
```

どれも Hosting・Functions・Storage ルール・Firestore ルールをまとめて出します。
初回は Functions の有効化に数分かかります。

出したあとに確認するところ:

- `https://bildy-4e45e.web.app/` … サービスLP
- `https://bildy-4e45e.web.app/app/` … 編集ツール
- `https://bildy-4e45e.web.app/s/xxxx` … 公開されたページ（無ければ404の画面）

## 独自ドメインを足すとき

サイトはIDで識別しているので、**あとから足しても中身は変わりません。**

1. Firebase コンソール → Hosting → カスタムドメインを追加
2. `assets/publish-config.js` の `siteBase` を新しいドメインに変える
3. 出し直す

Firebase Hosting は 1プロジェクトあたり36サイト、独自ドメインは20前後が上限です。
それを超える規模で売るときは、この構成では足りません。

## 通信するのはここだけ

編集ツールは Firebase SDK を読み込みません。公開のときに
`fetch` を1回するだけで、それ以外は今までどおり手元で完結します。
`file://` で開いても、公開以外は全部動きます。

`assets/publish-config.js` の `endpoint` を空にすると、
「このまま公開する」は選択肢から消え、自分で置く道だけになります。
