# 🎯 SheetSniper for Amazon

2026年 Amazon US FBA最新手数料（Inbound Placement Fee / Low-Inventory Fee / 燃料サーチャージ3.5%）完全準拠の利益計算 ＆ Googleスプレッドシート1クリック自動同期 Chrome拡張機能（Manifest V3）。

---

## 🚀 特徴と設計仕様

1. **2026年 最新FBA手数料エンジン (`engine/fba-calculator.js`)**
   - Small Standard（2oz刻み $3.32〜$3.97）/ Large Standard（$3.99〜$6.50、3lb超は $6.97 + $0.08/4oz）。
   - 2026年4月以降の**燃料サーチャージ（+3.5%）**を反映。
   - 2026年最大の隠れコスト **Inbound Placement Fee**（デフォルト Minimal Split 有料 $0.21〜$0.38+）を正確に試算。Optimizedモード（$0）へのトグル可能。
   - **Low-Inventory Fee（+$0.32）** のトグルチェックボックス。
   - 容積重量（Dim Divisor = 139）と実重量の大きい方を自動適用。

2. **堅牢な Amazon DOM 抽出パイプライン (`content/extractor.js`)**
   - ASIN: URLパス (`/dp/B0...`, `/gp/product/B0...`), `?asin=`, hidden `#ASIN`, `[data-asin]` 多重フォールバック。
   - 価格: 取り消し線（List Price: `.a-text-price`, `.a-text-strike`）を厳格に除外し、BuyBox通常価格（`data-a-color="base"`）を優先取得。
   - 寸法・重量: 商品寸法（Item Dims）ではなく、FBA手数料計算で採用される**梱包寸法（Package Dimensions）および出荷重量（Shipping Weight）を最優先**で取得。
   - 欠測時は安易なデフォルト値で利益を偽装せず、`null` を維持して手動入力を促す。

3. **Shadow DOM フローティングパネル (`content/panel.js`)**
   - AmazonのReact/DOM再描画による破綻を防ぐため、`document.body` 直下に `#sheetsniper-host`（Shadow DOM）をマウント。
   - ドラッグ移動可能、ワンクリック最小化（44pxアイコン）。
   - 仕入れ価格（Buy Cost）にオートフォーカス。価格変更時にリアルタイムで利益・ROI・損益分岐点（Break-Even）・手数料内訳を更新。
   - 600msの軽量ASIN監視により、バリエーション選択（Twister）時もBuy Costの入力を保持したまま追従。

4. **安全な Google OAuth ＆ 1クリック シート自動生成 (`background/service-worker.js`)**
   - **`https://www.googleapis.com/auth/drive.file` スコープを採用**（全スプレッドシート権限 `auth/spreadsheets` の100人キャップとGoogle審査の壁を回避）。
   - 初回Push時に Google Drive API で「SheetSniper Sourcing Log」を自動作成し、18列のヘッダーを初期化。2回目以降は即座に行追記。
   - 401期限切れトークンの自動キャッシュ無効化（`removeCachedAuthToken`）＆自動再取得リトライを完備。

---

## 📦 Chrome への読み込み手順

### ステップ 1: Chrome に拡張機能を読み込む
1. Google Chrome を開き、アドレスバーに `chrome://extensions` と入力して Enter。
2. 右上の **「デベロッパーモード」** を ON にします。
3. 左上の **「パッケージ化されていない拡張機能を読み込む」** をクリックします。
4. 以下のフォルダを選択します：
   ```
   /home/wataru/monetize/ai-monetize/sheetsniper-ext
   ```
5. ツールバーに「SheetSniper」が表示されます。

---

### ステップ 2: Google OAuth クライアントIDの設定（初回のみ）
Google スプレッドシートへの保存機能を利用するための準備です（約2〜3分）：

1. [Google Cloud Console](https://console.cloud.google.com/) で新規プロジェクトを作成（または既存プロジェクトを選択）。
2. **「APIとサービス」 > 「ライブラリ」** から以下2つを検索して「有効にする」：
   - **Google Drive API**
   - **Google Sheets API**
3. **「APIとサービス」 > 「OAuth 同意画面」**：
   - User Type: 「外部 (External)」
   - アプリ名: `SheetSniper`
   - テストユーザーに自分の Google アカウント（Gmail）を追加。
4. **「APIとサービス」 > 「認証情報」 > 「認証情報を作成」 > 「OAuth クライアント ID」**：
   - アプリケーションの種類: **Chrome 拡張機能**
   - 名前: `SheetSniper Client`
   - **アイテム ID**: `chrome://extensions` で SheetSniper のカードに表示されている **32文字の ID** を貼り付け。
5. 作成後に表示される `client_id`（例: `xxxxxxxx.apps.googleusercontent.com`）をコピー。
6. [`sheetsniper-ext/manifest.json`](manifest.json) の `oauth2.client_id` を書き換えます：
   ```json
   "oauth2": {
     "client_id": "あなたのクライアントID.apps.googleusercontent.com",
     "scopes": [
       "https://www.googleapis.com/auth/drive.file"
     ]
   }
   ```
7. `chrome://extensions` で SheetSniper の **更新アイコン（🔄）** をクリック。

---

## 🧪 動作確認手順

1. Amazon.com の商品ページ（例: `https://www.amazon.com/dp/B0...`）を開きます。
2. 画面右上に SheetSniper パネルが表示されます。
3. 「Buy Cost（仕入れ値）」を入力すると、リアルタイムに以下が計算されます：
   - **Net Profit（純利益）**
   - **ROI (%) / Margin (%)**
   - **Break-Even（損益分岐販売価格）**
   - **2026年 Amazon手数料内訳**（FBA発送手数料、配置手数料、燃料サーチャージ、カテゴリ別成約料、納品送料）
4. **「⚡ Push to Google Sheets」** をクリックすると、Google Drive に自動作成された `SheetSniper Sourcing Log` シートに行データが瞬時に追記されます！

---

## 🔬 ユニットテストの実行

```bash
node /home/wataru/monetize/ai-monetize/sheetsniper-ext/test-calculator.js
```
公式2026年FBAレート・燃料サーチャージ・容積重量支配・欠測時ガードの全アサーションテストが実行されます。
