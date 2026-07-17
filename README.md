# route-spot-navi

Route Spot Naviは、乗換・高速バスの到着地から「次に行く場所」まで探せる地域情報ナビのプロトタイプです。

## Concept

- 経路検索の到着地から、周辺スポット、宿、喫煙場所、カフェ、ゲーム施設などへ誘導する
- 待ち時間、徒歩分数、料金、評価、ユーザー投票で比較できる
- 掲載候補をメモし、カテゴリ別の検索条件に反映できる
- 将来的に地図、口コミ、閉店情報、ランキング、API連携へ拡張する

## Production

- Domain: `routespot.jp`
- Build command: `npm run build`
- Build output: `dist`

GitHub Pagesで公開する場合は、`public/CNAME` に `routespot.jp` を設定済みです。

## Commands

- `npm run dev`: 開発サーバー起動
- `npm run build`: 本番ビルド
- `npm run lint`: 静的解析
- `npm run preview`: ビルド結果のプレビュー
