# F — 画像F: HUD、ボタン、パネルの質感

## 目的
実装可能なUIパーツだけに絞った、HUD/ボタン/パネルの質感仕様。

## 実装で残す要素
- HP bar、timer、scroll counter、objective panel、pause menu、mobile controlsを優先実装する。
- black lacquer、worn paper、ink wash、cyan glow、magenta glowの5素材を基本にする。
- cyanは情報/utility、magentaはcombat/actionに使い分ける。

## 実装時の制約
- UIを細かくしすぎない。スマホで指と視線を邪魔しないサイズにする。
- 背景込みの複雑なパネルを全UIへ使い回さない。必要部分だけ9-slice/atlas化する。
- メニューはraw text listにしないが、装飾過多にもならないようにする。

## ランタイムへの落とし込み
- UI atlas、bitmap/vector icons、9-slice panels、mobile button sprites、focus/pressed states。

## 対応ファイル
- `f.png`
