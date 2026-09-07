# Google Cloud Console - OAuth 本番公開（Publish）手順書

SheetSniper で使用している Google API スコープは、**非機密スコープ（Non-sensitive）** である `https://www.googleapis.com/auth/drive.file` のみです。

一般的な `auth/drive` や `auth/spreadsheets` のような機密スコープとは異なり、**数万ドルかかる第三者セキュリティ監査（CASA等）は一切不要（費用0円）** で、誰でも安全に本番公開できます。

---

## ステップ 1: OAuth 同意画面を「本番環境（Publish）」に切り替える

1. [Google Cloud Console](https://console.cloud.google.com/) をブラウザで開きます。
2. 上部のプロジェクト選択で、SheetSniper を作成したプロジェクト（番号: `60320686142...`）を選択します。
3. 左側メニュー（☰）から **「API とサービス」** > **「OAuth 同意画面」** を開きます。
4. **「公開ステータス（Publishing status）」** の欄にある **「アプリを公開（PUBLISH APP）」** ボタンをクリックします。
5. 確認ダイアログが表示されたら、**「確認（Confirm）」** をクリックします。
   - これにより「テスト中（100人制限）」が解除され、世界中のユーザーが警告画面なしで認証できるようになります。

---

## ステップ 2: アプリ情報（ブランディング）の入力

OAuth 同意画面の「アプリの編集（またはブランディング）」で、以下の必須項目を入力・確認します。

1. **アプリ名**: `SheetSniper`
2. **ユーザー サポートメール**: ご自身の Google メールアドレス
3. **アプリのロゴ**: `icons/icon128.png`（または 120×120px の PNG 画像）をアップロード
4. **アプリのドメイン**:
   - **アプリケーションのホームページ**: GitHub リポジトリ URL、または GitHub Pages の URL（例: `https://github.com/wataru/...`）
   - **アプリケーションのプライバシー ポリシー リンク**: `privacy.html` の公開 URL（GitHub Pages 等に配置した URL）
   - （※利用規約リンクは任意・空欄でも可）
5. **デベロッパーの連絡先情報**: ご自身のメールアドレス
6. 画面下の **「保存して次へ」** をクリックします。

---

## ステップ 3: スコープの確認（超重要）

次の「スコープ」設定画面で、選択されている権限を確認します。

- **必須スコープ**: `.../auth/drive.file` のみが設定されていること。
- **注意**: `.../auth/drive` や `.../auth/spreadsheets` は**絶対に選択しないでください**（これらを入れると「機密/制限付きスコープ」と判定され、長い審査や警告画面の原因になります）。
- 確認したら **「保存して次へ」** をクリックします。

---

## ステップ 4: Chrome Web Store のアイテム ID との紐付け確認

1. Chrome Web Store Developer Dashboard に拡張機能の ZIP（`dist/sheetsniper-v1.0.0.zip`）をドラッグ＆ドロップして下書き作成すると、32文字の **「アイテム ID（Item ID）」**（例: `abcdefghijklmnopqrstuvwxyz123456`）が発行されます。
2. Google Cloud Console の **「API とサービス」** > **「認証情報」** を開きます。
3. すでに作成済みの **「Chrome アプリ」OAuth 2.0 クライアント ID** をクリックします。
4. **「アイテム ID」** 欄を確認します：
   - 現在の ID と Chrome Web Store のアイテム ID が一致していれば完了です。
   - もし開発時のIDと異なる場合は、アイテム ID 欄をストアの新しい ID に変更して保存する（または新しいクライアントIDを発行して `manifest.json` の `client_id` を更新する）だけでOKです。
