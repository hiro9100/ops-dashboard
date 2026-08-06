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

## ヒーローの絵を作る

`POST /api/image` で、ヒーローの写真を作ってもらえます。

```
編集画面 ──POST /api/image──▶ generateImage ──▶ OpenAI 画像API
        ◀────── 絵 ────────┘   （鍵はここにしか無い）
```

**鍵は編集画面に置けません。** ツールを手にした人全員がその鍵を読めて、
持ち主の請求で他人が絵を作れてしまいます。だからサーバー側にだけ置きます。

```
firebase functions:secrets:set OPENAI_API_KEY
```

Secret Manager に入れるので、リポジトリにも、書き出したHTMLにも出ません。
**鍵をこのファイルや `publish-config.js` に書かないでください。**

| | |
| --- | --- |
| モデル | `gpt-image-1` |
| 枠の形 | 横長 1536×1024 ／ 正方形 1024×1024 ／ 縦長 1024×1536 |
| 1日の上限 | 同じ回線から12枚まで |
| 待ち時間 | 10〜30秒（関数の待ち時間は120秒。60秒では足りません） |

費用は「ヒーローの数」ではなく「**使う人の数 × 作り直した回数**」で効きます。
だから回線ごとの上限を必ず通します。上限に当たったら、その旨を伝えて
写真を選ぶほうへ案内します。

受け取った絵は、写真を選んだときと**まったく同じ道**を通します
（1600px・JPEG に落とす）。通さないと1ページ3MBの上限に引っかかります。

OpenAI からの返事は、そのままは返しません。エラーの本文に鍵や組織の名前が
混ざることがあるためです。記録には残し、利用者には短い言葉だけ返します。

## 悪用への備え

他人のHTMLを自分のドメインで配るため、置きっぱなしにはできません。

| | |
| --- | --- |
| 1ページの上限 | 3 MB |
| サイト全体 | 12 MB・20ページまで |
| 新規サイト | 同じ回線から1日8件、全体で1日800件まで |
| 問い合わせ | 同じ回線から1日30通、1サイトに500通まで |
| 受け付ける中身 | このツールの目印（`id="hp-builder-data"`）を含むものだけ |

Storage と Firestore は、**ブラウザからは読み書きできません**（ルールで全部拒否）。
出入りはすべて Function を通ります。

### 公開ページで動く仕掛けを、こちらのものだけに限る

いちばん重いところです。公開ページは**他人の書いたHTMLを、こちらの
ドメインで配る**もの。そこで JavaScript が動くと、同じドメインに置いて
ある編集画面の控え（合言葉を含む）が読めます。読めることは、実際に
動かして確かめました。

二重で塞いでいます。

1. **預かるとき** … このツールが入れる動きの部品（`SITE_JS`）の指紋と
   合わない `<script>`、`onclick=` などの属性、`javascript:` のリンクを断る
2. **配るとき** … その指紋だけを許す `Content-Security-Policy` を付ける。
   1つめを抜けても、ブラウザ側で動かない

指紋は組み立てのたびに `tools/runtime-hash.js` が取り直し、
`functions/runtime-hashes.json` に入ります。**これは手で書き替えないで
ください。** 中身とずれると、まともなページまで弾かれます。
`build-site.js` が毎回いちばん先に走らせるので、ふつうはずれません。

入れ替えの最中（Hosting は新しい・Functions はまだ古い、の数十秒）に
公開した人が弾かれないよう、**古い指紋も5件残します**。

### 止める（苦情・乗っ取り）

そのサイトの Firestore の `sites/<サイトID>` に `disabled: true` を足すと、
その場で止まります。ページは 410、上書きは 423、問い合わせも 410。
戻すときは `false` にするか、その欄を消します。

Firebase コンソール → Firestore → `sites` → 該当のIDを開いて、
フィールドを1つ足すだけです。**出し直しは要りません。**

### 数えた札を、置きっぱなしにしない

