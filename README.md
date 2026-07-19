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

本番のバックグラウンド通知、認証、永続データ、施設管理画面、センサー取込は次フェーズです。
