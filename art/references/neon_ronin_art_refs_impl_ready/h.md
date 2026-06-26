# H — 画像H: 敵のテレグラフ表現

## 目的
敵攻撃を公平に読ませるための、2D横スクロール向けcombat language仕様。

## 実装で残す要素
- glow-up → aiming pose → ground/range warning → wind-up silhouette → release → recoverを基本シーケンスにする。
- magentaは重い近接/危険、cyanは移動/高速/範囲系として使う。
- 攻撃後recoverを必ず設け、読んだプレイヤーが反撃できるようにする。

## 実装時の制約
- テレグラフなしの即時攻撃は禁止。
- 床マーカーや射線は背景に埋もれない明度で表示する。
- 派手さより、いつ・どこに・何が来るかの明確さを優先する。

## ランタイムへの落とし込み
- enemy state frames、warning glow sprites、floor/range indicator、timing table、recover windows。

## 対応ファイル
- `h.png`
