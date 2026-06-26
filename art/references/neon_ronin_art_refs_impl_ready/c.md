# C — 画像C: サイバーパンク看板の密度

## 目的
看板密度を「豪華だが実装可能」な範囲に制限するためのカメラビュー単位の配置仕様。

## 実装で残す要素
- 1画面あたりhero sign 1個、medium sign 3〜5個、small sign 5〜8個を上限目安にする。
- hero signはプレイヤー導線付近に置き、medium signは視線誘導、small signは奥行き用に暗く置く。
- 看板・ランタン・ケーブル・シャッター・配管はモジュラーassetとして再利用する。

## 実装時の制約
- 参照画像のように全画面を看板で埋めない。
- 小さい文字を読ませる前提にしない。形、発光色、サイズで読ませる。
- 背景看板はプレイヤー/敵/足場より明度・彩度を落とす。

## ランタイムへの落とし込み
- sign atlas、lantern sprites、cable/pipe props、dimmed background signs、camera-view density validator。

## 対応ファイル
- `c.png`
