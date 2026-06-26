# G — 画像G: 斬撃エフェクト

## 目的
ゲーム中に読みやすく短時間で消える、実装可能な斬撃VFX仕様。

## 実装で残す要素
- anticipation、active arc、breakup、fade outの4フェーズで構成する。
- magenta core + black ink edge + cyan sparksを基本レイヤーにする。
- 暗背景と明背景の両方で視認できる厚みと色を維持する。

## 実装時の制約
- 総時間は約0.40秒以下。過剰な粒子で敵や地形を隠さない。
- 常時大量particleを出さず、object pooling前提にする。
- 低負荷設定ではbreakup shardsを減らせるようにする。

## ランタイムへの落とし込み
- core ribbon sprite/mesh、ink edge flipbook、cyan spark particles、breakup shards、fade curve。

## 対応ファイル
- `g.png`