1日の上限を数える札は `quota/` に貯まります。1日1万人だと1年で
数百万件になり、読まないものに置き場代がかかります。札には捨てどき
（`expireAt`、3日後）を入れてあるので、**一度だけ** TTL を設定します。

Firebase コンソール → Firestore → 「有効期限」（TTL）→ ポリシーを作成

| コレクショングループ | タイムスタンプ フィールド |
| --- | --- |
| `quota` | `expireAt` |

（コマンドなら
`gcloud firestore fields ttls update expireAt --collection-group=quota --enable-ttl --project=bildy-4e45e`）

設定しなくても動きますが、置き場代が増え続けます。

### 費用の上限

Firebase は使ったぶんだけ増えます。取り違えや悪用で跳ねたときに
気づけるよう、**予算アラートを1つ置いてください。**

Google Cloud コンソール → お支払い → 予算とアラート → 予算を作成。
金額を決めて、50%・90%・100% でメールが来るようにします。
（予算は止める仕組みではなく、知らせる仕組みです）

## 設定ファイルの置き場所

`firebase.json` と `.firebaserc` は**リポジトリの直下**にあります。ここだけ
このフォルダの外です。Hosting は `firebase.json` より上のフォルダを配信できず、
配信するのは直下の `docs/` なので、設定が下の階層にあると
「`../../docs` is outside of project directory」で止まります。

ルール（`storage.rules` / `firestore.rules`）と Function の中身は
このフォルダのままで、直下の `firebase.json` から名指ししています。

どの手順も**リポジトリの直下で** `firebase deploy` を実行します。

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

| ロール | 役割ID（検索欄に貼ると早い） | 何のため |
| --- | --- | --- |
| Firebase Admin | `roles/firebase.admin` | Hosting とルールを出す |
| Cloud Functions 管理者 | `roles/cloudfunctions.admin` | Function を出す |
| サービス アカウント ユーザー | `roles/iam.serviceAccountUser` | Function を動かす役を渡す |
| Cloud Build 編集者 | `roles/cloudbuild.builds.editor` | Function を組み立てる |
| Artifact Registry 管理者 | `roles/artifactregistry.admin` | 組み立てたものを置く |
| Service Usage 管理者 | `roles/serviceusage.serviceUsageAdmin` | 初回に必要なAPIを有効化する |

最後の1つは初回だけ効きます。これが無いと、1回目のデプロイが
「APIが有効になっていない」で止まります。

秘密鍵はパスワードと同じものです。リポジトリには絶対に入れず、
GitHub の Secret 欄にだけ貼ってください。漏れたと思ったら、
Firebase コンソールの同じ画面でその鍵を削除して作り直せます。

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
cd ops-dashboard && node hp-builder/build-site.js && \
npm --prefix hp-builder/firebase/functions install && \
npx --yes firebase-tools@14 deploy --project bildy-4e45e
```

### C. パソコンから

```
npm i -g firebase-tools
firebase login

node hp-builder/build-site.js
npm --prefix hp-builder/firebase/functions install
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

## 公開ページを、別のドメインに移す（やっておきたい）

いま、編集ツール（`/app/`）と受け口（`/api/*`）と公開ページ（`/s/*`）は、
**同じ `bildy-4e45e.web.app` に居ます。** ブラウザは「同じドメインなら
同じ持ち主」として扱うので、公開ページで何か動いた瞬間に、編集画面の
控えまで届きます。

その道は上で塞ぎました（指紋の合う仕掛けしか動かない）。ただし塞ぎ方が
1つでも抜けたとき、被害が編集画面まで及ぶ形は残ります。**公開ページを
別のドメインに置けば、抜けても公開ページの中だけで終わります。**

コードは移せるようにしてあります。手順は次の4つです。

**1. 置き場をもう1つ作る**（名前は世界で1つ。数分で終わります）

```
npx --yes firebase-tools@14 hosting:sites:create bildy-4e45e-pages --project bildy-4e45e
```

**2. リポジトリ直下の `firebase.json` の `hosting` を、2つの並びにする**

