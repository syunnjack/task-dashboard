# SUKIMA PLATFORM — 30ブランド共通設計

## 1. プロダクト原則

外部の混雑APIを競争力の中心にしない。施設入力、現地QR、簡易整理券、予約残数、赤外線カウンター、匿名化した施設内センサーを一次データとして蓄積する。表示はWebのCanvasとアプリのSVGで行い、混雑度・取得時刻・信頼度・推定か実測かを明記する。

共通ユーザーフロー:

```text
混雑を見る → 場所を保存 → 通知条件を設定 → 空き通知
→ 空いている代替候補 → 予約・購入 → 成果計測
```

店舗フロー:

```text
3ボタン更新／QR／整理券／センサー → 混雑スコア
→ 閑散時間の通知・クーポン → 予約・来店 → 分析レポート
```

## 2. 共通画面設計

### Web / PWA

1. ブランド別ヒーローと主要CTA
2. 時刻スライダー付きCanvasヒートマップ
3. ゾーン詳細、待ち時間、時間帯予測
4. Web通知の閾値・代替候補・クーポン設定
5. 空いている候補カード
6. 30ブランドカタログ
7. 施設掲載・収益導線

URLは当面 `?brand=sauna` のように切り替える。独自ドメイン展開時はホスト名から同じslugを解決する。

### iOS / Android

1. ブランド切替と平均混雑度
2. SVGヒートマップ
3. ゾーン別混雑表示
4. Expo Notificationsによる空き通知
5. 通知条件、代替候補、広告配信の同意
6. 保存施設・旅程（次フェーズ）

## 3. システム構成

```text
sukima-platform/
  src/                    Web / PWA
    data/verticals.js     30ブランド設定
  public/
    manifest.webmanifest
    sw.js                 Web Push受信
  apps/mobile/            Expo共通アプリ
    app/                  画面
    src/brands.js         モバイル用ブランド設定
  services/collector/     次フェーズ: QR・店舗・整理券取込
  services/notifier/      次フェーズ: 閾値判定・Push配信
  packages/contracts/     次フェーズ: 共通データ型
  brands/<slug>/          論理リポジトリ／ブランド設定
```

最初は1リポジトリで検証し、個別チームや別法人が必要になったブランドだけ `git subtree split` で独立リポジトリへ分離する。30リポジトリを最初から複製しないため、セキュリティ修正や通知改善を一度で全ブランドへ反映できる。

## 4. リポジトリ名・ドメイン候補

ドメインはブランド候補であり、取得可能性・商標をレジストラ、JPRS WHOIS、J-PlatPatで購入直前に確認する。

