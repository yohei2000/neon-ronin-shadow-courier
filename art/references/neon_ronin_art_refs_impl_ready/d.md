# D — 画像D: 忍者のシルエットとスカーフ

## 目的
48〜64px表示高でも成立する、主人公のシルエット・スカーフ・色アクセント仕様。

## 実装で残す要素
- 黒シルエット、マゼンタのスカーフ、シアンの目/鞄エンブレムで瞬時に識別させる。
- idle/run/jump/wall slide/slashの5主要ポーズを基準にアニメーションを作る。
- スカーフは速度と向きを示す単独レイヤーとして扱う。

## 実装時の制約
- 衣装の細部を増やさない。64pxで消えるディテールは削る。
- 色アクセントは基本的にcyan 1系統、magenta 1系統に限定する。
- 背景が明るくても暗くても輪郭が潰れないこと。

## ランタイムへの落とし込み
- sprite sheet、scarf secondary-motion frames、small-scale readability test、contrast background test。

## 対応ファイル
- `d.png`
