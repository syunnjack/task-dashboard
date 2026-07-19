# SUKIMA INSIGHT 効果測定・分析改善プラットフォーム設計

## 1. 目的

公開済みのWeb、PWA、iOS、Android、30ブランドに加え、GitHub Appを導入したアカウント・組織の全リポジトリをプロジェクト台帳へ同期し、一つの指標体系で比較する。集客、AI旅行準備、混雑閲覧、通知、広告クリック、予約、成果報酬のどこを改善すべきか判断できるようにする。

## 2. アーキテクチャ

`GitHub App/全リポジトリ同期 + Web/App SDK → 収集API → 検証・最小化 → SQLite（販売版はPostgreSQL） → 日次集計 → 管理ダッシュボード → 改善提案・A/Bテスト`

収集APIは許可イベントと許可プロパティだけを受け付ける。端末IDは日次ソルト相当でハッシュ化し、日をまたぐ個人追跡を標準では行わない。

## 3. 共通イベント

- `page_view`
- `offer_impression`
- `concierge_started`
- `concierge_completed`
- `checklist_completed`
- `notification_subscribed`
- `affiliate_click`
- `booking_started`
- `conversion`

共通属性はbrand、app、campaign、placement、category、itemId、experiment、variant、contentClassに限定する。パスポート、カード、正確な位置、健康情報、成人向けの具体的嗜好は送信しない。

## 4. KPI

- 日次・月次利用セッション
- アクセス数（セッション）、PV、1セッション当たりPV
- AI旅行準備開始率・完了率
- チェックリスト完了率
- 通知登録率
- アフィリエイトCTR
- `CTR = affiliate_click / offer_impression`
- `CVR = conversion / affiliate_click`
- 予約開始率・成果率
- 承認売上、1セッション収益
- Web/PWA/iOS/Android別成果
- ブランド、国、配置、キャンペーン別成果
- GitHubリポジトリ、公開URL、Web/PWA/iOS/Android別成果
- 継続率、通知解除率、エラー率、改善施策の増分効果

## 4.1 GitHub全リポジトリ台帳

GitHub Appのinstallation単位で、所有者、リポジトリ、公開・非公開、既定ブランチ、主言語、homepage、Pages URL、最終更新、アーカイブ状態を同期する。計測SDKの有無、公開URL、アプリID、環境をプロジェクトへ紐付ける。リポジトリを30件に固定せず、ページングとWebhookで追加・移管・削除へ追従する。

権限がある場合はGitHub Trafficのclone・view、stars、forks、Actions成功率、デプロイ日時も別系列で取得する。サイトのアクセス数とGitHubリポジトリ閲覧数は混同せず、別KPIとして表示する。現在接続中のGitHubコネクターから取得可能なリポジトリが0件だったため、実運用同期にはGitHub Appのinstallation承認が必要。

## 5. 改善ループ

毎週、最大の離脱地点を一つ選び、仮説、変更、対象KPI、停止条件を登録する。実験はvariantをイベントへ付与し、母数不足では勝敗を断定しない。売上だけでなく通知解除、エラー、アクセシビリティ完了率もガードレール指標にする。

## 6. 権限

- owner: 全指標、収益、メンバー、データ削除
- editor: 指標閲覧、施策・実験登録
- viewer: 集計指標のみ

生イベントの外部出力と成人区分の分析はownerに限定する。

## 7. 保持・プライバシー

- 生イベント: 90日
- 日次集計: 25か月
- IPアドレス: 保存しない
- 日次ハッシュセッション: 24時間単位
- 成人区分: 個人単位では保持しない
- 削除、利用目的、委託先、保持期間をプライバシー画面に明示

## 8. 段階開発

MVPは収集API、ファネル、売上、アプリ別集計、ルール型改善提案。次にASP成果CSV照合、通知成果、A/Bテスト、異常検知、AIによる週次レポートを追加する。

## 9. 販売モデル

- Starter: 3プロジェクト、月間10万イベント、基本KPI
- Growth: 30プロジェクト、月間100万イベント、売上・A/Bテスト・通知
- Agency: 複数顧客、ホワイトラベル、権限、定期レポート
- Enterprise: 全リポジトリ、SSO、監査ログ、専用保持期間、SLA

課金単位は「計測プロジェクト数 + 月間イベント数」とし、GitHubリポジトリを閲覧するだけでは課金しない。顧客ごとにworkspace_idを付け、DB行、暗号鍵、請求、保持期間を分離する。
