# B — 画像B: 雨の夜の色温度と光の反射

## 目的
夜雨ステージの配色、光源、霧、濡れた床反射を960x540で実装するための照明仕様。

## 実装で残す要素
- moonlight + lantern gold、cyan neon + magenta neon、warm/cool alley moodの3プリセットとして使う。
- 床反射はリアルな反射ではなく、縦方向の短いストリークspriteで表現する。
- 霧は背景奥を薄くし、プレイヤー周辺のシルエットを保つために使う。

## 実装時の制約
- 白飛びする雨や過剰なbloomを避ける。
- プレイヤーと敵は常に中〜高コントラストで読めること。
- 動的ライト数は最小限にし、基本はbaked風のsprite/glowで表現する。

## ランタイムへの落とし込み
- 背景色プリセット、additive glow sprites、rain streak layer、fog overlay、wet reflection tile strips。

## 対応ファイル
- `b.png`