```json
"hosting": [
  { "site": "bildy-4e45e", "public": "docs", "cleanUrls": true,
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "headers": [ ...いまのまま... ],
    "rewrites": [ ...いまのまま。ただし /s/** の行は消す... ] },
  { "site": "bildy-4e45e-pages", "public": "hp-builder/firebase/pages-empty",
    "rewrites": [
      { "source": "/s/**",
        "function": { "functionId": "serveSite", "region": "asia-northeast1" } }
    ] }
]
```

（`pages-empty` は空のフォルダを1つ作って `.gitkeep` を置くだけ。
この置き場は Function に渡すためだけのもので、配るファイルはありません）

**3. 行き先を、両側で揃える**

| 場所 | 値 |
| --- | --- |
| `hp-builder/firebase/functions/.env` | `HP_SITE_BASE=https://bildy-4e45e-pages.web.app/s/` |
| 同上 | `HP_API_ORIGIN=https://bildy-4e45e.web.app` |
| `hp-builder/assets/publish-config.js` | `siteBase: 'https://bildy-4e45e-pages.web.app/s/'` |

`HP_API_ORIGIN` を忘れると、公開ページの問い合わせフォームだけが動かなく
なります（別のドメインへ送ることになり、守りが止めるため）。

**4. 出し直す**

すでに公開されているページの**アドレスは変わります**。前のドメインでも
開けるようにしておきたければ、`/s/**` の行を1つめにも残してください
（守りとしては弱くなります。移す意味は、同じところに居ないことなので）。

> ここだけは、この場では動かして確かめられませんでした。置き場を作る
> のは動いているプロジェクトへの操作で、名前が取られていた場合など、
> 出し直しごと失敗させかねないためです。**いまの状態でも、上の二重の
> 塞ぎで実際の抜け道は閉じています。** これはその上に重ねる一枚です。

## 1万人規模で効いてくるところ

数が増えたときに効くのは、1回あたりの重さではなく「配る量」と
「1回ごとに読む数」です。次の4つを直してあります。

| | 前 | いま |
| --- | --- | --- |
| 編集ツールの配りかた | 1枚 837KB。出し直すたび全員が取り直す | 骨組み14KB＋指紋つきの中身。変えたものだけ取り直す |
| 問い合わせ1通あたりの読み数 | 500件（`offset` は飛ばしたぶんも読んだ数に入る） | 2件（数えるだけ） |
| 公開1回あたりの往復 | 毎回、その置き場を一覧する | 前に置いたものとの差だけ |
| 数えた札 | 貯まりっぱなし | 3日で消える（TTL） |

配る量の見当。1万人が月に2回開くと、1枚もののままなら 837KB × 2万回 =
**約16GB／月**。Hosting のただの枠は 10GB／月なので、それだけで足が出ます。
分けたあとは、2回目からは骨組みの 14KB だけ（中身は1年そのまま使ってよい、
と伝えてあるため）。**出し直した日でも、変えたファイルのぶんだけ**です。

指紋つきの名前（`a/app.1a2b3c4d.js`）は、中身が変われば名前も変わります。
だから「ずっと使ってよい」と言い切れて、かつ古いものが残りません。

`firebase.json` の見出しで、そこを伝えています。

| 場所 | 持たせかた |
| --- | --- |
| `/app/a/**` | `max-age=31536000, immutable`（1年） |
| `/app/**/*.html` | `no-cache`（毎回聞きにいく。骨組みは小さい） |
| `/art/**` | `max-age=2592000`（30日。**写真を差し替えるときは名前も変える**） |
| `/s/**` | `max-age=60`（直したものが1分で出る） |

手元に落として使う1枚ものは `app/offline.html` に残してあります。
`file://` で開いても全部動く、という道は無くしていません。

## 通信するのはここだけ

編集ツールは Firebase SDK を読み込みません。公開のときに
`fetch` を1回するだけで、それ以外は今までどおり手元で完結します。
`file://` で開いても、公開以外は全部動きます。

`assets/publish-config.js` の `endpoint` を空にすると、
「このまま公開する」は選択肢から消え、自分で置く道だけになります。