| 順位 | ブランド | ジャンル | 論理リポジトリ | ドメイン候補 |
|---:|---|---|---|---|
| 1 | ととのうナビ | サウナ・温浴 | `brands/sauna` | `totonou-now.jp` |
| 2 | SEAT NOW | コワーキング・自習室 | `brands/cowork` | `seatnow.jp` |
| 3 | すぐ席 | 飲食店 | `brands/restaurant` | `suguseki.jp` |
| 4 | PARK SCOPE | 駐車場 | `brands/parking` | `parkscope.jp` |
| 5 | AKILOCK | 手荷物預かり | `brands/locker` | `akilock.jp` |
| 6 | CAMP SIGNAL | キャンプ・BBQ | `brands/camp` | `campsignal.jp` |
| 7 | CHARGE PULSE | EV充電 | `brands/ev` | `chargepulse.jp` |
| 8 | IMA BEAUTY | 美容・マッサージ | `brands/beauty` | `imabeauty.jp` |
| 9 | SUKIMA TRIP | 観光・体験 | `brands/tourism` | `sukimatrip.jp` |
| 10 | FLOW VENUE | イベント | `brands/event` | `flowvenue.jp` |
| 11 | GYM PULSE | ジム | `brands/gym` | `gympulse.jp` |
| 12 | TABLE FLOW | フードコート | `brands/foodcourt` | `tableflow.jp` |
| 13 | TEE SIGNAL | ゴルフ | `brands/golf` | `teesignal.jp` |
| 14 | WASH WATCH | ランドリー | `brands/laundry` | `washwatch.jp` |
| 15 | QUEUE OFF | テーマパーク | `brands/themepark` | `queueoff.jp` |
| 16 | MUSE PASS | 美術館・水族館 | `brands/museum` | `musepass.jp` |
| 17 | MALL FLOW | 商業施設 | `brands/mall` | `mallflow.jp` |
| 18 | AIRPORT FLOW | 空港 | `brands/airport` | `airportflow.jp` |
| 19 | LIFT PULSE | スキー場 | `brands/ski` | `liftpulse.jp` |
| 20 | COAST SIGNAL | 海水浴場 | `brands/beach` | `coastsignal.jp` |
| 21 | SEAT DROP | 映画館・劇場 | `brands/cinema` | `seatdrop.jp` |
| 22 | ROOM NOW | カラオケ | `brands/karaoke` | `roomnow.jp` |
| 23 | MACHI CARE | 病院・薬局 | `brands/clinic` | `machicare.jp` |
| 24 | MICHI FLOW | 道の駅・SA/PA | `brands/roadstation` | `michiflow.jp` |
| 25 | SPACE DROP | レンタルスペース | `brands/rentalspace` | `spacedrop.jp` |
| 26 | FISH SIGNAL | 釣り場・マリーナ | `brands/fishing` | `fishsignal.jp` |
| 27 | MADO NOW | 行政窓口 | `brands/publicdesk` | `madonow.jp` |
| 28 | TOWN FLOW | 商店街・観光DMO | `brands/district` | `townflow.jp` |
| 29 | YARD PULSE | 物流拠点 | `brands/logistics` | `yardpulse.jp` |
| 30 | SAFE FLOW | 防災・避難所 | `brands/shelter` | `safeflow.jp` |

GitHubの物理リポジトリ第一候補は `syunnjack/sukima-platform`。将来分離する場合は `syunnjack/sukima-sauna`、`syunnjack/sukima-cowork` の命名規則を使う。

## 5. 混雑スコア

```text
score = 実測人数 35%
      + 店舗更新 25%
      + QR・整理券 20%
      + 過去の同曜日同時刻 20%
```

データがない項目は残りの項目へ重みを再配分する。店舗更新は時間経過で減衰し、2時間を超えた値は「現在」ではなく「通常予測」として表示する。5人未満の位置セルは統合または非表示にする。

## 6. 通知設計

- 混雑度が指定閾値以下
- 待ち時間が指定分数以下
- 保存した場所のキャンセル枠
- 徒歩圏の代替候補
- 閑散時間限定プラン（明示的同意のみ）
- 1施設1日最大2回を初期値

PWAはService WorkerのPushイベント、アプリはExpo Notificationsを使う。現在のWeb実装は通知権限、端末内条件保存、確認通知までを実装済み。バックグラウンドでの本配信には次フェーズの通知サーバーとWeb Push購読情報が必要。

## 7. 収益設計

### 店舗課金

- Free: 3段階更新、QR、基本ページ
- Standard: 月額3,000〜10,000円、通知・クーポン・分析
- Pro: センサー連携、複数施設、API出力、SLA

### 成果報酬

前売券、席・区画・時間枠予約、回数券、月額会員、物販、ホテル、配送、保険。通知に広告が含まれる場合は登録画面と通知本文の両方で広告と表示する。

### B2B

自治体、商業施設、イベント、物流向けの月額ライセンスと導入支援。自然な空き順位と有料掲載順位は混在させない。

## 8. リリース順

1. ととのうナビを5〜10施設で検証
2. SEAT NOWとすぐ席へ横展開
3. PARK SCOPE、AKILOCK、CAMP SIGNALを追加
4. 成果報酬・通知CTR・店舗更新率を確認後、7〜20位を展開
5. 公共・B2B分野はセキュリティと調達要件を分離して展開

30ブランドを同日に公開するのではなく、共通基盤は30対応の状態で完成させ、営業・データ品質・運用体制に合わせて順次ドメインを公開する。
