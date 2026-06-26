# E — 画像E: 2D横スクロールの背景レイヤー構成

## 目的
Phaserでそのまま実装できる、960x540向けparallax layer設計仕様。

## 実装で残す要素
- far sky、distant skyline、mid roofs/signs、gameplay layer、near props、near props front、foreground occlusionの7層構成を基本にする。
- gameplay layerのみscrollFactor 1.0で、背景/前景は距離に応じてscrollFactorを変える。
- foreground occlusionは画面端や奥行き演出に使い、プレイヤーを隠しすぎない。

## 実装時の制約
- 各層の情報量を抑え、単層だけで完成画にしようとしない。
- collision layerは常に読みやすく、装飾で足場境界を曖昧にしない。
- 前景は演出用。操作に必要な情報を隠さない。

## ランタイムへの落とし込み
- tileSprite/layer scroll factors、layer depth order、repeatable strips、foreground silhouettes。

## 対応ファイル
- `e.png`
