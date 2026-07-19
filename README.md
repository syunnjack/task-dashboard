# SUKIMA PLATFORM

外部の混雑APIを競争力の中心にせず、施設入力・QR・整理券・センサーで一次データを作る混雑ヒートマップ／空き通知基盤です。1つのWeb/PWAとExpoアプリから30ブランドを設定で展開します。

## Web

```bash
npm install
npm run dev
npm run build
```

`?brand=sauna`、`?brand=parking`のようにブランドを直接指定できます。

## Mobile

```bash
cd apps/mobile
npm install
npm start
```

## Shared API

```bash
Copy-Item .env.example .env
npm run api
npm run test:api
```

通知配信ワーカーは別プロセスで実行します。初期値はドライランなので、VAPID鍵を設定するまで実通知は送られません。

```bash
npm --prefix services/api run vapid
npm --prefix services/api run worker
```

Web Push と Expo Push に対応し、失敗時は最大4回まで指数バックオフで再試行します。施設アカウントには owner / editor / viewer 権限があり、匿名チェックインとログインにはレート制限があります。

Webを共有APIへ接続する場合は、Web側の`VITE_SUKIMA_API_URL`を設定します。未設定時は端末内デモモードで動作します。

## Documentation

- `docs/MONOREPO_BLUEPRINT.md`: 30ブランド、画面、通知、収益、ドメイン設計
- `docs/PRODUCT_PLAN.md`: 市場候補と初期プロダクト計画

## Current prototype scope

- Canvas / SVGによるAPI不要のヒートマップ
- 時刻別混雑予測
- 30ブランド切替
- Web Notification権限と条件保存
- Service WorkerのPush受信処理
- Expo Notifications登録画面
- 空いている代替候補と収益CTA
- 施設スタッフの3段階混雑更新
- 整理券の待ち組数入力
- 読み取り可能な現地チェックインQR
- 匿名センサー収容率のデモ入力
- 複数信号を統合した混雑スコアと信頼度

共有APIにはSQLite永続化、施設セッション、複数ゾーン、匿名チェックイン、混雑集計、通知購読と閾値ジョブを実装しています。WebはAPI接続時に施設ログインと共有DB保存へ切り替わり、未設定時は端末内デモへフォールバックします。実際のPush送信、外部ID連携、本番センサーゲートウェイは次フェーズです。
