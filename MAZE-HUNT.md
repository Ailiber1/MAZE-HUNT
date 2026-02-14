MAZE HUNT — Complete Specification for Claude Code
===================================================
Platform-Neutral / AI Build Ready / Firebase + Single HTML
v2.0 — FINAL BUILD EDITION

════════════════════════════════════════════════════
CLAUDE CODE 開発ガイド（必読）
════════════════════════════════════════════════════

■ このドキュメントの使い方
本仕様書は「MAZE HUNT」を Claude Code で単一HTMLファイルとして実装するための
完全仕様書である。上から順に読み、Phase 1 → Phase 9 の順序で実装すること。

■ 参照すべきスキルファイル
以下のスキルを実装前に必ず確認すること：
1. /mnt/skills/user/game-webapp-dev/SKILL.md
   → Firebase同期、GameState設計、SyncLayer、CPU AI、ネオンUI
2. /mnt/skills/public/frontend-design/SKILL.md
   → ビジュアル品質、グロー効果、モーション、サイバーパンクテーマ

■ 絶対に守るべき技術制約
- THREE.CapsuleGeometry は Three.js r128 に存在しない → 使用禁止
  → CylinderGeometry + SphereGeometry で代替
- 全コードを単一 index.html に内包（外部ファイル禁止、CDN除く）
- Firebase SDK と Three.js r128 は CDN から読み込み
- localStorage はデバイスID保存にのみ使用
- MeshStandardMaterial は光源必須 → 暗所では emissive を必ず設定

■ 使用許可CDN
- Three.js r128: https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js
- Firebase SDK:
  - https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js
  - https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js

■ Firebase設定テンプレート
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
```
※ 実装時は上記プレースホルダをユーザーの Firebase 設定で置換

■ プロジェクト構成
```
MAZE-HUNT/
├── index.html      # 単一ファイルアプリ（全コード内包）
└── README.md
```

■ 出力ファイル
- /mnt/user-data/outputs/index.html に最終成果物を配置


================================
0. 目的 / 対応環境 / 技術スタック
================================
本仕様書は以下の環境でそのまま利用可能とする：
・Claude Code
・Google AI Studio（Build / Apps）
・WebベースAI開発環境全般

技術スタック：
・フロントエンド: 単一HTMLファイル（HTML/CSS/JavaScript 全内包）
・3Dエンジン: Three.js r128（CDN）
・バックエンド: Firebase Realtime Database
・ホスティング: GitHub Pages
・認証: デバイスID方式（localStorage）
・描画: Three.js WebGLRenderer

■ 3Dキャラクターモデル（Mixamo GLB）
全キャラクターはMixamo（Adobe）からダウンロードしたGLBモデルを使用。
GLTFLoader（Three.js）で読み込む。

リポジトリ内ファイル配置（ルート直下）:

【プレイヤーキャラ（6体選択可能）】
| ID | ファイル名 | 説明 |
|----|-----------|------|
| P1 | James.glb | 男性キャラ |
| P2 | Amy.glb | 女性キャラ |
| P3 | Bryce.glb | 男性キャラ |
| P4 | Ortiz.glb | 男性キャラ |
| P5 | humanoid.glb | ヒューマノイド |
| P6 | Crypto.glb | 男性キャラ |

【鬼キャラ（ステージごとに異なる鬼）】
| ステージ | ファイル名 | 説明 |
|---------|-----------|------|
| Stage 1 | Hallin.glb | 鬼キャラ1 |
| Stage 2 | zombie.glb | ゾンビ型 |
| Stage 3 | Jolleen.glb | 鬼キャラ3 |
| Stage 4 | Mutant.glb | ミュータント型 |
| Stage 5 | CH45.glb | ロボット型 |
| スコアアタック | Skeletonzombi.glb | スケルトンゾンビ |
| 隠しステージ | Skeletonzombi.glb | エフェクト変更で差別化 |

【アニメーション（全キャラ共通）】
| ファイル名 | 用途 | 備考 |
|-----------|------|------|
| Walking.glb | 歩行 | In Place / 30fps |
| Running.glb | 走行 | In Place / 30fps |
| Idle.glb | 待機 | 30fps |
| Stumble.glb | つまずき・転倒 | タイトル画面演出用。In Place / 30fps。※後日追加 |

【読み込みコード（参考）】
```javascript
// GLTFLoader は CDN から読み込み
// https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js では
// GLTFLoader が含まれないため、別途読み込みが必要:
// <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>

const loader = new THREE.GLTFLoader();

// キャラクターモデル読み込み
function loadCharacter(filename) {
    return new Promise((resolve, reject) => {
        loader.load(filename, (gltf) => {
            const model = gltf.scene;
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            resolve(model);
        }, undefined, reject);
    });
}

// アニメーション読み込み・適用
function loadAnimation(filename, model) {
    return new Promise((resolve, reject) => {
        loader.load(filename, (gltf) => {
            const mixer = new THREE.AnimationMixer(model);
            const clip = gltf.animations[0];
            const action = mixer.clipAction(clip);
            resolve({ mixer, action });
        }, undefined, reject);
    });
}

// 使用例
const playerModel = await loadCharacter('James.glb');
scene.add(playerModel);
const { mixer, action } = await loadAnimation('Walking.glb', playerModel);
action.play();

// ゲームループ内で mixer.update(delta) を呼ぶ
```

【隠しステージ鬼のエフェクト変更】
Skeletonzombi.glb を読み込んだ後、以下のエフェクトを適用:
・マテリアルを半透明紫に変更（opacity: 0.7, color: 0x2a0030, emissive: 0x1a001f）
・胸部に脈動する紫の PointLight（0x6600aa）
・目に赤い PointLight ×2（0xff0000）
・手足スケールを拡大（腕 ×1.4、脚 ×1.3）

【マルチプレイ時のキャラ選択】
・ロビー画面でP1〜P6の6体から選択可能
・プレイヤーカラー（ピンク/シアン/イエロー/パープル）はキャラのemissiveで表現
・同じキャラを複数人が選択可能（カラーで区別）

================================
1. ゲーム概要
================================
タイトル：MAZE HUNT（決定）
ジャンル：3D一人称ホラー鬼ごっこ（脱出）

・薄暗いサイバー迷路の中、鬼（CPU・Mixamo 3Dモデル）から逃げ延びる
・一人称視点（FPS）で迷路を走り抜ける体験型ホラー
・マトリックス風の暗緑色ネオン空間 × ホラー演出
・全ステージ「制限時間付き脱出」: 鬼から逃げながら出口を探して脱出
・ステージクリア制 + スコアアタック + マルチプレイ対応

プレイ形式：
・一人でプレイ（ソロ：ストーリー / スコアアタック）
・マルチプレイ（リアルタイム同期・最大4人：個人戦 / チーム戦 / 協力 / 全モード5ステージ制）

対応デバイス：
・PC（Web）最優先
・スマートフォン（Web / 横持ち推奨）

デザインテーマ：
Matrix × Horror / Neon Green × Dark / CRT Terminal
※FALL DODGE / LINKED BLOCKS_ と同一のデザイン体系を継承
※タイトル画面: マトリックス背景＋タイトルロゴは全面赤色（ホラー差別化）、UIパネルは緑
※3Dゲーム画面内は緑基調

プレイヤーカラー（最大4人）：
・P1: ピンク  (255, 50, 150)  — #ff3296
・P2: シアン  (0, 220, 255)   — #00dcff
・P3: イエロー (255, 220, 0)   — #ffdc00
・P4: パープル (180, 80, 255)  — #b450ff


================================
2. タイトル候補（決定済み）
================================
★ 採用: MAZE HUNT — 迷路の狩り。ゲーム内容を最も正確に表現


================================
3. 起動キャッチコピー（毎回表示）
================================
表示文（固定）：
「捕まるな！何があっても逃げ切れ！」

仕様：
・アプリ起動時、毎回必ず表示
・赤色発光テキスト（--matrix-red + 赤グロー）、黒背景に赤文字
・font-size: 22px、letter-spacing: 4px
・2〜3秒で自動フェードアウト
・クリック／タップで即消去可能
・世界観演出として扱う
・同期SE: SE_MATCH_READY（インパクト音）


================================
4. UI STATE（共通ステート）
================================
UI_STATE:
- IDLE      : 通常
- HOVER     : ホバー中
- ACTIVE    : 選択中
- DISABLED  : 無効
- ERROR     : エラー

視覚ルール：
・HOVER → 緑発光 + 浮き上がり（translateY: -2px）
・ACTIVE → 常時発光 + 微パルス（pulse animation）
・DISABLED → 低コントラスト（opacity: 0.4）
・ERROR → 短時間赤発光 + 警告SE

CSS変数（LINKED BLOCKS_ / FALL DODGE 共通ベース + タイトル画面ホラー演出用）：
```css
:root {
    /* === 共通ベース（LINKED BLOCKS_ / FALL DODGE 統一） === */
    --neon-green: #00ff41;
    --neon-green-dim: #00aa2a;
    --neon-green-glow: rgba(0, 255, 65, 0.6);
    --neon-cyan: #00ffff;
    --neon-pink: #ff00ff;
    --neon-yellow: #ffff00;
    --neon-red: #ff3366;
    --neon-gold: #ffcc00;
    --neon-purple: #b450ff;
    --bg-dark: #0a0204;
    --bg-darker: #050000;
    --bg-panel: rgba(0, 20, 10, 0.85);
    --text-primary: #c0ffc0;
    --text-dim: #4a8a4a;
    --border-glow: 0 0 8px var(--neon-green), inset 0 0 8px rgba(0, 255, 65, 0.1);

    /* === タイトル画面用: マトリックス背景の赤文字（セクション5参照） === */
    --matrix-red: #e02020;
    --matrix-red-glow: rgba(224, 32, 32, 0.6);
}
```


================================
5. タイトル画面構成
================================
LINKED BLOCKS_ / FALL DODGE と完全同一のレイアウト構成。
全面マトリックス背景（全面赤色ホラー仕様）の上に、タイトルロゴとUIパネルを配置。

■ マトリックス背景（タイトル画面独自: 全面赤色ホラー仕様）
FALL DODGE / LINKED BLOCKS_ は緑一色だが、本ゲームは完全ホラー仕様として
マトリックス背景を全面赤色にする。これにより他ゲームとの明確な差別化を図る。
※この演出はタイトル画面・ロビー画面・リザルト画面など2D UI画面のみ。
※3Dゲーム画面中はマトリックス背景は表示しない。

・全列: 赤文字（--matrix-red: #e02020）
・ベースopacity: 0.45（しっかり視認できる明るさ）
・text-shadow: 二重グロー（10px + 20px）で発光感を強調
・約50%の列: 脈動（opacity: 0.25↔0.6, 周期3〜5秒）
・約5%の列: フラッシュ（opacity: 0.4→1.0→0.4, 周期6〜14秒）
・残りの列: 固定opacity 0.45

【背景グラデーション（4段階）】
background: linear-gradient(180deg,
    #0f0308 0%,    ← 上部: 暗赤
    #1a0508 30%,   ← 中上部: やや明るい赤（赤みのピーク）
    #0d0204 70%,   ← 中下部: 暗く戻る
    #080002 100%   ← 底部: 最暗
);

【赤グローオーバーレイ（#red-glow）】
マトリックス文字の上に重ねて、画面全体に赤い雰囲気を加える。
- 上部中央: 放射状の赤グロー（rgba(180,15,15,0.12)、60%でフェード）
- 下部中央: 薄い赤グロー（rgba(120,8,8,0.1)、50%でフェード）
- ビネット効果: 画面端が暗くなり中央が引き立つ（40%→100%で暗転）

```css
#red-glow {
    position: fixed; top: 0; left: 0;
    width: 100%; height: 100%;
    background:
        radial-gradient(ellipse at 50% 20%, rgba(180,15,15,0.12) 0%, transparent 60%),
        radial-gradient(ellipse at 50% 80%, rgba(120,8,8,0.1) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(5,0,0,0.4) 100%);
    pointer-events: none; z-index: 1;
}
```

【レイヤー重ね順（z-index）】
0: #matrix-bg（マトリックス文字）
1: #red-glow（赤グローオーバーレイ）
5: #fog-overlay（下部フォグ）
10: #content（タイトルロゴ + UIパネル）
100: #crt-overlay（CRTスキャンライン）
200: #catchcopy（起動時格言）

```javascript
function createMatrixBg() {
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF';
    const bg = document.getElementById('matrix-bg');
    const colCount = Math.floor(window.innerWidth / 22);

    for (let i = 0; i < colCount; i++) {
        const col = document.createElement('div');
        const duration = 8 + Math.random() * 14;
        col.style.left = (i * 22) + 'px';
        col.style.animationDelay = -(Math.random() * duration) + 's';

        const r = Math.random();
        if (r < 0.05) {
            // 5%: フラッシュ列
            col.className = 'matrix-col matrix-col-flash';
            col.style.animationDuration = duration + 's, ' + (6 + Math.random() * 8) + 's';
        } else if (r < 0.5) {
            // 45%: 脈動列
            col.className = 'matrix-col matrix-col-pulse';
            col.style.animationDuration = duration + 's, ' + (3 + Math.random() * 4) + 's';
        } else {
            // 50%: 固定列
            col.className = 'matrix-col';
            col.style.animationDuration = duration + 's';
        }

        let text = '';
        const len = 30 + Math.floor(Math.random() * 30);
        for (let j = 0; j < len; j++) {
            text += chars[Math.floor(Math.random() * chars.length)] + '\n';
        }
        col.textContent = text;
        bg.appendChild(col);
    }
}
```

```css
.matrix-col {
    color: var(--matrix-red);
    opacity: 0.45;
    text-shadow: 0 0 10px var(--matrix-red-glow), 0 0 20px rgba(224,32,32,0.3);
}
.matrix-col-pulse {
    animation: matrixFall linear infinite, redPulse 4s ease-in-out infinite alternate;
}
.matrix-col-flash {
    animation: matrixFall linear infinite, redFlash 8s ease-in-out infinite;
}
@keyframes redPulse {
    0%   { opacity: 0.25; }
    100% { opacity: 0.6; }
}
@keyframes redFlash {
    0%, 93% { opacity: 0.4; }
    96%     { opacity: 1.0; }
    100%    { opacity: 0.4; }
}
```

タイトルロゴ（画面上部）：
・タイトル名を赤色ホラーフォントで大きく発光表示（大文字、2行）
  「MAZE」+改行+「HUNT」
・フォント: Creepster（Google Fonts） — ホラー感のある歪んだ書体
・色: --matrix-red (#e02020) + 赤グロー4層
・text-shadow: 0 0 10px / 30px / 60px / 100px の4段階赤グロー
・タイトルは3秒周期で明滅（brightness: 1.0↔1.2）

```css
#title-logo h1 {
    font-family: 'Creepster', cursive;
    font-weight: 400;
    font-size: 82px;
    line-height: 0.95;
    letter-spacing: 18px;
    color: var(--matrix-red);
    text-shadow:
        0 0 10px var(--matrix-red),
        0 0 30px var(--matrix-red-glow),
        0 0 60px rgba(224,32,32,0.4),
        0 0 100px rgba(224,32,32,0.2);
}
```

■ タイトル画面キャラクターチェイスアニメーション
タイトルロゴ下に、プレイヤーキャラが鬼から逃げ回るチェイスアニメーションを表示。
SVGシルエットによる2Dアニメーション（※本番実装ではGLBモデルの3Dシーンに差し替え可能）。

【表示内容】
・プレイヤーキャラ3体（P1ピンク / P2シアン / P3イエロー）が右方向へ走る
・鬼キャラ1体（赤、目が赤く光る）が左後方から追いかける
・全キャラ画面右端に達したら左端にワープして繰り返し
・プレイヤー速度: 1.1px/frame（微揺れ付き） / 鬼速度: 0.9px/frame（通常時）

【転倒演出】
・ランダムなタイミング（約10〜15秒間隔）でプレイヤー1体が転ぶ
・転倒中のプレイヤー: 速度0.15px/frameに減速、回転+落下アニメーション（1.2秒間）
・転倒時に鬼が加速（0.9→1.8px/frame）、体が微拡大してバウンス加速
・転倒後は自動で起き上がり、通常速度に復帰
・次の転倒まで約6〜7秒のクールダウン

【必要な追加アニメーション（本番3D実装用・Mixamoからダウンロード）】
| ファイル名 | 用途 | 備考 |
|-----------|------|------|
| Stumble.glb | つまずき・転倒 | タイトル画面演出用。In Place / 30fps |

※ Stumbleアニメーションは後日Mixamoからダウンロードしてリポジトリに追加する

【UIパネルとの関係】
タイトル画面の配置（上から順）:
1. タイトルロゴ「MAZE HUNT」（赤・Creepster）
2. チェイスアニメーション（380×64px）
3. UIパネル（緑・ネオン枠 — FALL DODGEと統一）

中央UIパネル（角括弧装飾付きボックス・緑テーマ）：
FALL DODGEと同じくネオン緑枠+角ブラケット装飾で囲む。
※UIパネル・ボタン・入力欄は緑（--neon-green）のまま。赤はマトリックス背景とタイトルのみ。
上から縦並びで以下の要素を配置:

```
┌─────────────────────────────────────┐
│  USER NAME                           │
│  ┌─────────────────────────────┐     │
│  │ 名前を入力...                │     │
│  └─────────────────────────────┘     │
│                                      │
│  ┌─────────────────────────────┐     │
│  │    登録してゲームを始める      │     │ ← メインボタン（ネオン枠）
│  └─────────────────────────────┘     │
│  ┌─────────────────────────────┐     │
│  │ ▶ 登録しないでゲームを始める   │     │ ← サブボタン（薄い枠）
│  └─────────────────────────────┘     │
│                                      │
│  ┌─────────────────────────────┐     │
│  │    マルチプレイ（最大4人）     │     │ ← ネオン枠
│  └─────────────────────────────┘     │
│  ┌─────────────────────────────┐     │
│  │ 🏆 スコアアタック              │     │ ← ゴールド枠（FALL DODGEと同一）
│  └─────────────────────────────┘     │
│                                      │
│  ┌─────────────────────────────┐     │
│  │    ルール説明を見る            │     │ ← 薄い枠
│  └─────────────────────────────┘     │
│  ┌─────────────────────────────┐     │
│  │    ランキングを見る            │     │ ← 薄い枠
│  └─────────────────────────────┘     │
│                                      │
│  [日本語] [English] │ [🔇 BGM]       │ ← フッター帯
└─────────────────────────────────────┘
```

■ ボタン構成（FALL DODGEと統一）
| 順序 | ボタン | 枠スタイル | 備考 |
|------|--------|----------|------|
| 1 | 登録してゲームを始める | ネオン緑枠 | ストーリーモードへ |
| 2 | ▶ 登録しないでゲームを始める | 薄い緑枠 | ゲスト、ストーリーモードへ |
| 3 | マルチプレイ（最大4人） | ネオン緑枠 | ロビーモーダルへ |
| 4 | 🏆 スコアアタック | ゴールド枠（#ffcc00） | FALL DODGEと同じ強調色 |
| 5 | ルール説明を見る | 薄い緑枠 | モーダル |
| 6 | ランキングを見る | 薄い緑枠 | モーダル |

■ フッター帯（パネル内下部）
・日本語 / English 切替ボタン（FALL DODGEと同一）
  → GameState.language を更新し、Navigator.setLanguage() も連動
  → UI全体 + ナビゲーターテキストが即座に切り替わる
・BGM ON/OFF ボタン（FALL DODGEと同一：赤枠=OFF、緑枠=ON）

■ 共通UIルール（全ゲーム統一）
・ユーザーが FALL DODGE → 本ゲーム と移動しても迷わないよう、
  ボタン配置・枠スタイル・色使い・フォントを完全統一する
・「登録して〜」「登録しないで〜」の文言も統一
・マルチプレイ・スコアアタック・ルール・ランキングの並び順も統一


================================
6. ユーザーネーム仕様
================================
【登録プレイ】
・ユーザーネーム永続保存（Firebase + localStorage）
・ランキング対象
・同名重複不可
・再ログイン可（deviceIdで照合）

重複時表示：
「このネームは他のユーザーが使用中です」
→ ERROR state + 警告SE

【ゲスト】
・登録不要
・表示名：PLAYER 1 / PLAYER 2 / PLAYER 3 / PLAYER 4
・ランキング対象外

デバイスID生成：
```javascript
function getDeviceId() {
    let id = localStorage.getItem('maze_hunt_device_id');
    if (!id) {
        id = 'dev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('maze_hunt_device_id', id);
    }
    return id;
}
```


================================
7. ルールブック
================================
・モーダル表示、背景暗転
・スマホ縦スクロール対応
・ネオン枠モーダル

内容：
・暗い迷路の中、鬼（CPU・Mixamoモデル）から逃げ延びる3Dホラー鬼ごっこ
・一人称視点で移動、矢印キー or WASD で操作（←→は向き変更、↑↓は前後移動）
・Shift でスプリント（スタミナ消費）
・鬼が近づくと黄フレーム警告（12m以内）→ 赤フレーム警告（6m以内）+ 心拍上昇
・迷路には必ず逃げ道がある
・ストーリーモード: 5ステージクリア制
  - 全ステージ脱出: 制限時間内に出口を見つけて脱出すればクリア
  - 脱出ステージ: 鬼から逃げながら迷路の出口（EXIT）を見つけて脱出
・スコアアタック: 時間無制限、逃げ続けるほどスコア加算
・マルチプレイ: 最大4人、個人戦/チーム戦/協力プレイ（全モード5ステージ制）
  - チーム戦: プレイヤーが鬼側と逃げ側に分かれて対戦（CPU鬼なし）
・ステージが上がるごとに鬼が増え、速くなる
・ランキングは登録ユーザーのみ対象


================================
8. ランキング仕様
================================
表示：
・トップ50表示
・モーダル表示

項目：
・順位 / ユーザーネーム / スコア / モード / 最高ステージ

ランキング対象：
・登録ユーザーのみ
・ソロ・マルチ両方のスコアを記録

タブ切替：
・ストーリー / スコアアタック / マルチ個人戦 / 協力

Firebase取得：
```javascript
database.ref('rankings')
    .orderByChild('score')
    .limitToLast(50)
    .on('value', snap => { /* 降順で表示 */ });
```


================================
9. 操作仕様
================================
【PC — 矢印キー / WASD 両対応】
・↑ / W : 前進
・↓ / S : 後退
・← / A : 左に向きを変える（左回転）
・→ / D : 右に向きを変える（右回転）
・Shift  : スプリント（スタミナ消費）
・マウス : 視点操作（Pointer Lock API）※ マウス操作も併用可能

※ 矢印キーとWASDは同じ動作。どちらでも操作可能。
※ 左右キーは「平行移動」ではなく「向き変更（回転）」。

【回転速度】
・キー回転速度: 2.0 rad/s（← → / A D キー）
・マウス感度: 0.002（Pointer Lock時の movementX に乗算）

```javascript
// 状態管理
// moveLeft / moveRight → turnLeft / turnRight に変更
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') GameState.moveForward = true;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') GameState.moveBackward = true;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') GameState.turnLeft = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') GameState.turnRight = true;
    if (e.key === 'Shift') GameState.sprint = true;
});
document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') GameState.moveForward = false;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') GameState.moveBackward = false;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') GameState.turnLeft = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') GameState.turnRight = false;
    if (e.key === 'Shift') GameState.sprint = false;
});

// 移動処理（ゲームループ内）
function updatePlayerMovement(delta) {
    const turnSpeed = 2.0; // rad/s

    // 左右キー → 向きを変える（Y軸回転）
    if (GameState.turnLeft) GameState.playerRotationY += turnSpeed * delta;
    if (GameState.turnRight) GameState.playerRotationY -= turnSpeed * delta;

    // マウスによる回転（Pointer Lock時）
    // mousemove イベントで GameState.playerRotationY -= e.movementX * 0.002;

    // 前後キー → 向いている方向に移動
    const speed = GameState.sprint ? GameState.sprintSpeed : GameState.moveSpeed;
    const direction = new THREE.Vector3();
    if (GameState.moveForward) direction.z -= 1;
    if (GameState.moveBackward) direction.z += 1;
    direction.normalize();
    direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), GameState.playerRotationY);

    GameState.playerPosition.x += direction.x * speed * delta;
    GameState.playerPosition.z += direction.z * speed * delta;
}
```

【スマートフォン — タッチ最適化】
・画面左半分: バーチャルジョイスティック
  - 上下: 前進・後退
  - 左右: 向きを変える（左回転・右回転）※ PCの←→キーと同じ動作
・画面右半分: タッチドラッグで視点操作（マウスと同じ）
・スプリントボタン: 画面右下に配置（丸型、半透明）
・touchstart / touchmove / touchend で制御
・e.preventDefault() で誤スクロール防止
・ジョイスティックは半透明表示（操作中のみ明るく）
・画面回転ロック: portrait（縦）固定を推奨、landscape（横）も対応
================================
10. ゲームモード
================================

■ ストーリーモード（5ステージ）
全ステージ「制限時間付き脱出」で統一。鬼から逃げながら迷路の出口（EXIT）を見つけて脱出する。
制限時間内に出口に到達すればクリア。捕まるか時間切れでゲームオーバー。
常にプレイヤーが動く理由があり、「隠れて待つだけ」の空白時間が生まれない設計。

| Stage | 迷路サイズ | フロア | 鬼の数 | 制限時間 | 鬼速度倍率 | テーマ | 出口の特徴 |
|-------|-----------|-------|--------|---------|-----------|--------|-----------|
| 1 | 10×10 | 1F | 1 | 75秒 | ×1.0 | 地下研究所（サイバーラボ） | 対角配置。ヒント矢印あり。出口固定 |
| 2 | 12×12 | 1F | 1 | 90秒 | ×1.0 | 廃工場（錆びた機械・ギア） | 対角配置。ヒント矢印あり。出口固定 |
| 3 | 16×16 | 2F | 2 | 100秒 | ×1.2 | 廃ビルオフィス（デスク・モニター） | 出口は2F。ヒント矢印なし。出口固定 |
| 4 | 20×20 | 2F | 3 | 120秒 | ×1.3 | 地下下水道（水滴り・湿気・パイプ） | 出口は2F。ヒント矢印なし。出口固定 |
| 5（ファイナルステージ） | 24×24 | 3F | 4 | 150秒 | ×1.5 | 崩壊データセンター（サーバーラック崩壊） | 出口は3F。30秒ごとに出口がワープ。照明最小 |
| ??? | 28×28 | 3F | 5 | 120秒 | ×1.6 | 異空間ラボ（紫エフェクト・歪んだ空間） | 出口が動く+フェイク出口3個。霧最濃 |

※ 数値は目安。プレイテストで調整。
※ 隠しステージ「???」は通常プレイでは出現しない（後述の解放条件を参照）
※ Stage 5 のゲーム画面表示名は「FINAL STAGE」とする

【出口ヒント矢印（Stage 1-2のみ）】
・画面中央下にうっすら緑の矢印が出口方向を示す
・出口に近づくほど矢印が明るくなる（opacity: 距離に反比例）
・Stage 3以降はヒントなし → 自力で探索する緊張感

【ステージ表示名マッピング】
```javascript
const STAGE_DISPLAY_NAMES = {
    1: 'STAGE 1',
    2: 'STAGE 2',
    3: 'STAGE 3',
    4: 'STAGE 4',
    5: 'FINAL STAGE',
    hidden: '???'
};
```

■ 隠しステージ「???」

【解放条件】
・ストーリーモードのStage 5をクリア済みであること（必須）
・タイトル画面のユーザー名入力欄に「AWDS」と入力する
・Stage 5未クリアの場合、「AWDS」を入力しても何も起きない（反応しない）
・入力すると画面が一瞬赤くフラッシュし、ノイズ音とともに「??? UNLOCKED」と表示
・以降、ストーリーモード選択時にStage ???が出現する

【二重チェック（改ざん防止）】
・クライアント側: GameState.storyClearedStage5 で判定
・Firebase側: ユーザーデータの storyClearedStage5 を参照して検証
・ゲーム開始時にFirebaseから storyClearedStage5 を読み込む
・ローカルのみ改ざんしても、Firebaseの値が false なら解放されない

【解放判定コード】
```javascript
// ユーザー名入力欄の監視
usernameInput.addEventListener('input', async (e) => {
    const value = e.target.value.toUpperCase();
    if (value === 'AWDS') {
        // Firebase側でStage 5クリア済みか確認（ローカル値だけに頼らない）
        const userRef = database.ref('users/' + GameState.username);
        const snapshot = await userRef.once('value');
        const userData = snapshot.val();

        if (userData && userData.storyClearedStage5 === true) {
            // 隠しステージ解放
            GameState.hiddenStageUnlocked = true;
            await userRef.update({ hiddenStageUnlocked: true });
            e.target.value = '';  // 入力欄をクリア（ユーザー名として登録しない）
            playHiddenUnlockEffect();  // 赤フラッシュ + ノイズ音
            showNotification('??? UNLOCKED');
        } else {
            // Stage 5未クリア → 何も起きない
            e.target.value = '';
        }
    }
});
```

【ステージ仕様】
・迷路: 28×28、3フロア
・鬼: 5体（×1.6速度）
・制限時間: 120秒（Stage 5より短い）
・出口: 20秒ごとにワープ（Stage 5は30秒）
・フェイク出口: 本物の出口に加えて偽の出口が2つ配置される
  - 見た目は本物と同じ緑の光柱
  - 近づくと（距離 < 3m）赤く変わり消滅、その位置に鬼が1体追加出現
・霧: fogDensity 最大（0.15）
・照明: PointLight なし。プレイヤーのフラッシュライトのみ

【隠しステージ専用 鬼デザイン — 妖怪型】
Skeletonzombi.glb をベースに、以下のエフェクトで差別化する。
通常ステージの鬼とは異なる、人型だが明らかに人ではない妖怪的な外見。

・マテリアル変更: 半透明暗紫（opacity: 0.7, color: 0x2a0030, emissive: 0x1a001f）
・体型: 手足スケール拡大（腕 ×1.4、脚 ×1.3）
・表面: transparent: true で霧に溶け込む
・内部光: 胸部に脈動する紫の PointLight（0x6600aa, intensity 0.5〜1.5 を 1秒周期で明滅）
・目: 頭部に2つの小さな赤い PointLight（0xff0000, intensity 2.0）が常時発光

```javascript
function createHiddenOni(baseModel) {
    const oni = baseModel.clone();
    
    // マテリアルを半透明紫に変更
    oni.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshStandardMaterial({
                color: 0x2a0030,
                emissive: 0x1a001f,
                roughness: 0.9,
                metalness: 0.1,
                transparent: true,
                opacity: 0.7,
            });
        }
    });

    // 目（赤い発光点）
    const eyeL = new THREE.PointLight(0xff0000, 2.0, 3);
    eyeL.position.set(-0.08, 1.72, -0.12);
    oni.add(eyeL);

    const eyeR = new THREE.PointLight(0xff0000, 2.0, 3);
    eyeR.position.set(0.08, 1.72, -0.12);
    oni.add(eyeR);

    // 胸部の脈動ライト
    const chestLight = new THREE.PointLight(0x6600aa, 1.0, 5);
    chestLight.position.set(0, 1.3, 0);
    oni.add(chestLight);
    oni.userData.chestLight = chestLight;

    return oni;
}

// 脈動アニメーション（ゲームループ内）
function updateHiddenOniGlow(oni, time) {
    if (oni.userData.chestLight) {
        oni.userData.chestLight.intensity = 0.5 + Math.sin(time * Math.PI * 2) * 0.5;
    }
}
```

【隠しステージ専用 鬼の挙動 — 不規則瞬間移動】
通常のBFS追跡に加えて、不規則なタイミングで瞬間移動する。

・瞬間移動間隔: 5〜15秒のランダム間隔
・移動先: プレイヤーから 5〜12m の範囲内のランダムな通路セル（壁の中には出現しない）
・移動先は同じフロア限定（フロア間のテレポートはしない）
・予兆: 瞬間移動の 1秒前に鬼が激しく点滅（opacity 0.7→0.0 を高速で繰り返す）
・移動時: 元の位置に紫の煙パーティクル（0.5秒で消滅）
・移動後: 移動先に紫の煙パーティクル + 低いノイズ音
・瞬間移動直後は 1秒間静止（プレイヤーに反応時間を与える）

```javascript
// 瞬間移動ロジック
function updateHiddenOniTeleport(oni, delta) {
    oni.teleportTimer -= delta;

    if (oni.teleportTimer <= 1.0 && !oni.teleportWarning) {
        // 予兆: 点滅開始
        oni.teleportWarning = true;
        oni.flickerActive = true;
    }

    if (oni.teleportTimer <= 0) {
        // 瞬間移動実行
        const newPos = getRandomPassageNear(
            GameState.playerPosition,
            5, 12,  // 最小距離, 最大距離
            oni.currentFloor,
            GameState.mazeFloors[oni.currentFloor]
        );
        spawnSmokeParticle(oni.position, 0x6600aa);  // 元の位置に煙
        oni.position.copy(newPos);
        spawnSmokeParticle(newPos, 0x6600aa);          // 移動先に煙
        playTeleportSound();

        // リセット
        oni.teleportTimer = 5 + Math.random() * 10;   // 次の瞬間移動まで5〜15秒
        oni.teleportWarning = false;
        oni.flickerActive = false;
        oni.stunTimer = 1.0;  // 1秒間静止
    }
}
```

【ランキング表示】
・ステージ名: 「???」と表示
・スコア計算はStage 5と同じ方式

■ 脱出ステージ専用仕様

【出口（EXIT）】
・迷路の特定セルにEXITマーカーを配置
・表示: 緑色の光柱（PointLight 緑 + 上方向の柱状パーティクル）
・ミニマップ上にEXITアイコン表示（点滅する緑●）
・プレイヤーがEXITセルに到達（距離 < 2m）でクリア

【出口配置ルール】
・Stage 2: 対角（プレイヤーと最も遠い位置）に固定
・Stage 4: ランダム位置（対角から一定距離以上離れた場所）
・Stage 5: 30秒ごとに出口が別の位置にワープ（ワープ前に3秒間点滅警告）

【ヒント矢印（Stage 2のみ）】
・画面上部に出口方向を示す矢印（→ ↑ ← ↓）を常時表示
・色: 薄い緑（#00ff41, opacity 0.3）

```javascript
// 出口配置
function placeExit(grid, cols, rows, stage) {
    if (stage === 2) {
        return { x: cols - 1, z: rows - 1 }; // 対角固定
    }
    // ランダム配置（プレイヤー位置から一定距離以上）
    let exitCell;
    do {
        exitCell = {
            x: Math.floor(Math.random() * cols),
            z: Math.floor(Math.random() * rows)
        };
    } while (distance(exitCell, {x:0, z:0}) < cols * 0.5);
    return exitCell;
}

// 出口ワープ（Stage 5）
function warpExit(grid, cols, rows) {
    // 3秒間点滅警告
    exitMarker.blinking = true;
    setTimeout(() => {
        const newPos = placeExit(grid, cols, rows, 5);
        exitMarker.position.set(newPos.x * CL + CL/2, 0, newPos.z * CL + CL/2);
        exitMarker.blinking = false;
    }, 3000);
}

// 出口の光柱
function createExitMarker(x, z) {
    const group = new THREE.Group();
    // 緑の光柱
    const pillar = new THREE.PointLight(0x00ff41, 5, 15);
    pillar.position.set(x * CL + CL/2, 2, z * CL + CL/2);
    group.add(pillar);
    // パーティクル（上方向に流れる緑の粒）
    // ... BufferGeometry + Points
    return group;
}
```

■ スコアアタックモード
・時間無制限。鬼から逃げ続ける限りスコアが加算
・スコア加算ルール:
  - 生存時間 × 1点/秒
  - 鬼の近接回避ボーナス（鬼が6m以内に来て離れた: +10点）
  - ステージ進行ボーナス（一定時間ごとに鬼追加+迷路拡張で自動上昇）
・捕まったら終了、最終スコアをランキングに送信

【スコアアタック専用ステージテーマ: 無限回廊（エンドレスラボ）】
スコアアタックは独自テーマで固定。ストーリーの全テーマ要素を混合した集大成。
・初期迷路: 12×12 / 1F
・60秒ごとに迷路拡張（+4×4ずつ拡大、最大28×28）
・120秒経過で2F解放、240秒経過で3F解放
・壁: Stage 1ベースのサイバーパネル（0x0a1a0e）
・床: グリッドライン付き（0x050a06）
・装飾: 全ステージの装飾がランダムで混在（研究所の端末、工場の歯車、オフィスのデスク等）
・時間経過による環境変化:
  0〜60秒: Stage 1風（明るめ、緑基調）
  60〜120秒: Stage 2風（フォグ増加、オレンジ光混入）
  120〜240秒: Stage 4風（シアン光、水滴音追加）
  240秒〜: Stage 5風（赤光増加、スパーク、照明減少）
・鬼: Skeletonzombi.glb（固定）
・PointLight色: 時間経過で緑→オレンジ→シアン→赤にグラデーション変化
・環境音: 時間経過で各ステージの環境音が順に追加されていく（重ねがけ）
・フォグ密度: 0.010（初期）→ 時間経過で0.003/分ずつ増加（最大0.025）

```javascript
STAGE_THEMES.scoreAttack = {
    name: '無限回廊',
    wallColor: 0x0a1a0e,
    floorColor: 0x050a06,
    fogColor: 0x000a05,
    fogDensity: 0.010,  // 時間経過で増加
    pointLightColors: [0x00ff41, 0x00aaff],  // 時間経過で変化
    pointLightCount: 50,  // 時間経過で減少
    gridOpacity: 0.06,
    neonStripeFrequency: 0.25,
    dynamic: true,  // 時間経過で環境が変化するフラグ
};
```

■ マルチプレイ（最大4人同時接続）

全マルチモード共通: 5ステージ制（Stage 1〜5を順に進行）

| モード | ボタン表示 | 人数 | CPU鬼 | 脱出 | ルール |
|--------|----------|------|------|------|--------|
| 個人戦 | 個人戦 | 2〜4人 | あり | あり | 全員 vs CPU鬼。最初に脱出したプレイヤーの勝利 |
| チーム戦 | チーム戦 | 2〜4人 | なし | なし | 鬼チーム vs 逃げチーム。時間制限サバイバル |
| 協力プレイ | 協力 | 2〜4人 | あり | あり | 全員 vs CPU鬼。1人でも脱出すればステージクリア |

■ 個人戦 詳細

【ルール】
・全プレイヤー + CPU鬼。プレイヤー同士は敵（協力しない）
・出口はソロと同じ（ステージごとに固定 or ワープ）
・最初に出口に到達したプレイヤーがそのステージの勝者
・1位が脱出した後、残りのプレイヤー用に新しい出口が即座にランダム生成
・全員脱出 or 全員捕獲 or 時間切れで次ステージへ
・5ステージの累計ポイントで最終順位を決定

【ポイントシステム】
| 順位 | ポイント |
|------|---------|
| 1位（最速脱出） | 10pt |
| 2位 | 6pt |
| 3位 | 3pt |
| 4位 | 1pt |
| 捕獲された | 0pt |
| 時間切れ | 0pt |

【ステージ構成】
・ステージ構成はソロと同一（サイズ・フロア・制限時間・鬼速度）
・鬼の数はソロと同じ（Stage 1: 1体、Stage 5: 4体）

【リザルト画面（各ステージ終了後）】
```
STAGE 1 RESULT
1st  P1 (YOU)       ESCAPED  10:32  — 10pt
2nd  P3 (GUEST 2)   ESCAPED  11:45  — 6pt
3rd  P2 (GUEST 1)   CAUGHT   —      — 0pt
4th  P4 (GUEST 3)   TIME UP  —      — 0pt

TOTAL: P1: 10pt / P3: 6pt / P2: 0pt / P4: 0pt
[次のステージへ]
```

【最終リザルト（5ステージ終了後）】
```
GAME SET!
WINNER: P1 (ユーザーネーム) — 38pt

1st  P1  38pt  ★
2nd  P3  27pt
3rd  P2  15pt
4th  P4   8pt

[再戦]  [タイトルに戻る]
```

■ チーム戦 詳細

【ルール】
・鬼チーム vs 逃げチーム。CPU鬼なし。プレイヤーが鬼を直接操作
・脱出なし（出口なし）。時間制限内に逃げ切るサバイバル方式
・逃げチームの勝利条件: 制限時間内に1人でも逃げ切る
・鬼チームの勝利条件: 制限時間内に逃げチーム全員を捕獲
・ラウンド交替: 各ステージで攻守交替（合計2ラウンド）

【チーム構成】
・2人の場合: 1v1（鬼1 vs 逃げ1）
・3人の場合: 1v2（鬼1 vs 逃げ2）
・4人の場合: 2v2（鬼2 vs 逃げ2）
・ロビーでホストが各プレイヤーの陣営を割り当て可能
・ラウンド交替で公平性を担保

【色分け — 明確なチーム識別】
| 要素 | 鬼チーム（赤） | 逃げチーム（青） |
|------|--------------|----------------|
| キャラモデル発光色 | 0xff2020（赤） | 0x2060ff（青） |
| HUDフレーム色 | 赤枠 | 青枠 |
| ミニマップマーカー | 赤● | 青● |
| フラッシュライト色 | 0xff2020（赤SpotLight） | 0x2060ff（青SpotLight） |
| ネーム表示色 | 赤テキスト | 青テキスト |
| チーム表示バッジ | 🔴 ONI | 🔵 RUNNER |

・鬼チームのキャラモデルにはemissive赤を強めに適用（暗闇で目立つ）
・逃げチームはemissive青を控えめに適用（見つかりにくい）

【鬼チームの操作】
・三人称視点（鬼モデルを背後から操作）
・カメラ: 鬼の背後やや上方（高さ3m、距離2m後方）
・移動: WASD / 矢印キー（逃げ側と同じ操作体系）
・速度: ONI.baseSpeed × ステージ倍率（ソロの鬼AIと同じ速度）
・スプリント: なし（鬼側にスタミナ機能なし、一定速度）
・捕獲: 逃げ側プレイヤーに距離 1.2m 以内で接触 → 捕獲成立
・壁衝突: あり（壁通り抜け不可）
・階段: 使用可能（速度×0.7）

【鬼チームの視覚支援】
・ミニマップに逃げ側プレイヤーの「大まかな位置」を表示
  → 正確な位置ではなく、8セル単位の範囲を薄い青で表示（ゾーンレーダー）
  → 20秒ごとに更新（リアルタイムではない）
・逃げ側プレイヤーとの最短距離を表示（HUD右上、更新間隔5秒）
・フラッシュライト: 赤色（0xff2020）

【逃げチームの視覚支援】
・ミニマップに鬼チームの正確な位置を常時表示（赤●）
・鬼との距離・方向をHUD右上に表示（ソロと同じ）
・フラッシュライト: 青色（0x2060ff）
・味方の位置を青●で常時表示

【ステージ構成（チーム戦専用）】
チーム戦は脱出ではなくサバイバルのため、制限時間を調整。

| Stage | 迷路サイズ | フロア | 制限時間 | 鬼速度倍率 |
|-------|-----------|-------|---------|-----------|
| 1 | 12×12 | 1F | 60秒 | ×1.0 |
| 2 | 14×14 | 1F | 75秒 | ×1.0 |
| 3 | 16×16 | 2F | 75秒 | ×1.2 |
| 4 | 20×20 | 2F | 90秒 | ×1.3 |
| 5 | 24×24 | 3F | 90秒 | ×1.5 |

※各ステージで攻守交替するため、1ステージにつき2ラウンド実施
※迷路サイズをソロより小さめにし、鬼が追いつきやすくする

【勝敗判定】
```
1ステージ = 2ラウンド（攻守交替）

ラウンドA: チームA=鬼 vs チームB=逃げ
  → 逃げチーム全滅タイム or 生存人数を記録

ラウンドB: チームB=鬼 vs チームA=逃げ
  → 逃げチーム全滅タイム or 生存人数を記録

ステージ勝者:
  1. 生存人数が多い方の勝ち
  2. 同数なら生存時間合計が長い方の勝ち
  → 勝ちチームに1ポイント

5ステージ終了後、累計ポイントで最終勝者決定
```

【ロビーUI（チーム戦選択時）】
```
┌──────────────────────────────────┐
│  チーム戦設定                      │
│                                   │
│  🔴 鬼チーム（赤）                │
│  ┌──────┐ ┌──────┐               │
│  │ P1   │ │ (空き)│              │
│  └──────┘ └──────┘               │
│                                   │
│  🔵 逃げチーム（青）              │
│  ┌──────┐ ┌──────┐               │
│  │ P2   │ │ P3   │               │
│  └──────┘ └──────┘               │
│                                   │
│  ※ 各ステージで攻守交替します     │
│  ┌─────────────────────────┐      │
│  │         開始             │      │
│  └─────────────────────────┘      │
└──────────────────────────────────┘
```
・プレイヤー名をドラッグ＆ドロップでチーム移動
・ホストのみ編集可能

■ 協力プレイ 詳細

【ルール】
・全プレイヤー vs CPU鬼。全員で協力して脱出を目指す
・1人でも出口に到達すればステージクリア → 全員で次ステージへ
・捕まったプレイヤーは観戦モードへ（そのステージ中は復活しない）
・全員捕獲 or 時間切れ → ステージ失敗（同じステージをリトライ）
・次ステージ開始時に全員復活
・全5ステージクリアで協力クリア

【難易度（ソロより高い）】
マルチ協力は複数人の有利があるため、Stage 1からソロStage 3相当の難易度で開始。

| Stage | 迷路サイズ | フロア | 鬼の数 | 制限時間 | 鬼速度倍率 | ソロ相当 |
|-------|-----------|-------|--------|---------|-----------|---------|
| 1 | 16×16 | 2F | 2 | 100秒 | ×1.2 | ソロStage 3相当 |
| 2 | 20×20 | 2F | 3 | 120秒 | ×1.3 | ソロStage 4相当 |
| 3 | 24×24 | 3F | 4 | 130秒 | ×1.5 | ソロStage 5相当 |
| 4 | 24×24 | 3F | 5 | 120秒 | ×1.6 | ソロ隠しステージ相当 |
| 5 | 28×28 | 3F | 6 | 150秒 | ×1.8 | 協力専用（最高難度） |

※ Stage 5は協力モード専用の最高難度（ソロには存在しない6体の鬼）
※ 出口はStage 3以降ワープあり（ソロStage 5と同仕様）

【協力専用メカニクス】
・味方プレイヤーの位置をミニマップに青●で常時表示
・味方との距離が8m以内で「近接バフ」: スタミナ回復速度が×1.5
・ピンマーカー: Eキーで自分の位置にマーカーを設置（味方のミニマップに表示、15秒で消滅）
  → 出口の場所を仲間に教える、危険ルートを知らせる等
・ボイスチャットなし（代わりに定型チャット: 「こっち！」「危険！」「出口発見！」「逃げろ！」）
  → 1〜4キーで定型メッセージ送信、画面上に吹き出し表示

【定型チャット】
```javascript
const QUICK_CHAT = {
    ja: { 1: 'こっち！', 2: '危険！', 3: '出口発見！', 4: '逃げろ！' },
    en: { 1: 'Over here!', 2: 'Danger!', 3: 'Exit found!', 4: 'Run!' },
};
// 1〜4キーで送信。送信者の頭上に吹き出し表示（3秒間）
// 味方のHUDにも左下にログ表示
```

【ピンマーカー仕様】
```javascript
// Eキーで設置
function placePin(playerPos, playerFloor) {
    const pin = {
        position: { x: playerPos.x, z: playerPos.z },
        floor: playerFloor,
        timestamp: Date.now(),
        owner: GameState.playerId,
        duration: 15000, // 15秒で消滅
    };
    // Firebaseに同期 → 味方全員のミニマップに緑▼で表示
    syncPin(pin);
}
```

【観戦モード（捕獲後）】
・生存中の味方プレイヤーの視点を切替可能（Tab キーで切替）
・画面上部に「観戦中: P2」バッジ（日本語:「観戦中: P2」）
・定型チャットは観戦中でも送信可能（味方への情報支援）
・ミニマップは引き続き表示（鬼・味方の位置が見える）
→ 捕まった後も「味方への情報提供役」として参加し続けられる

【リザルト画面（各ステージ）】
```
STAGE 1 — ESCAPED!  / STAGE 1 — 脱出成功！
P1 (YOU)       ESCAPED  00:52
P2 (GUEST 1)   ESCAPED  01:03
P3 (GUEST 2)   CAUGHT   —
P4 (GUEST 3)   CAUGHT   —

★ P1が最初に脱出！ステージクリア！
[次のステージへ]
```

【協力クリア画面（全5ステージクリア）】
```
MISSION COMPLETE! / ミッション完了！

STAGE 1  ✓  CLEAR — P1が脱出
STAGE 2  ✓  CLEAR — P3が脱出
STAGE 3  ✓  CLEAR — P2が脱出
STAGE 4  ✓  CLEAR — P1が脱出
STAGE 5  ✓  CLEAR — P4が脱出

全員の協力で脱出成功！

[再戦]  [タイトルに戻る]
```

```javascript
const GAME_MODES = {
    story:       { label: 'ストーリー',    solo: true,  multi: false, maxPlayers: 1, stages: 5 },
    scoreAttack: { label: 'スコアアタック', solo: true,  multi: false, maxPlayers: 1, stages: Infinity },
    freeForAll:  { label: '個人戦',       solo: false, multi: true,  maxPlayers: 4, minPlayers: 2, stages: 5, hasExit: true,  hasCpuOni: true },
    teamBattle:  { label: 'チーム戦',     solo: false, multi: true,  maxPlayers: 4, minPlayers: 2, stages: 5, hasExit: false, hasCpuOni: false },
    coop:        { label: '協力',         solo: false, multi: true,  maxPlayers: 4, minPlayers: 2, stages: 5, hasExit: true,  hasCpuOni: true },
};
```


================================
11. 迷路仕様
================================
■ 生成アルゴリズム
Recursive Backtracker（再帰バックトラッカー）
※各フロアを独立生成し、階段セルで接続する

■ パラメータ
・セル幅: CL = 4m
・壁高: WH = 3.5m
・壁厚: 0.15m
・天井: あり（天井高 = WH = 3.5m）
・フロア高: FLOOR_H = 4m（壁高3.5m + 天井厚0.5m）
・サイズ: ステージごとに異なる（10×10 〜 24×24）
・フロア数: ステージごとに異なる（1F 〜 3F）

■ 高低差システム（マルチフロア）

ステージ進行に伴い迷路が立体化する。
序盤は平面、後半は複数フロアを階段で接続した立体迷路になる。

| Stage | 迷路サイズ | フロア数 | 階段数 | 備考 |
|-------|-----------|---------|--------|------|
| 1     | 10×10     | 1F      | 0      | 平面のみ。チュートリアル |
| 2     | 12×12     | 1F      | 0      | 平面。脱出ステージ入門 |
| 3     | 16×16     | 2F      | 2-3    | 初の二階構造。階段で上下移動 |
| 4     | 20×20     | 2F      | 3-4    | 広大な二階迷路。脱出ステージ |
| 5（FINAL STAGE） | 24×24     | 3F      | 4-6    | 三階構造。最終ステージ |

【フロア構造】
```
3F ┌───────────────────┐  y = 8.0m  ← Stage 5 のみ
   │ 迷路（独立生成）     │
   └──────┬────────────┘
          │ 階段
2F ┌──────┴────────────┐  y = 4.0m  ← Stage 3以降
   │ 迷路（独立生成）     │
   └──────┬────────────┘
          │ 階段
1F ┌──────┴────────────┐  y = 0.0m  ← 全ステージ
   │ 迷路（独立生成）     │
   └───────────────────┘
```

■ 階段（Stairs）

階段はセル1つ分の幅（4m）で、隣接する2フロアを斜めに接続する。
迷路生成後に通路セル上にランダム配置。行き止まりには置かない。

【種類】
| 種類 | 3Dメッシュ | 幅 | 長さ | 高低差 |
|------|-----------|-----|------|--------|
| スロープ | 傾斜面（BoxGeometry, rotateX） | 4m | 4m | 4m(1フロア分) |

【階段の3D表現】
```javascript
function createStairs(cellX, cellZ, fromFloor, toFloor, direction) {
    const group = new THREE.Group();
    const x = cellX * CL;
    const z = cellZ * CL;
    const yBase = fromFloor * FLOOR_H;

    // スロープ本体（傾斜面）
    const rampGeo = new THREE.BoxGeometry(CL, 0.15, CL * 1.42);
    const rampMat = new THREE.MeshStandardMaterial({
        color: 0x0a1a0e, roughness: 0.6, metalness: 0.3,
        emissive: 0x001a08, emissiveIntensity: 0.08
    });
    const ramp = new THREE.Mesh(rampGeo, rampMat);
    ramp.rotation.x = -Math.atan2(FLOOR_H, CL); // 傾斜角
    ramp.position.set(x + CL/2, yBase + FLOOR_H/2, z + CL/2);
    group.add(ramp);

    // 手すり（両側のネオンライン）
    const railMat = new THREE.MeshBasicMaterial({
        color: 0x00ff41, transparent: true, opacity: 0.3
    });
    // 左手すり
    const railL = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 1.0, CL * 1.42), railMat
    );
    railL.rotation.x = ramp.rotation.x;
    railL.position.set(x + 0.1, yBase + FLOOR_H/2 + 0.5, z + CL/2);
    group.add(railL);
    // 右手すり（同様）

    // 階段マーカー: 上下矢印ライト
    const arrowLight = new THREE.PointLight(0x00ff41, 1.5, 6);
    arrowLight.position.set(x + CL/2, yBase + 0.5, z + CL/2);
    group.add(arrowLight);

    return group;
}
```

【階段セルのプロパティ】
```javascript
// 迷路グリッド上の階段情報
// grid[floor][z][x] に追加プロパティ
{
    isStairs: true,
    connectsTo: { floor: 1, x: 5, z: 8 }, // 接続先
    direction: 'north' // スロープの向き（進入方向）
}
```

■ プレイヤーのY座標制御
```javascript
function updatePlayerY(playerPos, grid, currentFloor) {
    const cellX = Math.floor(playerPos.x / CL);
    const cellZ = Math.floor(playerPos.z / CL);
    const cell = grid[currentFloor][cellZ][cellX];

    if (cell && cell.isStairs) {
        // 階段上: セル内の位置に応じてYを補間
        const progress = getStairProgress(playerPos, cell.direction);
        const fromY = currentFloor * FLOOR_H + 1.7;
        const toY = cell.connectsTo.floor * FLOOR_H + 1.7;
        playerPos.y = fromY + (toY - fromY) * progress;

        // セル端に達したらフロア切替
        if (progress >= 1.0) {
            GameState.player.currentFloor = cell.connectsTo.floor;
        }
    } else {
        // 通常: 現在フロアの床高
        playerPos.y = currentFloor * FLOOR_H + 1.7;
    }
}

function getStairProgress(pos, direction) {
    const localX = (pos.x % CL) / CL;
    const localZ = (pos.z % CL) / CL;
    switch (direction) {
        case 'north': return 1 - localZ;
        case 'south': return localZ;
        case 'east':  return localX;
        case 'west':  return 1 - localX;
    }
}
```

■ 壁除去（ループ生成）
・生成後にランダムに15%の壁を除去
・ループ/ショートカットを生成し「必ず逃げ道がある」設計
・袋小路のみにならないことを保証
・階段セルの四方は壁を除去して通行可能にする

■ 階段配置アルゴリズム
```javascript
function placeStairs(floors, numStairs) {
    const stairs = [];
    for (let i = 0; i < numStairs; i++) {
        const fromFloor = Math.floor(Math.random() * (floors.length - 1));
        const toFloor = fromFloor + 1;

        // 両フロアで通路（壁でない）セルを探す
        let cell;
        do {
            const x = Math.floor(Math.random() * cols);
            const z = Math.floor(Math.random() * rows);
            cell = { x, z };
        } while (
            isWall(floors[fromFloor], cell) ||
            isWall(floors[toFloor], cell) ||
            isDeadEnd(floors[fromFloor], cell) ||
            tooCloseToOtherStairs(stairs, cell, 3) // 最低3セル離す
        );

        // 階段セルを両フロアに記録
        floors[fromFloor][cell.z][cell.x].isStairs = true;
        floors[fromFloor][cell.z][cell.x].connectsTo = { floor: toFloor, ...cell };
        floors[toFloor][cell.z][cell.x].isStairs = true;
        floors[toFloor][cell.z][cell.x].connectsTo = { floor: fromFloor, ...cell };

        stairs.push({ fromFloor, toFloor, ...cell });
    }
    return stairs;
}
```

■ スポーン位置
・プレイヤー: 1Fの(0,0)付近
・鬼: 最上階の対角(maxX, maxZ)付近（マルチフロア時）
  → 鬼が上の階から降りてくる恐怖感
・複数鬼はフロアごとに分散配置
・出口（脱出ステージのみ）: ステージ設定に従い配置
  → Stage 4: 2Fに出口配置（上の階へ逃げる必要がある）
  → Stage 5: 3Fに出口配置

■ 出口（EXIT）の3D表現
```javascript
function createExitZone(cellX, cellZ) {
    const group = new THREE.Group();
    const x = cellX * CL + CL / 2;
    const z = cellZ * CL + CL / 2;

    // 緑の光柱（上向きのスポットライト風）
    const exitLight = new THREE.PointLight(0x00ff41, 5, 15);
    exitLight.position.set(x, 2.0, z);
    group.add(exitLight);

    // 地面のリングマーカー
    const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.8, 1.2, 32),
        new THREE.MeshBasicMaterial({ color: 0x00ff41, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.01, z);
    group.add(ring);

    // 浮遊パーティクル（上方向に流れる緑の粒）
    // ... BufferGeometry + Points で実装

    // 「EXIT」テキスト（Sprite）
    // ... Canvas テクスチャで "EXIT" を描画し SpriteMaterial に適用

    return group;
}
```

■ 壁マテリアル
```javascript
const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a1a0e,
    roughness: 0.7,
    metalness: 0.4,
    emissive: 0x001a08,
    emissiveIntensity: 0.05
});
```

■ 床マテリアル
```javascript
const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x050a06,
    roughness: 0.9,
    metalness: 0.1
});
// 緑グリッドライン: LineBasicMaterial({ color: 0x00ff41, opacity: 0.04, transparent: true })
```

■ 壁装飾
・ワイヤーフレームエッジ（LineBasicMaterial, 緑, opacity 0.2）
・ランダムネオンストライプ（壁面にMeshBasicMaterialで薄緑の帯）

■ 迷路生成コード
```javascript
function generateMaze(cols, rows) {
    const grid = Array.from({length: rows}, () =>
        Array.from({length: cols}, () => ({top:true, right:true, bottom:true, left:true, visited:false}))
    );
    const stack = [];
    let current = {x:0, y:0};
    grid[0][0].visited = true;
    stack.push(current);

    while (stack.length > 0) {
        const neighbors = getUnvisitedNeighbors(current, grid, cols, rows);
        if (neighbors.length > 0) {
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            removeWall(grid, current, next);
            grid[next.y][next.x].visited = true;
            stack.push(current);
            current = next;
        } else {
            current = stack.pop();
        }
    }
    // 15%の壁をランダム除去
    removeRandomWalls(grid, cols, rows, 0.15);
    return grid;
}
```


================================
12. ビジュアルスタイル（世界観統一）
================================
■ 色彩設計思想（3Dゲーム画面内）
3Dゲーム画面はFALL DODGE / LINKED BLOCKS_ と同様に緑基調の暗いサイバー空間。
赤色は鬼キャラクターの自己発光と、HUD上の警告表示にのみ使用する。
※タイトル画面のマトリックス背景は全面赤色のホラー仕様。セクション5参照。

■ カラーパレット

| 要素 | 色 |
|------|-----|
| 背景/クリア色 | 0x000805 |
| フォグ | 0x000a05 |
| 壁 | 0x0a1a0e |
| 床 | 0x050a06 |
| ネオンアクセント | #00ff41 (緑) |
| 鬼（唯一の赤） | #cc1818 / #ff0040 |
| UI文字 | #00ff41 |
| フラッシュライト | #00ff88 (サイバー緑) |

■ レンダリング設定
```javascript
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000805);
scene.fog = new THREE.FogExp2(0x000a05, 0.014);
```

■ 照明
```javascript
// アンビエント
const ambient = new THREE.AmbientLight(0x002a14, 0.7);
scene.add(ambient);

// ヘミスフィア
const hemi = new THREE.HemisphereLight(0x004420, 0x000000, 0.5);
scene.add(hemi);

// 迷路内ランダムPointLight（35個）
for (let i = 0; i < 35; i++) {
    const colors = [0x00ff41, 0x00aaff, 0xff0040];
    const light = new THREE.PointLight(
        colors[Math.floor(Math.random() * colors.length)],
        0.5 + Math.random() * 1.5,
        8 + Math.random() * 12
    );
    light.position.set(randomMazeX(), 2.5, randomMazeZ());
    scene.add(light);
    // ちらつきアニメーション（update loop内で intensity を sine変動）
}
```

■ ステージ別照明変化
| Stage | フォグ密度 | PointLight数 | 備考 |
|-------|----------|-------------|------|
| 1     | 0.010    | 50          | 明るめ、入門用 |
| 2     | 0.012    | 40          | やや暗い |
| 3     | 0.014    | 30          | 標準 |
| 4     | 0.018    | 20          | かなり暗い |
| 5     | 0.022    | 10          | ほぼ暗闘 |
| ???   | 0.025    | 8           | 最暗。紫フォグ |

■ ステージ別ビジュアルテーマ
全ステージ共通: 緑サイバー基調（ネオンストライプ、グリッドライン、CRTオーバーレイ）を維持。
壁・床のカラー、装飾オブジェクト、環境音、PointLightの色傾向がステージごとに変わる。

【Stage 1: 地下研究所（サイバーラボ）】
・壁: 清潔感のあるサイバーパネル風（0x0a1a0e）、ネオン緑ストライプ多め
・床: 暗緑タイル（グリッドライン明るめ、opacity 0.06）
・装飾: 壁面に点滅するモニターパネル（MeshBasicMaterial、緑文字スクロール演出）【当たり判定なし: 壁面固定】
        通路の天井に蛍光灯風ライン（細長いPlane、#00ff41、opacity 0.15）【当たり判定なし】
        コーナーにサーバー端末風ボックス【当たり判定あり: 通路コーナーの障害物】
・PointLight色: 緑(70%) / シアン(30%)
・環境音: 空調のハム音（低周波ドローン）、電子音のビープ
・フォグ色: 0x000a05（標準緑）
※チュートリアルステージのため装飾は控えめ。障害物も少なく逃げ道を確保。

【Stage 2: 廃工場（錆びた機械・ギア）】
・壁: 錆びた金属風（0x1a150a）、ネオンストライプを減らしてオレンジ錆テクスチャ感
・床: 汚れたコンクリート風（0x0a0806）、グリッドラインを薄く（opacity 0.03）
        油染みの表現（床にランダムな暗色Plane、0x0a0600、opacity 0.3）
・装飾: 壊れた産業機械（BoxGeometry + CylinderGeometry群）【当たり判定あり: 通路脇の大型障害物】
        錆びた歯車オブジェクト（TorusGeometry、壁面固定、一部ゆっくり回転）【当たり判定なし: 壁面装飾】
        天井から垂れ下がるチェーン（Line、薄い金属色、微揺れ）【当たり判定なし】
        壊れたコンベアベルト（細長いBox、通路脇に配置）【当たり判定あり】
        蒸気噴出口（壁面の小さなBox、ランダムに白煙パーティクル噴出）【当たり判定なし】
・PointLight色: 緑(40%) / オレンジ(40%) / 赤(20%)
・環境音: 金属の軋み音、蒸気の噴出音（ランダム間隔）、歯車の回転音（低い唸り）
・フォグ色: 0x0a0804（やや茶色がかった暗色）

【Stage 3: 廃ビルオフィス（デスク・モニター）】
・壁: オフィス壁風（0x0e1a12）、壁紙が剥がれた表現（テクスチャ or パッチ色変え）
・床: カーペット風（0x060a08）、グリッドラインなし → 代わりにタイル模様
・装飾: 通路脇にデスク（BoxGeometry、天板 + 脚）【当たり判定あり】
        デスク上にモニター（薄型Box、画面面にMeshBasicMaterial 緑発光 or ノイズ）【当たり判定なし】
        倒れた椅子【当たり判定あり: 通路を部分的に狭める】
        散乱した紙（薄いPlane、床にランダム配置）【当たり判定なし】
・PointLight色: 緑(50%) / 白(30%) / シアン(20%)
・環境音: 蛍光灯のちらつき音、ガラスが割れる遠い音（ランダム）、風の音
・フォグ色: 0x060a08（オフィスの暗さ）

【Stage 4: 地下下水道（水滴り・湿気・パイプ）】
・壁: 湿ったコンクリート風（0x0a0e10）、下部が変色（グラデーション: 壁下1/3が暗い青緑）
・床: 水たまり表現（反射するPlane、envMap or 半透明レイヤー、0x030608）
・装飾: 天井・壁面に大型パイプ（CylinderGeometry、錆色 + 緑光ジョイント）【当たり判定なし: 壁面/天井固定】
        壁面から水滴パーティクル（BufferGeometry + Points、シアン微粒子、上から下へ流れる）
        通路に水たまりの反射光ゆらぎ（床PointLightのintensityをsine変動）
        地面に壊れたバルブ・配管部品【当たり判定あり: 小さな障害物】
・PointLight色: シアン(50%) / 緑(30%) / 青(20%)
・環境音: 水滴のポタポタ音（3Dポジショナル、ランダム位置）、水流音（遠い）、金属反響
・フォグ色: 0x040808（湿った青緑）

【Stage 5 FINAL: 崩壊データセンター（サーバーラック崩壊）】
・壁: 破損した金属壁（0x0e0a10）、ネオンストライプが断線風（途切れ途切れに点滅）
・床: 破損タイル（0x080608）、ケーブル模様のライン（赤と緑が混在、opacity 0.05）
・装飾: 倒れたサーバーラック（大型BoxGeometry）【当たり判定あり: 通路を部分的に狭める】
        天井から垂れ下がるケーブル束（Line、ランダムに揺れる）【当たり判定なし】
        スパーク演出（ランダム位置で火花パーティクル、オレンジ+白、短時間発生）
        壊れたモニター群（画面がノイズ or 赤警告テキスト）【当たり判定なし: 壁面固定】
        床に散乱したケーブル束【当たり判定あり: 通過時に速度低下（×0.7）】
・PointLight色: 赤(40%) / 緑(30%) / オレンジ(30%) — 警告色多め
・環境音: 電気のスパーク音、サーバーの冷却ファン異常音、崩落の遠い振動音
・フォグ色: 0x080408（暗い赤紫がかった色）

【隠しステージ ???: 異空間ラボ（紫エフェクト・歪んだ空間）】
・壁: 半透明パネル風（0x100818）、壁面が微妙に脈動（emissiveIntensityをsine変動）
・床: 暗い紫（0x060410）、グリッドラインが紫（#b450ff, opacity 0.06）
・装飾: 壁が呼吸するように膨張収縮（scale.x を 1.0〜1.02 でsine変動）
        空間の歪みエフェクト（ポストプロセスでバレルディストーション、微弱）
        浮遊する紫オーブ（SphereGeometry、半透明、ゆっくり回転しながら浮遊）【当たり判定なし】
        ランダムに壁が一瞬消える（0.5秒だけ透明化、幻覚演出）
        壊れた実験装置（BoxGeometry + CylinderGeometry）【当たり判定あり】
・PointLight色: 紫(60%) / マゼンタ(20%) / シアン(20%)
・環境音: 低周波の不協和音ドローン、逆再生風の環境音、心臓の鼓動音（常時微かに）
・フォグ色: 0x080410（紫フォグ）
・特殊: scene.fog を FogExp2 ではなく Fog にし、near/far をランダムに揺らす（視界が不安定）

■ 装飾オブジェクト配置・当たり判定ルール
迷路生成後、各ステージテーマに応じて装飾オブジェクトを自動配置する。

【配置ルール】
・装飾は「通路セル」にのみ配置（壁セルには置かない）
・当たり判定ありの装飾は通路幅の50%以下にする（完全封鎖しない）
・鬼AIのBFS経路上には当たり判定あり装飾を置かない（鬼が詰まるのを防止）
・装飾密度: 通路セル全体の10〜20%にランダム配置（ステージが進むほど増加）
・壁面固定の装飾（モニター、パイプ、歯車等）は密度制限なし

【当たり判定の種類】
| 種別 | 効果 | 例 |
|------|------|-----|
| BLOCK | 移動不可（壁と同じ扱い） | デスク、サーバーラック、機械 |
| SLOW | 通過可能だが速度低下（×0.7） | ケーブル束、散乱物 |
| NONE | 当たり判定なし（すり抜け） | 壁面装飾、天井装飾、パーティクル |

```javascript
// 装飾オブジェクト配置
function placeDecorations(maze, stageTheme, collisionMap) {
    const decorations = STAGE_DECORATIONS[stageTheme];
    const passableCells = getPassableCells(maze);
    const density = 0.10 + (stageTheme.stage - 1) * 0.025; // Stage1: 10%, Stage5: 20%

    for (const cell of passableCells) {
        if (Math.random() > density) continue;
        // BFS経路上チェック（鬼が通る主要経路を避ける）
        if (isOnCriticalPath(cell, maze)) continue;

        const deco = decorations[Math.floor(Math.random() * decorations.length)];
        const mesh = createDecoMesh(deco);
        mesh.position.set(cell.x * CELL_SIZE + CELL_SIZE/2, 0, cell.z * CELL_SIZE + CELL_SIZE/2);
        scene.add(mesh);

        if (deco.collision === 'BLOCK') {
            collisionMap[cell.x][cell.z] = true; // 壁扱い
        } else if (deco.collision === 'SLOW') {
            slowZones.push({ x: cell.x, z: cell.z, factor: 0.7 });
        }
    }
}
```

```javascript
// ステージテーマ設定
const STAGE_THEMES = {
    1: {
        name: '地下研究所',
        wallColor: 0x0a1a0e,
        floorColor: 0x050a06,
        fogColor: 0x000a05,
        fogDensity: 0.010,
        pointLightColors: [0x00ff41, 0x00ff41, 0x00ff41, 0x00aaff, 0x00aaff],
        pointLightCount: 50,
        gridOpacity: 0.06,
        neonStripeFrequency: 0.3,  // 壁の30%にストライプ
    },
    2: {
        name: '廃工場',
        wallColor: 0x1a150a,
        floorColor: 0x0a0806,
        fogColor: 0x0a0804,
        fogDensity: 0.012,
        pointLightColors: [0x00ff41, 0x00ff41, 0xff8800, 0xff8800, 0xff0040],
        pointLightCount: 40,
        gridOpacity: 0.03,
        neonStripeFrequency: 0.15,
    },
    3: {
        name: '廃ビルオフィス',
        wallColor: 0x0e1a12,
        floorColor: 0x060a08,
        fogColor: 0x060a08,
        fogDensity: 0.014,
        pointLightColors: [0x00ff41, 0x00ff41, 0xffffff, 0x00aaff],
        pointLightCount: 30,
        gridOpacity: 0,  // グリッドなし（タイル模様）
        neonStripeFrequency: 0.1,
    },
    4: {
        name: '地下下水道',
        wallColor: 0x0a0e10,
        floorColor: 0x030608,
        fogColor: 0x040808,
        fogDensity: 0.018,
        pointLightColors: [0x00aaff, 0x00aaff, 0x00ff41, 0x0044ff],
        pointLightCount: 20,
        gridOpacity: 0.03,
        neonStripeFrequency: 0.08,
    },
    5: {
        name: '崩壊データセンター',
        wallColor: 0x0e0a10,
        floorColor: 0x080608,
        fogColor: 0x080408,
        fogDensity: 0.022,
        pointLightColors: [0xff0040, 0xff0040, 0x00ff41, 0xff8800, 0xff8800],
        pointLightCount: 10,
        gridOpacity: 0.05,
        neonStripeFrequency: 0.12,  // 断線風に途切れる
    },
    hidden: {
        name: '異空間ラボ',
        wallColor: 0x100818,
        floorColor: 0x060410,
        fogColor: 0x080410,
        fogDensity: 0.025,
        pointLightColors: [0xb450ff, 0xb450ff, 0xb450ff, 0xff00ff, 0x00aaff],
        pointLightCount: 8,
        gridOpacity: 0.06,
        gridColor: 0xb450ff,  // 紫グリッド（緑ではない）
        neonStripeFrequency: 0.2,
        neonStripeColor: 0xb450ff,  // 紫ストライプ
    },
    scoreAttack: {
        name: '無限回廊',
        wallColor: 0x0a1a0e,
        floorColor: 0x050a06,
        fogColor: 0x000a05,
        fogDensity: 0.010,
        pointLightColors: [0x00ff41, 0x00aaff],
        pointLightCount: 50,
        gridOpacity: 0.06,
        neonStripeFrequency: 0.25,
        dynamic: true,  // 時間経過で環境変化
    }
};
```

■ マルチフロア描画
・全フロアの3Dメッシュを同時にシーンに配置する（非表示切替はしない）
・各フロアは y = floor * FLOOR_H の高さにオフセット
・天井メッシュで上のフロアの床を塞ぐ（覗き込み防止）
・プレイヤーのいるフロア以外のライトは intensity を下げる（パフォーマンス）
・階段付近では上下フロアが視覚的に見通せる（天井に穴が開いている）

■ 装飾エフェクト
・ワイヤーフレームエッジ + ネオンストライプ（壁面に薄緑の帯、MeshBasicMaterial, #00ff41, opacity 0.2）
・浮遊ダストパーティクル（BufferGeometry + Points、緑の微粒子）
・床グリッドライン（LineBasicMaterial, #00ff41, opacity 0.04）
・CRTスキャンラインオーバーレイ
```css
#crt-overlay {
    position: fixed; top:0; left:0; width:100%; height:100%;
    background: repeating-linear-gradient(
        0deg, transparent, transparent 2px,
        rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px
    );
    pointer-events: none; z-index: 1000;
}
```


================================
13. プレイヤー仕様
================================
■ 視点
・一人称視点（FPS）— 手なしPOV
・カメラ高さ: y = 1.7m
・自分のキャラクターモデルは一切表示しない（没入感・ホラー感の向上）
・マルチプレイ時、他プレイヤーからは自分のGLBモデルが見えている
・歩行時: 頭部ボブアニメーション
・スプリント時: FOV微増（60→70）+ ボブ加速

■ パラメータ
| 項目 | 値 |
|------|-----|
| 通常速度 | 4.5 m/s |
| スプリント速度 | 8.0 m/s |
| 階段上の速度 | 通常の0.8倍（3.6 / 6.4 m/s） |
| スタミナ | 100 |
| スタミナ消費 | 25/s（スプリント中） |
| スタミナ回復 | 12/s（通常時） |
| 当たり判定半径 | 0.3m |
| 捕獲判定距離 | 1.2m（鬼との距離がこれ以下で捕獲） |
| 現在フロア | GameState.player.currentFloor |

■ フラッシュライト
```javascript
const flashlight = new THREE.SpotLight(0x00ff88, 3, 30, 0.6, 0.3, 2);
flashlight.castShadow = true;
camera.add(flashlight);
camera.add(flashlight.target);
flashlight.target.position.set(0, 0, -1);
```

■ Pointer Lock
```javascript
document.addEventListener('click', () => {
    if (GameState.gameActive) {
        renderer.domElement.requestPointerLock();
    }
});
document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === renderer.domElement) {
        camera.rotation.y -= e.movementX * 0.002;
        camera.rotation.x -= e.movementY * 0.002;
        camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
    }
});
```


================================
14. 敵キャラクター（Mixamo GLBモデル）
================================
ステージごとに異なる鬼キャラクターをMixamo GLBモデルから読み込む。
暗闘の迷路内で不気味に動く存在。

■ ステージ別鬼モデル
| ステージ | ファイル | 説明 |
|---------|---------|------|
| Stage 1 | Hallin.glb | 鬼キャラ1 |
| Stage 2 | zombie.glb | ゾンビ型 |
| Stage 3 | Jolleen.glb | 鬼キャラ3 |
| Stage 4 | Mutant.glb | ミュータント型 |
| Stage 5 | CH45.glb | ロボット型 |
| スコアアタック | Skeletonzombi.glb | スケルトンゾンビ |
| 隠しステージ | Skeletonzombi.glb | エフェクト変更で差別化 |

■ 鬼モデル読み込みコード
```javascript
const loader = new THREE.GLTFLoader();

function loadOniModel(stageNum) {
    const oniFiles = {
        1: 'Hallin.glb',
        2: 'zombie.glb',
        3: 'Jolleen.glb',
        4: 'Mutant.glb',
        5: 'CH45.glb',
        scoreAttack: 'Skeletonzombi.glb',
        hidden: 'Skeletonzombi.glb'
    };
    
    return new Promise((resolve, reject) => {
        loader.load(oniFiles[stageNum], (gltf) => {
            const model = gltf.scene;
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    // 赤い発光マテリアルに変更（暗所視認性確保）
                    child.material.emissive = new THREE.Color(0x330000);
                    child.material.emissiveIntensity = 0.15;
                }
            });
            resolve(model);
        }, undefined, reject);
    });
}
```

■ 暗所での視認性対策
```javascript
// 鬼モデルに追加するライト
function addOniLights(oniGroup) {
    // 体内発光
    const innerLight = new THREE.PointLight(0xff2020, 1.5, 4);
    innerLight.position.set(0, 1.1, 0);
    oniGroup.add(innerLight);

    // 頭上ライト
    const headLight = new THREE.PointLight(0xff2020, 3, 18);
    headLight.position.set(0, 2.5, 0);
    oniGroup.add(headLight);

    // 胴体ライト
    const bodyLight = new THREE.PointLight(0xff1010, 2, 12);
    bodyLight.position.set(0, 1.2, 0.3);
    oniGroup.add(bodyLight);
}
```

■ アニメーション
・Walking.glb / Running.glb / Idle.glb をAnimationMixerで再生
・常にプレイヤー方向を向く
```javascript
oniGroup.rotation.y = Math.atan2(
    player.position.x - oniGroup.position.x,
    player.position.z - oniGroup.position.z
);
```


================================
15. 敵AI
================================
■ パスファインディング
・BFS（幅優先探索）をマルチフロア対応に拡張
・ノード: (x, z, floor) の3次元
・階段セルでフロア間の接続を探索
・経路再計算間隔: 0.5秒

■ パラメータ
| 項目 | 値 |
|------|-----|
| 基本速度 | 3.2 m/s |
| ステージ倍率 | ×1.0 〜 ×1.5 |
| 経路再計算 | 0.5秒ごと |
| 壁通り抜け | 不可 |
| 階段移動 | 可（速度0.7倍に低下） |

■ 複数鬼の分散追跡
・鬼が複数いる場合、同じセルに集まらないよう分散
・ターゲット: 最寄りのプレイヤー（マルチ時は別プレイヤーを分担）
・マルチフロア時: 鬼は異なるフロアにまたがって分散配置

■ マルチフロアBFS
```javascript
function bfsPathfind3D(floors, start, goal) {
    // start/goal = { x, z, floor }
    const queue = [start];
    const visited = new Set();
    const parent = {};
    visited.add(key3D(start));

    while (queue.length > 0) {
        const current = queue.shift();
        if (current.x === goal.x && current.z === goal.z && current.floor === goal.floor) {
            return reconstructPath3D(parent, start, goal);
        }

        // 同一フロアの隣接セル
        for (const neighbor of getPassableNeighbors(floors[current.floor], current)) {
            const node = { x: neighbor.x, z: neighbor.z, floor: current.floor };
            const k = key3D(node);
            if (!visited.has(k)) {
                visited.add(k);
                parent[k] = current;
                queue.push(node);
            }
        }

        // 階段による別フロアへの接続
        const cell = floors[current.floor][current.z][current.x];
        if (cell && cell.isStairs) {
            const conn = cell.connectsTo;
            const stairNode = { x: conn.x, z: conn.z, floor: conn.floor };
            const k = key3D(stairNode);
            if (!visited.has(k)) {
                visited.add(k);
                parent[k] = current;
                queue.push(stairNode);
            }
        }
    }
    return []; // no path
}

function key3D(node) {
    return `${node.floor}-${node.x}-${node.z}`;
}
```

■ 鬼のY座標制御
```javascript
function updateOniY(oni, grid, path) {
    // プレイヤーと同じロジックでY座標を計算
    const cell = grid[oni.currentFloor][oni.cellZ][oni.cellX];
    if (cell && cell.isStairs) {
        const progress = getStairProgress(oni.position, cell.direction);
        const fromY = oni.currentFloor * FLOOR_H;
        const toY = cell.connectsTo.floor * FLOOR_H;
        oni.group.position.y = fromY + (toY - fromY) * progress;
        if (progress >= 1.0) {
            oni.currentFloor = cell.connectsTo.floor;
        }
    } else {
        oni.group.position.y = oni.currentFloor * FLOOR_H;
    }
}
```

■ 壁衝突判定
```javascript
function canMove(x, z, floor, grid) {
    const cellX = Math.floor(x / CL);
    const cellZ = Math.floor(z / CL);
    return !isWallAt(cellX, cellZ, grid[floor]);
}
```


================================
16. HUD構成
================================
■ 画面レイアウト（日本語設定時）

```
┌──────────────────────────────────────────┐
│      ステージ 2 — 脱出せよ                │ ← 上部中央
├──────────────────────────────────────────┤
│                                          │
│            【3Dゲーム画面】                │
│  [状態: 逃走中]                           │ ← 左上
│  [フロア: 2F]                             │ ← マルチフロア時のみ
│  [目標: 出口を探せ — 28.5m]              │ ← 脱出時のみ
│  [スタミナ: ████████░░]                   │
│  [残り: 01:15]                           │
│                                          │
│                     [敵: 12.3m 前方] ← 右上（色変化）
│                     [♥ 心拍: 120]         │
│                                          │
│          ⊕ (クロスヘア)                   │ ← 中央
│                                          │
│  ※鬼が6m以内 → 画面枠が赤く点滅          │
│                                          │
│   ┌──────┐                        ┌───┐  │
│   │MINIMAP│ 150×150               │🤖│  │ ← 右下 AIサポートアイコン
│   │ ★=EXIT│ (脱出ステージ時)       └───┘  │   ON時: 吹き出し表示
│   │ ▲=階段│ (マルチフロア時)              │
│   └──────┘ ← 左下                        │
│                                          │
├──────────────────────────────────────────┤
│ [P1:あなた] [P2:GUEST1] [P3:☠] [P4:待機]│ ← マルチ時のみ
└──────────────────────────────────────────┘
```

■ HUD要素詳細

| 位置 | 要素 | 英語 | 日本語 |
|------|------|------|--------|
| 左上 | ステータス | STATUS: RUNNER / GAME OVER | 状態: 逃走中 / 逃走失敗 |
| 左上 | 現在フロア | FLOOR: 1F / 2F / 3F | フロア: 1F / 2F / 3F |
| 左上 | スタミナバー | STAMINA | スタミナ |
| 左上 | タイマー | TIME: 00:47 | 残り: 00:47 |
| 左上 | 目標表示 | OBJ: FIND EXIT — 28.5m | 目標: 出口を探せ — 28.5m |
| 右上 | 最寄り鬼距離 | ENEMY: 18.4m BEHIND | 敵: 18.4m 後方 |
| 右上 | 鬼方向 | AHEAD / LEFT / RIGHT / BEHIND | 前方 / 左 / 右 / 後方 |
| 右上 | 心拍BPM | ♥ BPM: 84 | ♥ 心拍: 84 |
| 左下 | ミニマップ | （言語非依存） | （言語非依存） |
| 中央 | クロスヘア | （言語非依存） | （言語非依存） |
| 画面枠 | 危険警告 | （言語非依存） | （言語非依存） |
| 上部中央 | ステージ名 | STAGE 1 — ESCAPE | ステージ 1 — 脱出せよ |
| 右下 | AIサポート | （セクション16B参照） | （セクション16B参照） |

※HUDテキストはすべて GameState.language ('ja' | 'en') に連動して切り替わる。
※言語切替はタイトル画面フッターまたはポーズメニューで変更可能。

```javascript
const HUD_TEXT = {
    ja: {
        status_runner: '状態: 逃走中',
        status_caught: '状態: 逃走失敗',
        floor: 'フロア',
        stamina: 'スタミナ',
        time: '残り',
        obj_survive: '目標: 出口を探せ',
        obj_exit: '目標: 出口を探せ',
        enemy: '敵',
        dir_ahead: '前方', dir_left: '左', dir_right: '右', dir_behind: '後方',
        bpm: '♥ 心拍',
        stage: 'ステージ',
        survive: '脱出せよ',
        escape: '脱出せよ',
        caught_big: '逃走失敗',       // 捕獲演出Phase4の大文字表示
        spectating: '観戦中',
    },
    en: {
        status_runner: 'STATUS: RUNNER',
        status_caught: 'STATUS: GAME OVER',
        floor: 'FLOOR',
        stamina: 'STAMINA',
        time: 'TIME',
        obj_survive: 'OBJ: FIND EXIT',
        obj_exit: 'OBJ: FIND EXIT',
        enemy: 'ENEMY',
        dir_ahead: 'AHEAD', dir_left: 'LEFT', dir_right: 'RIGHT', dir_behind: 'BEHIND',
        bpm: '♥ BPM',
        stage: 'STAGE',
        survive: 'ESCAPE',
        escape: 'ESCAPE',
        caught_big: 'GAME OVER',
        spectating: 'SPECTATING',
    }
};
```

■ フォント
```
font-family: 'Courier New', monospace;
color: #00ff41;
```

■ 危険フレーム（2段階）

【黄色フレーム — 接近警告（12m〜6m）】
・鬼が12m以内に入ると画面枠が黄色に発光
・近づくほど発光が強くなる

【赤色フレーム — 追跡警告（6m以内）】
・鬼が6m以内に入ると画面枠が赤色に発光（黄色から切り替わる）
・近づくほど発光が強くなり、点滅が速くなる

```javascript
function updateDangerFrame(distanceToOni) {
    const frame = document.getElementById('danger-frame');

    if (distanceToOni < 6) {
        // 赤フレーム — 追跡状態（6m以内）
        const intensity = 1 - (distanceToOni / 6);
        const alpha = 0.3 + intensity * 0.5;
        const spread = 40 + intensity * 60;
        frame.style.boxShadow = `inset 0 0 ${spread}px rgba(255, 0, 0, ${alpha})`;
        frame.style.display = 'block';
        // 3m以内で点滅追加
        if (distanceToOni < 3) {
            frame.style.animation = 'danger-pulse 0.3s infinite alternate';
        } else {
            frame.style.animation = 'none';
        }
    } else if (distanceToOni < 12) {
        // 黄色フレーム — 接近警告（12m〜6m）
        const intensity = 1 - ((distanceToOni - 6) / 6);
        const alpha = 0.15 + intensity * 0.35;
        const spread = 20 + intensity * 40;
        frame.style.boxShadow = `inset 0 0 ${spread}px rgba(255, 200, 0, ${alpha})`;
        frame.style.display = 'block';
        frame.style.animation = 'none';
    } else {
        // 安全（12m以上）
        frame.style.display = 'none';
        frame.style.animation = 'none';
    }
}

// CSS
// @keyframes danger-pulse {
//     0%   { opacity: 0.6; }
//     100% { opacity: 1.0; }
// }
```

■ 心拍BPM計算
```javascript
function calculateBPM(distanceToOni) {
    const maxDist = 30;
    const minBPM = 72;
    const maxBPM = 160;
    const ratio = Math.max(0, 1 - distanceToOni / maxDist);
    return Math.round(minBPM + (maxBPM - minBPM) * ratio);
}
```


================================
16B. AIサポートシステム
================================
ゲーム中にAIがプレイヤーにアドバイスやヒントを提供するオプション機能。
初心者の補助やホラー演出の緩和に使える。デフォルトはOFF。

■ 有効化方法（2通り）
1. タイトル画面の設定（ルール説明モーダル内 or 別途設定画面）
   → 「AIサポート: ON / OFF」トグル
2. ゲーム中にHUD右下のAIアイコンをクリック/タップ
   → アイコン押下でON/OFF切替（即時反映）

■ HUD表示
・アイコン位置: 画面右下（ミニマップの対角）
・アイコン: 🤖 マーク（半透明、ネオン緑枠）
・ON時: アイコンが発光 + 吹き出しが表示される
・OFF時: アイコンがグレーアウト（opacity: 0.3）
・pointer-events: auto（HUD内で唯一クリック可能な要素）

■ AIサポートメッセージ（吹き出し表示）
ON時、状況に応じてHUD右下にメッセージ吹き出しが表示される。
3〜5秒で自動フェードアウト。同時に1メッセージまで。

【トリガー条件と表示メッセージ（日本語 / 英語）】
| 条件 | 日本語 | 英語 |
|------|--------|------|
| ゲーム開始時 | 「まずは周囲を確認しよう」 | "Look around first" |
| 鬼が15m以内に接近 | 「敵が近づいている、注意！」 | "Enemy approaching, be careful!" |
| 鬼が8m以内 | 「逃げろ！横道に入れ！」 | "Run! Take a side path!" |
| スタミナ20%以下 | 「スタミナが少ない、温存しよう」 | "Low stamina, conserve it" |
| 30秒間同じエリア | 「この辺は探索済み、別の道へ」 | "Area explored, try another path" |
| 出口方向（脱出ステージ）| 「出口はこの方向だ →」 | "Exit is this way →" |
| 残り時間15秒 | 「あと少し、耐えろ！」 | "Almost there, hold on!" |
| 捕獲直後（リザルト）| 「次はもっと逃げ切れる」 | "You'll escape next time" |

■ GameState連携
```javascript
GameState.settings.aiSupport = false;  // デフォルトOFF

function toggleAISupport() {
    GameState.settings.aiSupport = !GameState.settings.aiSupport;
    updateAISupportIcon();
}

function showAIMessage(key) {
    if (!GameState.settings.aiSupport) return;
    const lang = GameState.language;
    const msg = AI_MESSAGES[lang][key];
    if (!msg) return;
    displayBubble(msg);  // 右下吹き出し表示、3〜5秒後フェードアウト
}
```

■ 注意事項
・AIサポートは純粋なUIヒント機能。AI APIは呼ばない（ローカル判定のみ）
・マルチプレイ時は個人設定（他プレイヤーには見えない）
・スコアアタックモードではAIサポート無効（公平性のため）


================================
17. ゲームループ
================================
■ メインループ（requestAnimationFrame / 60fps）
```
1. 入力状態チェック（moveForward/Backward/Left/Right, sprint）
2. スタミナ更新（スプリント消費 / 回復）
3. 移動SE更新（歩行/スプリント/疲労/停止 → FootstepManager）
4. プレイヤー位置更新（速度 × deltaTime、壁衝突判定、階段上は速度0.8倍）
5. プレイヤーY座標更新（updatePlayerY: フロア床高 or 階段補間）
6. プレイヤー現在フロア判定（階段通過でフロア切替）
7. カメラ位置・回転更新
8. フラッシュライト追従
9. 頭部ボブアニメーション（歩行ボブ / スプリント加速）
10. 各鬼のAI更新（マルチフロアBFS再計算、移動、壁判定）
11. 各鬼のY座標更新（updateOniY: フロア間移動）
12. 各鬼の歩行アニメーション更新
13. 鬼の足音更新（距離→音量・テンポ・パン。別フロアの鬼は音量減衰）
14. 鬼の向き更新（プレイヤー方向を向く）
15. 捕獲判定（同一フロア かつ 鬼との距離 < 1.2m）
16. 脱出判定（EXITとの距離 < 2m かつ 同一フロア、脱出ステージのみ）
17. EXITワープ判定（Stage 5: 30秒ごと）
18. HUD更新（スタミナ、タイマー、距離、BPM、目標、フロア表示）
19. ミニマップ描画（現在フロアのみ表示、階段マーカー▲付き）
20. 危険フレーム更新
21. ライトちらつきアニメーション
22. ダストパーティクル更新
23. フォグ・照明のステージ別パラメータ適用
24. Three.js描画（renderer.render(scene, camera)）
25. AIサポートメッセージ判定（ON時のみ: 距離/スタミナ/時間トリガー）
26. 環境音更新（AmbientSoundManager — スコアアタック時は時間経過でレイヤー追加）
27. マルチプレイ同期（position/rotation書き込み、他プレイヤー位置読み取り、50msスロットル）
28. 協力モード: 近接バフ判定（味方8m以内→スタミナ回復×1.5）、ピンマーカー表示更新
29. チーム戦: ゾーンレーダー更新（鬼側、20秒間隔）、チームカラーHUD更新
```

■ 当たり判定（捕獲）
```javascript
function checkCatch(playerPos, playerFloor, oniList) {
    for (const oni of oniList) {
        // 同一フロアのみ捕獲判定
        if (oni.currentFloor !== playerFloor) continue;
        const dist = playerPos.distanceTo(oni.position);
        if (dist < 1.2) {
            return true; // 捕獲
        }
    }
    return false;
}
```


================================
18. スコア・リザルト
================================
■ スコア計算（スコアアタックモード）
```javascript
function updateScore(deltaTime, oniPositions, playerPos) {
    // 生存時間スコア: 1点/秒
    GameState.score += deltaTime;

    // 近接回避ボーナス
    for (const oni of oniPositions) {
        const dist = playerPos.distanceTo(oni);
        if (dist < 6 && !oni.wasClose) {
            oni.wasClose = true;
        } else if (dist >= 6 && oni.wasClose) {
            oni.wasClose = false;
            GameState.score += 10; // 近接回避ボーナス
            showFloatText('+10 CLOSE CALL!');
        }
    }
}
```

■ リザルト画面

【ストーリーモード — クリア（脱出成功）】
```
ESCAPED! / 脱出成功！
EXIT FOUND IN: 01:05.8
NEXT STAGE →
```

【ストーリーモード — 捕獲】
```
逃走失敗 / GAME OVER
STAGE: 3
TIME: 01:12.5
[リトライ]  [タイトルに戻る]
```

【ストーリーモード — 時間切れ】
```
TIME UP
EXIT NOT FOUND
STAGE: 4
[リトライ]  [タイトルに戻る]
```

【ストーリーモード — 全ステージクリア】
```
CONGRATULATIONS
ALL STAGES CLEARED!
TOTAL TIME: 05:23.8
[ランキング登録完了]
[タイトルに戻る]
```

【スコアアタック】
```
GAME OVER
SCORE: 1,234
SURVIVAL TIME: 03:45.2
MAX STAGE REACHED: 4
[ランキング登録完了]
[もう一度プレイ]  [タイトルに戻る]
```

【マルチ: 個人戦リザルト（最終）】
```
GAME SET!
WINNER: P1 (ユーザーネーム) — 38pt

1st  P1  38pt  ★
2nd  P3  27pt
3rd  P2  15pt
4th  P4   8pt

[再戦]  [タイトルに戻る]
```


================================
19. マルチプレイ仕様
================================
■ ルーム管理（LINKED BLOCKS_ / FALL DODGE 同等方式）
・ルームID: 6文字ランダム英数字（自動生成）
・最大4人
・1ID = 1ルーム
・ルームURL: https://[host]/MAZE-HUNT/?room=XXXXXX
・URLコピー共有 → 相手がURLを開くと自動ルーム参加
・ルームIDを直接入力して参加も可能

■ ロビー画面（モーダル形式）
```
┌──────────────────────────────────┐ ×
│  MULTIPLAYER                      │
│                                   │
│  ROOM ID                          │
│  ┌─────────────────────────┐      │
│  │ ルームIDを入力...        │      │
│  └─────────────────────────┘      │
│  同じルームIDを入力したプレイヤー  │
│  同士がマッチングします            │
│                                   │
│  対戦モード                       │
│  ┌──────┐ ┌──────┐ ┌──────┐     │
│  │個人戦 │ │チーム戦│ │ 協力 │     │
│  └──────┘ └──────┘ └──────┘     │
│                                   │
│  ┌─────────────────────────┐      │
│  │      ルームに参加        │      │
│  └─────────────────────────┘      │
│  ┌─────────────────────────┐      │
│  │      キャンセル          │      │
│  └─────────────────────────┘      │
└──────────────────────────────────┘
```

■ ロビー待機画面
```
ONLINE ROOM // ルームID: XXXXXX
LINK: https://[host]/MAZE-HUNT/?room=XXXXXX  [コピー]
モード: 個人戦

  P1: YOU          ← ピンク枠
  P2: GUEST 1      ← シアン枠
  P3: 待機中...     ← dim表示
  P4: 待機中...     ← dim表示

[ゲーム開始]  ← ホストのみ、2人以上で有効化
```

■ ロビー待機画面（チーム戦選択時 — 追加表示）
```
ONLINE ROOM // ルームID: XXXXXX
LINK: https://[host]/MAZE-HUNT/?room=XXXXXX  [コピー]
モード: チーム戦

  🔴 鬼チーム（赤）
    P1: YOU        ← 赤枠
    (空き)          ← 赤枠 dim

  🔵 逃げチーム（青）
    P2: GUEST 1    ← 青枠
    P3: GUEST 2    ← 青枠

  ※ドラッグ&ドロップでチーム移動（ホストのみ）
  ※各ステージで攻守交替します

[ゲーム開始]  ← ホストのみ、2人以上で有効化
```

■ 同期方式
・ホスト（ルーム作成者）: 鬼AIのロジック、タイマーを実行
・ホストがFirebaseに oniPositions / gameTimer を書き込み
・ゲスト: oniPositions をリアルタイム監視して描画
・各プレイヤーは自分の position(x,y,z) + rotation.y をFirebaseに書き込み
・捕獲判定は各クライアントがローカル実行 → 捕獲時 alive: false に更新
・位置同期throttle: 50ms（負荷軽減）
・チーム戦: 鬼側プレイヤーの位置は通常プレイヤーと同じ方式で同期
  （CPU鬼のoniPositionsは使用しない。代わりにplayers配列のrole='oni'を参照）

■ 勝敗判定
・個人戦: 5ステージの累計ポイントで最終順位決定（最速脱出: 10pt, 2位: 6pt, 3位: 3pt, 4位: 1pt, 捕獲/時間切れ: 0pt）
・チーム戦: 逃げ側全員捕獲 → 鬼側勝利 / 制限時間内に1人でも逃げ切り → 逃げ側勝利
  各ステージで攻守交替（2ラウンド）。生存人数 → 生存時間合計で勝ちチーム決定。5ステージの累計ポイントで最終勝者
・協力: 1人でも脱出すればステージクリア。全員捕獲 or 時間切れでステージ失敗（リトライ）。次ステージで全員復活

■ マルチ時の3D表示
・他プレイヤーは三人称の全身モデル（棒人間 or 簡易キャラ）で表示
・プレイヤーカラーで区別（ピンク/シアン/イエロー/パープル）
・捕獲されたプレイヤーは半透明+グレーアウト → 観戦モードへ

■ URL自動参加
```javascript
function checkRoomURL() {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('room');
    if (roomId) {
        autoJoinRoom(roomId);
    }
}
function generateRoomURL(roomId) {
    return window.location.origin + window.location.pathname + '?room=' + roomId;
}
function copyRoomURL(roomId) {
    navigator.clipboard.writeText(generateRoomURL(roomId));
    showToast('URLをコピーしました');
}
```


================================
20. マルチ対戦：退席（強制離脱）仕様
================================
■ 退席検知
発生条件：
・アプリ完全離脱
・通信切断
・ブラウザ／タブ終了

■ 退席通知表示
・退席プレイヤー名をネオンレッドで強調表示
・「〇〇さんが退席しました」
・画面中央寄り、約2秒で自動フェードアウト
・警告系SE再生

■ 退席時の処理
・残りプレイヤーが1人 → 自動勝利
・残りプレイヤーが2人以上 → ゲーム続行（退席者は除外）

■ IDロック
・ルーム存続中は常にIDロック維持
・全員退出で初めてID解放


================================
21. 捕獲演出
================================
■ 捕獲シーケンス（鬼がプレイヤーに接触 → 約4秒間の演出）

【Phase 1: 衝撃（0〜0.5秒）】
・画面全体に赤フラッシュ（0.3秒）
・画面振動（カメラ揺れ、大きめに5フレーム）
・被弾SE再生（重い衝撃音 + 短い叫び声風ノイズ）
・心拍BPMが一瞬MAX(200)に跳ね上がる
・操作入力を即座にロック（移動・視点操作不可）

【Phase 2: 鬼の顔アップ（0.5〜2.0秒）】
・カメラが強制的に鬼の方向を向く（Lerp回転、0.3秒で完了）
・鬼モデルがカメラに向かって急接近（距離1.2m → 0.3mまで、0.5秒）
・鬼の目（PointLight赤）が一瞬強く発光（intensity: 2→8）
・鬼のアニメーション: 腕を伸ばす→掴みかかるモーション
・FOVが急激に狭まる（60→40）: 視野が狭まり鬼しか見えない圧迫感
・画面枠の赤フレームが最大強度で常時点灯
・BGMが不協和音に変化（ピッチダウン）
・心拍音が乱れて停止

```javascript
// Phase 2: 鬼の顔アップ
function playCaptureCloseup(camera, oniModel, duration = 1.5) {
    const startTime = performance.now();
    const startFOV = camera.fov;
    const targetFOV = 40;
    const oniStartPos = oniModel.position.clone();
    const oniTargetPos = camera.position.clone()
        .add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(0.3));

    function animate() {
        const elapsed = (performance.now() - startTime) / 1000;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic

        // カメラを鬼の方向に強制回転
        const lookTarget = oniModel.position.clone();
        lookTarget.y = camera.position.y;
        camera.lookAt(lookTarget);

        // 鬼がカメラに迫る
        oniModel.position.lerpVectors(oniStartPos, oniTargetPos, eased);

        // FOV狭める
        camera.fov = THREE.MathUtils.lerp(startFOV, targetFOV, eased);
        camera.updateProjectionMatrix();

        // 鬼の目の発光
        if (oniModel.eyeLight) {
            oniModel.eyeLight.intensity = 2 + eased * 6;
        }

        if (t < 1) requestAnimationFrame(animate);
    }
    animate();
}
```

【Phase 3: 引きずり暗転（2.0〜3.5秒）】
・カメラが後方に引きずられるように移動（プレイヤー位置から後方2m、下方0.5mへ）
・カメラが上を向く（地面に倒れて引きずられる視点）→ 天井と鬼の足が見える
・画面全体にビネット（黒い枠）が徐々に閉じていく（opacity: 0→0.9）
・鬼の足音が近距離で大きく鳴り続ける
・環境音がローパスフィルタで遠のいていく（freq: 2000→200）
・引きずり音SE（コンクリートを擦る低い摩擦ノイズ）

```javascript
// Phase 3: 引きずり暗転
function playCaptureDrag(camera, duration = 1.5) {
    const startTime = performance.now();
    const startPos = camera.position.clone();
    const dragOffset = new THREE.Vector3(0, -0.5, 2); // 後方2m、下方0.5m
    const dragTarget = startPos.clone().add(
        dragOffset.applyQuaternion(camera.quaternion)
    );
    const vignette = document.getElementById('capture-vignette');

    function animate() {
        const elapsed = (performance.now() - startTime) / 1000;
        const t = Math.min(elapsed / duration, 1);
        const eased = t * t; // easeInQuad（加速する引きずり感）

        // カメラを後方下方に移動
        camera.position.lerpVectors(startPos, dragTarget, eased);

        // 上を向く（天井を見る）
        camera.rotation.x = THREE.MathUtils.lerp(0, Math.PI * 0.3, eased);

        // ビネット暗転
        vignette.style.opacity = eased * 0.9;

        // 環境音フィルタ（ローパスで遠のく）
        if (captureFilter) {
            captureFilter.frequency.value = 2000 - eased * 1800;
        }

        if (t < 1) requestAnimationFrame(animate);
    }
    animate();
}
```

【Phase 4: 暗転→結果（3.5〜4.0秒）】
・画面完全暗転（黒、0.5秒）
・「逃走失敗 / GAME OVER」テキスト中央表示（ネオンレッド発光）
  — 日本語: 「逃走失敗」 / 英語: 「GAME OVER」
・テキストが赤く脈動（opacity: 0.8↔1.0）
・1.5秒後にゲームオーバー画面 or 観戦モードへ遷移

```css
/* 捕獲ビネット */
#capture-vignette {
    position: fixed; top: 0; left: 0;
    width: 100%; height: 100%;
    background: radial-gradient(ellipse at 50% 50%, transparent 20%, rgba(0,0,0,0.95) 80%);
    opacity: 0;
    pointer-events: none;
    z-index: 60;
    transition: opacity 0.1s;
}

/* 逃走失敗 / GAME OVER テキスト */
#caught-text {
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    font-family: 'Creepster', cursive;
    font-size: 72px;
    color: #ff2020;
    text-shadow: 0 0 20px #ff0000, 0 0 60px rgba(255,0,0,0.5);
    opacity: 0;
    z-index: 70;
    animation: caughtPulse 0.5s ease-in-out infinite alternate;
}

@keyframes caughtPulse {
    0%   { opacity: 0.8; text-shadow: 0 0 20px #ff0000, 0 0 60px rgba(255,0,0,0.5); }
    100% { opacity: 1.0; text-shadow: 0 0 30px #ff0000, 0 0 80px rgba(255,0,0,0.7); }
}
```

■ 捕獲演出の全体タイムライン
```
0.0s  ─ 赤フラッシュ + 衝撃SE + カメラ揺れ
0.5s  ─ カメラ強制回転 → 鬼が顔面に迫る + FOV狭まる
2.0s  ─ 引きずり開始 → カメラ後退+下降 + ビネット暗転
3.5s  ─ 完全暗転 →「逃走失敗 / GAME OVER」テキスト表示
4.0s  ─ ゲームオーバー画面 or 観戦モードへ
```

■ 観戦モード（マルチ）
・捕獲後、他の生存プレイヤーの視点を切替可能
・画面上部に「SPECTATING: P2」バッジ表示（日本語:「観戦中: P2」）
・操作不可


================================
22. 画面遷移
================================
```
[splash-screen]（キャッチコピー）
    ↓ 2.5秒 or タップ
[title-screen]
    ├→ [rule-modal]           ルール説明
    ├→ [ranking-modal]        ランキング（ストーリー/スコアアタック/マルチ/協力タブ）
    ├→ [story-mode]           ストーリーモード
    │     ↓ ステージ選択（解放済みのみ）
    │   [game-screen]          ゲーム（制限時間付き脱出）
    │     ├→ 脱出成功 → [escape-clear] "ESCAPED!" → 次ステージ
    │     ├→ 捕獲 → [game-over] → リトライ or タイトル
    │     ├→ 時間切れ → [game-over] "TIME UP" → リトライ
    │     └→ 全ステージクリア → [all-clear]
    ├→ [score-attack]         スコアアタック
    │     ↓ 即開始
    │   [game-screen]          ゲーム → [result-screen] → ランキング
    └→ [lobby-modal]          マルチプレイ
          ↓ ルーム参加
        [lobby-screen]         待機
          ↓ 全員揃い＋開始
        [game-screen]          ゲーム
            ↓ GAME SET
        [result-screen]
            ├→ [game-screen]   再戦
            └→ [title-screen]  タイトルへ
```


================================
23. 状態管理（GameState）
================================
```javascript
const GameState = {
    // 画面
    currentScreen: 'splash',

    // ゲーム
    gameMode: 'story',         // 'story'|'scoreAttack'|'freeForAll'|'teamBattle'|'coop'
    gameActive: false,
    currentStage: 1,
    stageType: 'escape',        // 全ステージ脱出統一
    stageTimeLimit: 60,         // 秒
    stageTimeRemaining: 60,
    score: 0,

    // 脱出ステージ
    exitPosition: null,         // { x, z } — 脱出ステージ時のみ
    exitFloor: 0,               // 出口のフロア（Stage 4: 1, Stage 5: 2）
    exitReached: false,
    exitDistance: Infinity,
    exitBlinking: false,        // Stage 5: ワープ前点滅

    // プレイヤー
    playerPosition: { x: 0, y: 1.7, z: 0 },
    playerRotationY: 0,
    playerCurrentFloor: 0,          // 現在フロア（0始まり）
    moveForward: false,
    moveBackward: false,
    turnLeft: false,
    turnRight: false,
    sprint: false,
    stamina: 100,
    moveSpeed: 4.5,
    sprintSpeed: 8.0,
    alive: true,

    // 鬼
    oniList: [],                // [{position, path, speed, animState, currentFloor}]
    oniBaseSpeed: 3.2,
    oniSpeedMultiplier: 1.0,
    catchDistance: 1.2,

    // 迷路
    mazeFloors: null,           // [floor0Grid, floor1Grid, ...] — マルチフロア
    mazeGrid: null,             // 後方互換（1Fのみの場合はこちらも使える）
    mazeCols: 10,
    mazeRows: 10,
    mazeNumFloors: 1,           // フロア数（1〜3）
    cellSize: 4,
    wallHeight: 3.5,
    floorHeight: 4,             // FLOOR_H: フロア間の高さ
    stairs: [],                 // [{fromFloor, toFloor, x, z, direction}]

    // HUD
    nearestOniDistance: Infinity,
    nearestOniDirection: 'AHEAD',
    currentBPM: 72,
    dangerLevel: 0,             // 0〜1

    // マルチプレイ
    roomId: null,
    playerIndex: null,
    isHost: false,
    players: {},                // {0: {position, rotationY, alive, score,...}, ...}
    maxPlayers: 4,

    // チーム戦専用
    teamBattle: {
        teamA: [0, 2],         // P1, P3 のプレイヤーインデックス
        teamB: [1, 3],         // P2, P4
        oniTeam: 'A',          // 'A' | 'B' — 鬼側チーム
        runnerTeam: 'B',       // 'A' | 'B' — 逃げ側チーム
        swapRounds: false,     // 攻守交替モード
        currentRound: 1,       // 現在ラウンド（1 or 2）
        roundResults: [],      // [{oniTeam, catchTime, allCaught}]
        isOniPlayer: false,    // 自分が鬼側かどうか
    },

    // サウンド
    bgmEnabled: true,
    seEnabled: true,
    footstepState: 'idle',      // 'idle' | 'walk' | 'sprint' | 'exhausted'

    // ユーザー
    username: null,
    isGuest: false,
    deviceId: null,
    language: 'ja',             // 'ja' | 'en' — タイトル画面のフッターで切替
    aiSupport: false,           // AIサポート ON/OFF — デフォルトOFF（セクション16B参照）
    storyClearedStage5: false,  // Stage 5クリア済みフラグ
    hiddenStageUnlocked: false, // 隠しステージ解放フラグ

    // アニメーション
    animationId: null,
};
```


================================
24. Firebase設定
================================
■ データ構造
```javascript
{
  "users": {
    "<username>": {
      "deviceId": "xxx",
      "createdAt": timestamp,
      "stats": {
        "plays": 50,
        "storyCleared": false,
        "storyClearedStage5": false,
        "hiddenStageUnlocked": false,
        "bestScoreAttack": 1234,
        "bestStage": 4
      }
    }
  },
  "rankings": {
    "<pushId>": {
      "username": "NAME",
      "score": 1234,
      "gameMode": "scoreAttack",
      "maxStage": 4,
      "survivalTime": 225,
      "timestamp": timestamp
    }
  },
  "rooms": {
    "<roomId>": {
      "status": "waiting",     // 'waiting'|'playing'|'finished'
      "gameMode": "freeForAll",
      "currentStage": 1,
      "maxStages": 5,          // 全マルチモード共通: 5ステージ制
      "players": {
        "0": {
          "username": "NAME",
          "deviceId": "xxx",
          "position": { "x": 0, "z": 0 },
          "rotationY": 0,
          "alive": true,
          "team": null,        // 'A' | 'B' | null
          "role": null,        // 'oni' | 'runner' | null（チーム戦時のみ使用）
          "catchTimestamp": null
        },
        "1": { },
        "2": { },
        "3": { }
      },
      "oniPositions": [
        { "x": 40, "z": 40, "targetPlayer": 0 }
      ],
      "teamBattleSettings": {       // チーム戦時のみ使用
        "oniTeam": "A",             // 鬼側チーム
        "runnerTeam": "B",          // 逃げ側チーム
        "swapRounds": false,        // 攻守交替モード
        "currentRound": 1,
        "roundResults": []
      },
      "gameTimer": 60,
      "hostIndex": 0,
      "createdAt": timestamp
    }
  }
}
```

■ セキュリティルール
```json
{
  "rules": {
    "users": {
      "$username": {
        ".read": true,
        ".write": "!data.exists() || data.child('deviceId').val() === newData.child('deviceId').val()"
      }
    },
    "rankings": {
      ".read": true,
      ".write": "newData.child('username').exists()"
    },
    "rooms": {
      ".read": true,
      "$roomId": { ".write": true }
    }
  }
}
```


================================
25. 同期レイヤー（SyncLayer）
================================
```javascript
const SyncLayer = {
    roomRef: null,
    listeners: [],

    connect(roomId) {
        this.roomRef = database.ref('rooms/' + roomId);
    },

    updatePlayerPosition(playerIndex, position, rotationY, currentFloor) {
        this.roomRef.child('players/' + playerIndex).update({
            position: { x: position.x, z: position.z },
            rotationY: rotationY,
            floor: currentFloor
        });
    },

    updateOniPositions(oniList) {
        const data = oniList.map(oni => ({
            x: oni.position.x, z: oni.position.z,
            floor: oni.currentFloor,
            targetPlayer: oni.targetPlayer
        }));
        this.roomRef.child('oniPositions').set(data);
    },

    updateGameTimer(time) {
        this.roomRef.child('gameTimer').set(time);
    },

    reportCaught(playerIndex) {
        this.roomRef.child('players/' + playerIndex).update({
            alive: false,
            catchTimestamp: firebase.database.ServerValue.TIMESTAMP
        });
    },

    onPlayersUpdate(cb) {
        const ref = this.roomRef.child('players');
        ref.on('value', snap => cb(snap.val()));
        this.listeners.push(ref);
    },
    onOniUpdate(cb) {
        const ref = this.roomRef.child('oniPositions');
        ref.on('value', snap => cb(snap.val()));
        this.listeners.push(ref);
    },
    onTimerUpdate(cb) {
        const ref = this.roomRef.child('gameTimer');
        ref.on('value', snap => cb(snap.val()));
        this.listeners.push(ref);
    },
    onStatusChange(cb) {
        const ref = this.roomRef.child('status');
        ref.on('value', snap => cb(snap.val()));
        this.listeners.push(ref);
    },

    disconnect() {
        this.listeners.forEach(ref => ref.off());
        this.listeners = [];
        this.roomRef = null;
    }
};
```


================================
26. 効果音（SE）
================================
【UI】
・ホバー: 短い電子ビープ音
・決定: クリック確定音
・エラー: 警告音（低め短め）

【ゲーム — 移動SE（詳細）】

■ プレイヤー足音
・Web Audio API（AudioContext）で生成。外部ファイル不要。
・移動中のみ再生。停止すると即停止。

| 状態 | テンポ(ms間隔) | 音の特徴 | 音量 |
|------|-------------|---------|------|
| 歩行（通常移動） | 450ms | 石床コツコツ: 短いインパクト + 微小リバーブ | 0.3 |
| スプリント | 280ms | 強い踏み込み: 低音寄り + アタック強め | 0.45 |
| スプリント開始 | — | 最初の1歩のみ強めのキック音（「ダッ」） | 0.5 |
| スプリント終了 | — | ブレーキ音（滑るような摩擦音、短い） | 0.25 |
| スタミナ切れ直後 | 550ms | 重い足音（低音、「ズッ...ズッ...」疲労感） | 0.35 |

```javascript
// 足音生成（Web Audio API）
function createFootstepSound(ctx, isSprint) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // 石床の硬い反響
    osc.type = 'square';
    osc.frequency.value = isSprint ? 120 : 180;

    filter.type = 'highpass';
    filter.frequency.value = isSprint ? 80 : 150;

    // 短いアタック → 急速減衰
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(isSprint ? 0.45 : 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isSprint ? 0.08 : 0.06));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
}

// 足音ループ管理
const FootstepManager = {
    ctx: null,
    interval: null,
    lastState: 'idle', // 'idle' | 'walk' | 'sprint' | 'exhausted'

    start(state) {
        if (this.lastState === state) return;
        this.stop();
        this.lastState = state;
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();

        const tempos = { walk: 450, sprint: 280, exhausted: 550 };
        const tempo = tempos[state];
        if (!tempo) return;

        // スプリント開始時のキック音
        if (state === 'sprint' && this.lastState !== 'sprint') {
            this.playSprintKick();
        }

        createFootstepSound(this.ctx, state === 'sprint');
        this.interval = setInterval(() => {
            createFootstepSound(this.ctx, state === 'sprint');
        }, tempo);
    },

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        // スプリントから停止時のブレーキ音
        if (this.lastState === 'sprint') {
            this.playBrakeSound();
        }
        this.lastState = 'idle';
    },

    playSprintKick() {
        // 強めの低音インパクト（「ダッ」）
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = 80;
        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
    },

    playBrakeSound() {
        // 短い摩擦ノイズ
        const bufferSize = this.ctx.sampleRate * 0.08;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.value = 0.25;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2000;
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }
};
```

■ ゲームループ内での呼び出し
```javascript
// メインループ内（ステップ2〜3の間）
function updateMovementSE() {
    const isMoving = GameState.player.moveForward || GameState.player.moveBackward ||
                     GameState.player.turnLeft || GameState.player.turnRight;

    if (!isMoving) {
        FootstepManager.stop();
        return;
    }

    if (GameState.player.isSprinting && GameState.player.stamina > 0) {
        FootstepManager.start('sprint');
    } else if (GameState.player.stamina <= 5 && GameState.player.staminaJustDepleted) {
        FootstepManager.start('exhausted');
    } else {
        FootstepManager.start('walk');
    }
}
```

■ 鬼の足音
・鬼は独自の足音を持つ（不気味な「ペタペタ」音、裸足風）
・3Dポジショナルオーディオ: プレイヤーからの距離と方向で音量・パン変化
・距離15m以内で聞こえ始め、近づくほど大きくなる
・複数鬼がいる場合、最も近い鬼の足音が最大音量

| 距離 | 音量 | テンポ(ms) |
|------|------|-----------|
| >15m | 0（聞こえない） | — |
| 10-15m | 0.1 | 500 |
| 5-10m | 0.25 | 400 |
| 2-5m | 0.5 | 350 |
| <2m | 0.8 | 300 |

※別フロアの鬼: 水平距離が10m以内でも音量を×0.3に減衰。
  天井越しにくぐもった足音が聞こえる演出（lowpassフィルタ適用）。

```javascript
// 鬼の足音（裸足のペタペタ音）
function createOniFootstep(ctx, volume) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // 裸足の湿った音: 低周波 + 短い
    osc.type = 'sine';
    osc.frequency.value = 60;

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    // ステレオパンで方向を表現
    const panner = ctx.createStereoPanner();
    // panner.pan.value は鬼の方向から計算

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
}
```

【ゲーム — その他】
・捕獲: 重い衝撃音 + 短い叫び声風ノイズ
・捕獲引きずり: コンクリート摩擦ノイズ（bandpass 800Hz、1.5秒間フェードアウト）
・ニアミス（鬼接近→離脱）: 緊張音が弛緩する効果音
・心拍: 距離連動でテンポ変化（72〜160 BPM）
・フラッシュライト: 起動音（カチッ）
・脱出成功: 上昇系ネオンSE + ドアが開く音

【演出】
・ステージクリア: 上昇系ネオンSE
・ゲームオーバー: 下降系暗いSE
・起動キャッチコピー: SE_MATCH_READY
・退席通知: 低音警告SE
・危険警告（鬼接近）: 低音のドローン音（持続、距離連動で音量変化）

【ステージ別環境音（アンビエントSE）】
各ステージのテーマに合わせた環境音をWeb Audio APIで生成。
ゲーム開始時にステージテーマに応じて環境音マネージャーを初期化。
BGMとは別レイヤーで再生（BGM OFF時も環境音は鳴る）。

```javascript
const AmbientSoundManager = {
    ctx: null,
    layers: [],  // 同時再生する環境音レイヤー

    init(stageNum) {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.stop();
        const config = AMBIENT_CONFIGS[stageNum];
        config.forEach(layer => this.layers.push(this.createLayer(layer)));
    },

    createLayer(config) {
        // config: { type, frequency, volume, interval, duration, filter }
        const layer = { config, timeout: null, active: true };

        const play = () => {
            if (!layer.active) return;
            this.playAmbientSound(config);
            // ランダム間隔で次回再生
            const jitter = config.interval * (0.5 + Math.random());
            layer.timeout = setTimeout(play, jitter * 1000);
        };

        // 初回をランダム遅延で開始
        layer.timeout = setTimeout(play, Math.random() * config.interval * 1000);
        return layer;
    },

    playAmbientSound(config) {
        const ctx = this.ctx;
        const now = ctx.currentTime;

        if (config.type === 'drone') {
            // 持続低音ドローン（空調、機械音、不協和音）
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = config.waveform || 'sine';
            osc.frequency.value = config.frequency;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(config.volume, now + 1);
            gain.gain.linearRampToValueAtTime(0, now + config.duration);
            osc.connect(gain);
            if (config.filter) {
                const f = ctx.createBiquadFilter();
                f.type = config.filter.type;
                f.frequency.value = config.filter.freq;
                gain.disconnect();
                gain.connect(f);
                f.connect(ctx.destination);
            } else {
                gain.connect(ctx.destination);
            }
            osc.start(now);
            osc.stop(now + config.duration);
        }
        else if (config.type === 'impact') {
            // 単発音（水滴、金属軋み、スパーク、ガラス）
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = config.waveform || 'square';
            osc.frequency.value = config.frequency;
            gain.gain.setValueAtTime(config.volume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + config.duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + config.duration + 0.01);
        }
        else if (config.type === 'noise') {
            // ノイズ系（蒸気、風、ホワイトノイズ）
            const bufferSize = ctx.sampleRate * config.duration;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize * 0.5);
            }
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            const gain = ctx.createGain();
            gain.gain.value = config.volume;
            const filter = ctx.createBiquadFilter();
            filter.type = config.filter?.type || 'lowpass';
            filter.frequency.value = config.filter?.freq || 2000;
            source.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            source.start(now);
        }
    },

    stop() {
        this.layers.forEach(l => {
            l.active = false;
            if (l.timeout) clearTimeout(l.timeout);
        });
        this.layers = [];
    }
};

// ステージ別環境音定義
const AMBIENT_CONFIGS = {
    1: [ // 地下研究所
        { type: 'drone', frequency: 60, volume: 0.06, interval: 0, duration: 999, waveform: 'sine',
          filter: { type: 'lowpass', freq: 200 } },  // 空調ハム（常時）
        { type: 'impact', frequency: 2400, volume: 0.04, interval: 8, duration: 0.05, waveform: 'sine' }, // ビープ
    ],
    2: [ // 廃工場
        { type: 'impact', frequency: 120, volume: 0.08, interval: 6, duration: 0.3, waveform: 'sawtooth' }, // 金属軋み
        { type: 'noise', volume: 0.05, interval: 10, duration: 0.4,
          filter: { type: 'bandpass', freq: 3000 } }, // 蒸気噴出
        { type: 'drone', frequency: 45, volume: 0.04, interval: 0, duration: 999, waveform: 'sawtooth',
          filter: { type: 'lowpass', freq: 100 } }, // 歯車の唸り
    ],
    3: [ // 廃ビルオフィス
        { type: 'impact', frequency: 4000, volume: 0.02, interval: 4, duration: 0.02, waveform: 'square' }, // 蛍光灯チラつき
        { type: 'impact', frequency: 800, volume: 0.06, interval: 20, duration: 0.15, waveform: 'triangle' }, // 遠いガラス割れ
        { type: 'noise', volume: 0.03, interval: 0, duration: 999,
          filter: { type: 'lowpass', freq: 400 } }, // 風の音（常時）
    ],
    4: [ // 地下下水道
        { type: 'impact', frequency: 3500, volume: 0.06, interval: 2, duration: 0.03, waveform: 'sine' }, // 水滴ポタポタ
        { type: 'drone', frequency: 80, volume: 0.05, interval: 0, duration: 999, waveform: 'sine',
          filter: { type: 'lowpass', freq: 150 } }, // 遠い水流
        { type: 'impact', frequency: 200, volume: 0.04, interval: 12, duration: 0.5, waveform: 'triangle' }, // 金属反響
    ],
    5: [ // 崩壊データセンター
        { type: 'noise', volume: 0.07, interval: 8, duration: 0.1,
          filter: { type: 'highpass', freq: 5000 } }, // スパーク
        { type: 'drone', frequency: 180, volume: 0.04, interval: 0, duration: 999, waveform: 'sawtooth',
          filter: { type: 'bandpass', freq: 300 } }, // ファン異常音
        { type: 'impact', frequency: 40, volume: 0.1, interval: 25, duration: 1.5, waveform: 'sine' }, // 遠い崩落振動
    ],
    hidden: [ // 異空間ラボ
        { type: 'drone', frequency: 55, volume: 0.06, interval: 0, duration: 999, waveform: 'sine' }, // 不協和ドローン
        { type: 'drone', frequency: 58, volume: 0.05, interval: 0, duration: 999, waveform: 'sine' }, // 微妙にずれた2音目→うねり
        { type: 'impact', frequency: 72, volume: 0.08, interval: 0.85, duration: 0.15, waveform: 'sine',
          filter: { type: 'lowpass', freq: 200 } }, // 心臓の鼓動（常時）
    ],
    scoreAttack: [ // 無限回廊（初期=Stage1風、時間経過でレイヤー追加）
        { type: 'drone', frequency: 60, volume: 0.06, interval: 0, duration: 999, waveform: 'sine',
          filter: { type: 'lowpass', freq: 200 } }, // 空調ハム（常時）
        // ※ 60秒後にAMBIENT_CONFIGS[2]を追加、120秒後に[4]を追加、240秒後に[5]を追加
        // AmbientSoundManager.addLayersFromConfig(stageNum) で動的に追加
    ],
};
```


================================
27. BGM仕様
================================
・ループ再生
・ステージごとにテンポ/曲調変化（暗いアンビエント → テンションの高いホラー）
・ON/OFF 切替
・鬼接近時にBGMピッチが微上昇（恐怖演出）

■ BGMファイル振り分け

【ソロプレイ】
| 画面/ステージ | ファイル名 |
|-------------|-----------|
| タイトル画面 | MAZE HUNT_OP.mp3 |
| Stage 1 | MAZE HUNT_Stage1.mp3 |
| Stage 2 | MAZE HUNT_Stage2.mp3 |
| Stage 3 | MAZE HUNT_Stage3.mp3 |
| Stage 4 | MAZE HUNT_Stage4.mp3 |
| Stage 5 | MAZE HUNT_Stage5.mp3 |
| スコアアタック | MAZE HUNT_Score_Attack.mp3 |
| 隠しステージ | MAZE HUNT_secret.mp3 |

【マルチプレイ】
| ステージ | ファイル名 | 備考 |
|---------|-----------|------|
| Stage 1 | MAZE HUNT_Multi1.mp3 | |
| Stage 2 | MAZE HUNT_Multi2.mp3 | |
| Stage 3 | MAZE HUNT_Multi3.mp3 | |
| Stage 4 | MAZE HUNT_Stage4.mp3 | ※暫定：ソロ用で代替。専用BGM完成後に差し替え |
| Stage 5 | MAZE HUNT_Stage5.mp3 | ※暫定：ソロ用で代替。専用BGM完成後に差し替え |

【BGM切り替えコード】
```javascript
const BGM_MAP = {
    title: 'MAZE HUNT_OP.mp3',
    // ソロ
    solo_1: 'MAZE HUNT_Stage1.mp3',
    solo_2: 'MAZE HUNT_Stage2.mp3',
    solo_3: 'MAZE HUNT_Stage3.mp3',
    solo_4: 'MAZE HUNT_Stage4.mp3',
    solo_5: 'MAZE HUNT_Stage5.mp3',
    scoreAttack: 'MAZE HUNT_Score_Attack.mp3',
    hidden: 'MAZE HUNT_secret.mp3',
    // マルチ
    multi_1: 'MAZE HUNT_Multi1.mp3',
    multi_2: 'MAZE HUNT_Multi2.mp3',
    multi_3: 'MAZE HUNT_Multi3.mp3',
    multi_4: 'MAZE HUNT_Stage4.mp3',   // TODO: 専用BGM完成後に差し替え
    multi_5: 'MAZE HUNT_Stage5.mp3',   // TODO: 専用BGM完成後に差し替え
};

// ステージ開始時に呼び出し
function playStageMusic(mode, stageNum) {
    const key = mode === 'multi' ? `multi_${stageNum}` : `solo_${stageNum}`;
    SoundManager.playBGM(BGM_MAP[key] || BGM_MAP.title);
}
```

```javascript
const SoundManager = {
    bgm: null,
    bgmEnabled: true,
    seEnabled: true,
    audioCtx: null,

    getCtx() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioCtx;
    },

    playBGM(url) {
        if (this.bgm) this.bgm.pause();
        this.bgm = new Audio(url);
        this.bgm.loop = true;
        if (this.bgmEnabled) this.bgm.play().catch(() => {});
    },
    playSE(name) {
        if (!this.seEnabled) return;
        const se = new Audio('se_' + name + '.mp3');
        se.play().catch(() => {});
    },
    toggleBGM() {
        this.bgmEnabled = !this.bgmEnabled;
        if (this.bgm) this.bgmEnabled ? this.bgm.play() : this.bgm.pause();
    },
    toggleSE() {
        this.seEnabled = !this.seEnabled;
        if (!this.seEnabled) FootstepManager.stop();
    }
};
```

※ FootstepManager（セクション26で定義）は SoundManager.getCtx() を共有して使用する。
※ SE OFF 時は FootstepManager も停止する。


================================
28. ナビゲーターシステム（旧: 実況テキスト）
================================
■ 概要
ゲーム中にリアルタイムでナビゲーターがプレイヤーをサポートする。
単なる実況ではなく、脱出のためのヒント・方向指示・敵警告を行う
「もう一人の味方」としての役割を持つ。

言語設定（日本語 / English）に連動してテキストが切り替わる。

■ 表示位置
・ゲーム画面の下部（HUD層）
・半透明背景バー上にネオングリーンテキスト
・警告系は赤テキスト（#ff4444）
・1行表示、2.5秒でフェードアウト → 次のテキストに更新
・重要度が高いほど表示時間を延長（最大4秒）

■ ナビゲーターの性格
・冷静で簡潔。ホラー世界観に合うトーン
・日本語: やや硬質、「〜しろ」「〜だ」の命令/断定調
・English: 短文命令形、FPSゲームのオペレーター風

■ i18n テキスト管理
```javascript
const NAV_TEXTS = {
    // ============ ゲーム開始 ============
    gameStart: {
        ja: '出口を探せ。捕まるな。',
        en: 'Find the exit. Don\'t get caught.'
    },

    // ============ 鬼の接近警告 ============
    oniApproaching: {
        ja: '鬼が近づいている…',
        en: 'They\'re closing in...'
    },
    oniVeryClose: {
        ja: '危険！すぐ近くにいる！',
        en: 'DANGER! Too close!'
    },
    oniDirectionFront: {
        ja: '前方に鬼！引き返せ！',
        en: 'Oni ahead! Turn back!'
    },
    oniDirectionBehind: {
        ja: '背後から来ている！走れ！',
        en: 'Behind you! RUN!'
    },
    oniDirectionLeft: {
        ja: '左側に鬼！右へ逃げろ！',
        en: 'Oni on your LEFT! Go right!'
    },
    oniDirectionRight: {
        ja: '右側に鬼！左へ逃げろ！',
        en: 'Oni on your RIGHT! Go left!'
    },
    oniAbove: {
        ja: '上の階から足音が聞こえる…',
        en: 'Footsteps above you...'
    },
    oniBelow: {
        ja: '下の階に何かいる…',
        en: 'Something below...'
    },
    oniCloseCall: {
        ja: '危なかった… +10',
        en: 'Close call! +10'
    },

    // ============ 脱出ヒント（方向指示） ============
    exitFarAhead: {
        ja: '出口はこの先だ。まっすぐ進め。',
        en: 'Exit ahead. Keep going straight.'
    },
    exitTurnLeft: {
        ja: 'この先を左だ。',
        en: 'Turn left ahead.'
    },
    exitTurnRight: {
        ja: 'この先を右だ。',
        en: 'Turn right ahead.'
    },
    exitBehind: {
        ja: '出口は逆方向だ。引き返せ。',
        en: 'Exit is behind you. Turn around.'
    },
    exitNear: {
        ja: '出口が近い！あと少しだ！',
        en: 'Exit is close! Almost there!'
    },
    exitVeryNear: {
        ja: '出口はすぐそこだ！',
        en: 'Exit right there! GO!'
    },
    exitUpstairs: {
        ja: '出口は上の階だ。階段を探せ。',
        en: 'Exit is upstairs. Find the stairs.'
    },
    exitDownstairs: {
        ja: '出口は下の階だ。降りろ。',
        en: 'Exit is downstairs. Go down.'
    },
    exitRelocated: {
        ja: '出口が移動した！新しい位置を探せ！',
        en: 'EXIT RELOCATED! Find it again!'
    },

    // ============ 階段・フロア ============
    stairsFoundUp: {
        ja: '階段だ。上へ行ける。',
        en: 'Stairs. You can go up.'
    },
    stairsFoundDown: {
        ja: '階段だ。下へ行ける。',
        en: 'Stairs. You can go down.'
    },
    floorChanged: {
        ja: '{floor}階に到着。',          // {floor} は動的置換
        en: 'Now on {floor}F.'
    },

    // ============ スタミナ・移動 ============
    sprintStart: {
        ja: 'ダッシュ開始。',
        en: 'Sprint engaged.'
    },
    staminaDepleted: {
        ja: 'スタミナ切れ！回復を待て！',
        en: 'Stamina depleted! Wait to recover!'
    },
    staminaLow: {
        ja: 'スタミナが少ない。温存しろ。',
        en: 'Low stamina. Conserve it.'
    },

    // ============ 時間 ============
    time30: {
        ja: '残り30秒。急げ。',
        en: '30 seconds left. Hurry.'
    },
    time10: {
        ja: '残り10秒！持ちこたえろ！',
        en: '10 SECONDS! HOLD ON!'
    },

    // ============ 結果 ============
    stageClear: {
        ja: 'クリアだ。次へ進め。',
        en: 'Stage cleared. Move on.'
    },
    escaped: {
        ja: '脱出成功！よくやった。',
        en: 'ESCAPED! Well done.'
    },
    survive60: {
        ja: '1分経過。まだ生きている。',
        en: '1 minute. Still alive.'
    },
    survive120: {
        ja: '2分経過。伝説級だ。',
        en: '2 minutes. Legendary.'
    },

    // ============ マルチ ============
    multiPlayerCaught: {
        ja: '{name}が捕まった。残り{count}人。',
        en: '{name} caught. {count} remain.'
    },
    multiFinalTwo: {
        ja: '残り2人。最後まで逃げ切れ。',
        en: 'Final two. Survive to the end.'
    },
    multiCoopEscaped: {
        ja: '{name}が脱出した。他のメンバーを待て。',
        en: '{name} escaped. Wait for others.'
    },

    // ============ 戦術ヒント（状況判断） ============
    hintDeadEnd: {
        ja: '行き止まりだ。引き返せ。',
        en: 'Dead end. Turn back.'
    },
    hintOniBlocking: {
        ja: '鬼が道を塞いでいる。迂回しろ。',
        en: 'Oni blocking the path. Find a detour.'
    },
    hintSafeArea: {
        ja: 'この辺は安全だ。少し休め。',
        en: 'Area clear. Catch your breath.'
    },
    hintMultipleOni: {
        ja: '複数の鬼が接近中！挟まれるな！',
        en: 'Multiple oni closing in! Don\'t get cornered!'
    },
};
```

■ ナビゲーター発火ロジック

【方向指示の計算】
```javascript
function getDirectionHint(playerPos, playerRotY, targetPos) {
    // プレイヤー→ターゲットの角度
    const dx = targetPos.x - playerPos.x;
    const dz = targetPos.z - playerPos.z;
    const angleToTarget = Math.atan2(dx, dz);

    // プレイヤーの視線方向との差分
    let diff = angleToTarget - playerRotY;
    // -π〜π に正規化
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;

    if (Math.abs(diff) < Math.PI / 4) return 'ahead';       // 前方 ±45°
    if (Math.abs(diff) > 3 * Math.PI / 4) return 'behind';  // 後方
    if (diff > 0) return 'right';                            // 右
    return 'left';                                            // 左
}
```

【鬼の方向警告】
```javascript
function checkOniDirectionWarning(playerPos, playerRotY, playerFloor, oniList) {
    for (const oni of oniList) {
        const dist3D = playerPos.distanceTo(oni.position);

        // 別フロアの鬼
        if (oni.currentFloor !== playerFloor && dist3D < 12) {
            if (oni.currentFloor > playerFloor) {
                Navigator.add('oniAbove', 1);
            } else {
                Navigator.add('oniBelow', 1);
            }
            continue;
        }

        // 同一フロアの鬼
        if (oni.currentFloor !== playerFloor) continue;
        if (dist3D > 15) continue;

        if (dist3D < 6) {
            const dir = getDirectionHint(playerPos, playerRotY, oni.position);
            const key = 'oniDirection' + dir.charAt(0).toUpperCase() + dir.slice(1);
            Navigator.add(key, 3); // 高優先度
        } else if (dist3D < 15) {
            Navigator.add('oniApproaching', 1);
        }
    }
}
```

【脱出ヒント（定期発火: 15秒ごと）】
```javascript
function checkExitHint(playerPos, playerRotY, playerFloor, exitPos, exitFloor) {
    if (!exitPos) return;

    // フロアが違う場合
    if (playerFloor !== exitFloor) {
        if (exitFloor > playerFloor) {
            Navigator.add('exitUpstairs', 2);
        } else {
            Navigator.add('exitDownstairs', 2);
        }
        return;
    }

    // 同一フロア: 距離と方向
    const dist = Math.sqrt(
        (playerPos.x - exitPos.x) ** 2 + (playerPos.z - exitPos.z) ** 2
    );

    if (dist < 5) {
        Navigator.add('exitVeryNear', 3);
    } else if (dist < 10) {
        Navigator.add('exitNear', 2);
    } else {
        const dir = getDirectionHint(playerPos, playerRotY, exitPos);
        switch (dir) {
            case 'ahead':  Navigator.add('exitFarAhead', 1); break;
            case 'behind': Navigator.add('exitBehind', 2); break;
            case 'left':   Navigator.add('exitTurnLeft', 1); break;
            case 'right':  Navigator.add('exitTurnRight', 1); break;
        }
    }
}
```

【行き止まり検知】
```javascript
function checkDeadEnd(playerPos, playerFloor, mazeFloors) {
    const cellX = Math.floor(playerPos.x / CL);
    const cellZ = Math.floor(playerPos.z / CL);
    const passable = getPassableNeighbors(mazeFloors[playerFloor], { x: cellX, z: cellZ });
    if (passable.length <= 1) {
        Navigator.add('hintDeadEnd', 2);
    }
}
```

【鬼が経路上にいる検知】
```javascript
function checkOniBlocking(playerPos, playerFloor, exitPos, exitFloor, oniList) {
    if (!exitPos || playerFloor !== exitFloor) return;

    // プレイヤー→出口のBFS経路上に鬼がいるか
    const path = bfsPathfind3D(mazeFloors,
        { x: Math.floor(playerPos.x/CL), z: Math.floor(playerPos.z/CL), floor: playerFloor },
        { x: Math.floor(exitPos.x/CL), z: Math.floor(exitPos.z/CL), floor: exitFloor }
    );
    for (const oni of oniList) {
        if (oni.currentFloor !== playerFloor) continue;
        const oniCell = { x: Math.floor(oni.position.x/CL), z: Math.floor(oni.position.z/CL) };
        if (path.slice(0, 5).some(p => p.x === oniCell.x && p.z === oniCell.z)) {
            Navigator.add('hintOniBlocking', 2);
            return;
        }
    }
}
```

■ NavigatorSystem（旧CommentarySystem）

```javascript
const Navigator = {
    queue: [],
    currentText: null,
    displayUntil: 0,
    lastTime: 0,
    minInterval: 3000,       // 同一メッセージ連発防止
    lastHintTime: 0,
    hintInterval: 15000,     // 脱出ヒントは15秒ごと
    lang: 'ja',              // GameState.language から取得

    // テキスト取得（言語切替 + 動的パラメータ置換）
    getText(key, params = {}) {
        const template = NAV_TEXTS[key];
        if (!template) return key;
        let text = template[this.lang] || template['en'];
        for (const [k, v] of Object.entries(params)) {
            text = text.replace(`{${k}}`, v);
        }
        return text;
    },

    add(key, priority = 0, params = {}) {
        const text = this.getText(key, params);
        this.queue.push({ text, priority, time: Date.now(), key });
        this.queue.sort((a, b) => b.priority - a.priority);
        // キューが溜まりすぎないよう最大5件に制限
        if (this.queue.length > 5) this.queue.length = 5;
    },

    update() {
        const now = Date.now();
        // フェードアウト
        if (this.currentText && now > this.displayUntil) {
            this.currentText = null;
        }
        // 次のメッセージ表示
        if (!this.currentText && this.queue.length > 0 &&
            now - this.lastTime >= this.minInterval) {
            const next = this.queue.shift();
            this.currentText = next.text;
            // 優先度に応じた表示時間: 2.5s〜4s
            const duration = 2500 + Math.min(next.priority, 3) * 500;
            this.displayUntil = now + duration;
            this.lastTime = now;
        }
    },

    // 定期ヒント発火（メインループから毎フレーム呼ぶ）
    checkPeriodicHints(gameState) {
        const now = Date.now();
        if (now - this.lastHintTime < this.hintInterval) return;
        this.lastHintTime = now;

        // 脱出ヒント
        if (gameState.stageType === 'escape' && gameState.exitPosition) {
            checkExitHint(
                gameState.playerPosition,
                gameState.playerRotationY,
                gameState.playerCurrentFloor,
                gameState.exitPosition,
                gameState.exitFloor
            );
        }

        // 安全判定
        if (gameState.nearestOniDistance > 20) {
            Navigator.add('hintSafeArea', 0);
        }

        // 行き止まり
        checkDeadEnd(gameState.playerPosition, gameState.playerCurrentFloor, gameState.mazeFloors);

        // 鬼が経路上にいるか
        if (gameState.stageType === 'escape') {
            checkOniBlocking(
                gameState.playerPosition,
                gameState.playerCurrentFloor,
                gameState.exitPosition,
                gameState.exitFloor,
                gameState.oniList
            );
        }
    },

    setLanguage(lang) {
        this.lang = lang; // 'ja' or 'en'
    }
};
```

■ トリガー一覧（優先度付き）

| 優先度 | トリガー | key | 発火条件 |
|--------|---------|-----|---------|
| 3 | 鬼至近+方向 | oniDirection* | 鬼が6m以内、方向計算して発火 |
| 3 | 出口すぐそこ | exitVeryNear | EXIT距離<5m、同一フロア |
| 3 | 複数鬼接近 | hintMultipleOni | 2体以上が10m以内 |
| 2 | 鬼経路上ブロック | hintOniBlocking | EXIT方向の経路5セル以内に鬼 |
| 2 | 出口方向指示 | exitTurnLeft/Right/Behind | 定期ヒント（15秒） |
| 2 | 出口別フロア | exitUpstairs/Downstairs | 出口が別フロアにある |
| 2 | 行き止まり | hintDeadEnd | 通路が1方向のみ |
| 2 | スタミナ切れ | staminaDepleted | スタミナ=0 |
| 2 | 出口ワープ | exitRelocated | Stage 5のワープ発生 |
| 1 | 鬼接近 | oniApproaching | 鬼が15m以内 |
| 1 | 鬼別フロア | oniAbove/Below | 別フロアの鬼が12m以内 |
| 1 | 出口近い | exitNear | EXIT距離<10m |
| 1 | 出口前方 | exitFarAhead | EXIT方向=前方 |
| 1 | 階段発見 | stairsFoundUp/Down | 階段セル進入 |
| 1 | スタミナ低 | staminaLow | スタミナ<20 |
| 0 | 安全 | hintSafeArea | 鬼が20m以上離れている |
| 0 | 近接回避 | oniCloseCall | 鬼6m以内→離脱 |
| 0 | 生存マイルストーン | survive60/120 | 経過時間（全モード共通） |

■ ゲームループ内での呼び出し
```
// メインループ ステップ18（HUD更新の直後）に追加:
18.5 ナビゲーター更新:
    a. checkOniDirectionWarning() — 鬼の方向警告
    b. Navigator.checkPeriodicHints() — 定期ヒント（脱出方向、行き止まり、経路ブロック）
    c. Navigator.update() — キューから表示テキスト取り出し
    d. HUDにテキスト描画（currentText があれば表示）
```


================================
29. 終了処理
================================
■ ソロ
・捕獲 → リザルト表示
・選択肢: [リトライ] / [タイトルに戻る]
・ステージクリア → 次ステージ / 全クリア画面

■ マルチ
・勝敗確定 → リザルト表示（全プレイヤー順位: 生存時間順）
・選択肢: [再戦] / [タイトルに戻る]
・全員が「タイトルに戻る」選択 → ルーム削除 → IDロック解放


================================
30. 実装順序（推奨）
================================
Phase 1: 基盤
 1. HTMLスケルトン + 全screen DOM構造
 2. CSS: ネオンテーマ全体（変数、ボタン、モーダル）
 3. マトリックス背景アニメーション
 4. 画面遷移（showScreen / showModal）
 5. 起動キャッチコピー演出

Phase 2: タイトル + ユーザー管理
 6. タイトル画面UI全配置
 7. Firebase初期化 + ユーザー登録/ゲスト処理
 8. ランキングモーダル（Firebase取得・表示）
 9. ルール説明モーダル
 10. ゲームモード選択UI

Phase 3: 3D基盤
 11. Three.js初期化（WebGLRenderer, Scene, Camera）
 12. 迷路生成（Recursive Backtracker）+ 3Dメッシュ構築（1F）
 13. 照明セットアップ（Ambient, Hemisphere, PointLights）
 14. フォグ + CRTオーバーレイ
 15. Pointer Lock + カメラ操作
 16. プレイヤー移動（WASD / 矢印 + 壁衝突判定）
 17. フラッシュライト
 18. POV両手表示 + 歩行アニメーション

Phase 3.5: マルチフロア
 19. マルチフロア迷路生成（floors配列、フロアごとに独立生成）
 20. 階段配置（placeStairs: 通路セルに配置、最低3セル間隔）
 21. 階段3Dメッシュ（スロープ + 手すりネオンライン + 矢印ライト）
 22. 全フロア3Dメッシュのシーン配置（y = floor * FLOOR_H オフセット）
 23. 天井メッシュ + 階段穴（天井に穴を開けて上下フロアが見通せる）
 24. プレイヤーY座標制御（updatePlayerY: 床高 or 階段補間）
 25. フロア切替判定（階段通過で currentFloor 更新）
 26. 階段上の速度低下（×0.8）

Phase 4: 敵キャラクター
 27. 鬼モデル読み込み（GLTFLoader + ステージ別GLBファイル）
 28. 鬼マテリアル + 自己発光 + 専用PointLights
 29. マルチフロアBFS（bfsPathfind3D: (x,z,floor)ノード + 階段接続）
 30. 鬼の移動 + 壁衝突判定
 31. 鬼のY座標制御（updateOniY: 階段移動、速度×0.7）
 32. 鬼の歩行アニメーション
 33. 鬼の向き更新（プレイヤー方向）

Phase 5: ゲームプレイ
 34. 捕獲判定（同一フロア限定）+ 捕獲演出
 35. HUD実装（スタミナ、タイマー、距離、BPM、危険フレーム、フロア表示）
 36. ミニマップ実装（現在フロア表示 + 階段マーカー▲）
 37. スプリント + スタミナシステム
 38. 脱出ステージ（制限時間内に出口を見つけて脱出）
 39. 脱出ステージ（EXIT配置、光柱、リングマーカー、到達判定 — 同一フロア限定）
 40. 脱出ステージHUD（目標表示 "FIND EXIT 2F — 28.5m" + 出口距離+フロア）
 41. Stage 5: EXIT ワープ機能（30秒ごと、フロア間もワープ）
 42. ステージ制（5ステージ、全脱出統一、フロア数変化）
 43. ゲームオーバー / ステージクリア / 脱出成功 / 時間切れ / 全クリア画面
 44. スコアアタックモード

Phase 6: マルチプレイ
 45. ロビー画面（4人対応）+ ルーム作成/参加 + URL共有
 46. SyncLayer実装（currentFloor も同期）
 47. ホスト鬼AI → Firebase同期（フロア情報含む）
 48. ゲストの鬼受信 → 描画
 49. プレイヤー位置相互同期（フロア情報含む）
 50. 勝敗判定（個人戦 / チーム戦 / 協力）
 51. 退席処理
 52. 再戦 / 終了処理

Phase 7: 演出・サウンド
 53. サウンド統合（BGM / SE / 心拍）
 54. FootstepManager実装（歩行/スプリント/疲労/ブレーキ音、Web Audio API生成）
 55. 鬼の足音実装（距離連動音量・テンポ・パン、別フロアは音量減衰）
 56. ナビゲーターシステム（i18n対応、方向指示、行き止まり検知、鬼経路ブロック検知）
 57. 捕獲カメラ演出
 58. ダストパーティクル
 59. ライトちらつきアニメーション
 60. 脱出成功演出（"ESCAPED!" + 緑フラッシュ + 上昇SE）

Phase 8: スマホ対応
 61. バーチャルジョイスティック（移動）
 62. タッチ視点操作
 63. スプリントボタン
 64. レスポンシブUI調整

Phase 9: 仕上げ
 65. ランキング登録・表示
 66. 多言語対応（日本語 / English 切替）
 67. レスポンシブ最終調整
 68. エッジケーステスト
 69. パフォーマンス最適化（別フロアのライト制御等）


================================
31. デザインリファレンス
================================
UIデザインは LINKED BLOCKS_ / FALL DODGE の以下の要素を継承：

・ヘッダー帯:「SYSTEM ACCESS // ...」のdim green帯
・HUDバー: ネオン枠 + モノスペース + dark panel背景
・プレイヤーバッジ: [P1: YOU] [P2: GUEST 1] ... [P4: GUEST 3] の4色枠表示
・ボタン: ネオンアウトライン + ホバーグロー + 浮き上がり
・モーダル: 暗転背景 + ネオン枠ボックス
・リザルト: 「GAME SET!」大文字ネオン発光 + 全員順位表
・枠線: 二重ネオン枠（外枠太/内枠細）


================================
32. 添付ファイル参照
================================
| ファイル | 内容 | 用途 |
|---------|------|------|
| concept_cyber_tag_v2.html | ゲーム本体ベースコード | 迷路生成、AI、HUD、操作のリファレンス |
| *.glb | Mixamo 3Dキャラクターモデル | プレイヤー・鬼キャラのGLBモデルファイル |
| FALL_DODGE_仕様書.md | FALL DODGEの仕様書 | デザイン体系・UI構成・マルチプレイ仕様のリファレンス |
| スクリーンショット（FALL DODGE） | FALL DODGEタイトル画面 | タイトル画面レイアウトの参照（ボタン順序・配色・構成を完全統一） |

■ 参照スキルファイル
| スキル | 用途 |
|--------|------|
| game-webapp-dev | Firebase同期、GameState設計、SyncLayer、CPU AI、ネオンUI |
| frontend-design | ビジュアル品質、グロー効果、モーション、サイバーパンクテーマ |

■ UI統一ルール（FALL DODGE / LINKED BLOCKS_ 共通）
本ゲームのタイトル画面・ロビー画面・リザルト画面は
FALL DODGEのスクリーンショットと完全に同一のレイアウト構成とする:
・マトリックス文字列背景（カタカナ+英数字、下方向スクロール）
  ※本ゲーム独自: 緑文字70% + 赤文字30%の混合（FALL DODGEは緑一色）
  ※赤い列はゆっくり脈動し、ホラー感を演出
  ※背景グラデーション: 上部暗緑 → 下部暗赤
・ドットマトリクス風タイトルロゴ（ネオングリーン、大文字、2行）
・ロゴ下にキャラクター横並び（4色）
・中央ネオン枠パネル内にボタン縦配置
・USER NAME入力 → 登録/ゲスト → モード選択 → ルール/ランキングの順序固定
・スコアアタックはゴールド枠（#ffcc00）
・フッターに言語切替（日本語/English）+ BGM ON/OFF
・全ボタンにホバーグロー + 浮き上がりアニメーション
・パネル枠は緑基調だが、ホバー時に赤のグロー要素を微量追加


================================
33. 設計思想まとめ
================================
本ゲームは、
・LINKED BLOCKS_ / FALL DODGE と同一のデザイン体系を継承
・タイトル画面・ロビー・リザルトのレイアウトを完全統一（ユーザーが迷わないUX）
・Firebase Realtime Databaseで完結するリアルタイム同期
・単一HTMLファイルで完全動作
・Three.js r128による本格3D一人称ホラー体験
・Mixamo GLBモデルによるリアルな敵キャラクター（ステージごとに異なる鬼）
・BFSパスファインディングによる追跡AI（マルチフロア対応3D BFS）
・マルチフロア立体迷路（1F〜3F、階段で接続、ステージ進行で立体化）
・全ステージ「制限時間付き脱出」で統一（鬼から逃げながら出口を探す）
・5ステージ制の段階的難易度上昇（迷路サイズ・鬼の数・フロア数が増加）
・スコアアタックによるリプレイ性
・最大4人マルチプレイ（個人戦/チーム戦/協力、全モード5ステージ制）
・チーム戦ではプレイヤーが鬼側/逃げ側を選択可能（攻守交替対応）
・LINKED BLOCKS_ 同様のルームID/URL共有によるマルチプレイ
・心拍BPM、危険フレーム、足音による没入型ホラー演出
・CRTスキャンライン、ネオン照明、フォグによるサイバー世界観
・タイトル画面のマトリックス背景を全面赤色にしてホラー感を演出（他ゲームとの差別化）
・PC + スマホ両対応（バーチャルジョイスティック + タッチ視点）
・ナビゲーターシステムによるプレイヤーサポート（方向指示・敵警告・脱出ヒント、日英対応）
・日本語 / 英語 切替対応
・AI開発環境（Claude Code等）でそのまま実装可能な仕様記述

恐怖と緊張感を軸にした
3D体験型ホラー鬼ごっこゲームである。


════════════════════════════════════════════════════
APPENDIX A: 鬼モデル読み込みコード（Mixamo GLB方式）
════════════════════════════════════════════════════
以下は Red Demon.html から抽出した鬼キャラクターの完全なビルドコード。
セクション14の仕様に基づき、このコードを関数化してゲーム内に組み込む。
ゲーム内では createOniModel() 関数として使用すること。

```javascript
function createOniModel() {
    const SEG = 16;
    const M = new THREE.MeshStandardMaterial({
        color: 0xcc1818, roughness: 0.38, metalness: 0.05,
        emissive: 0x330000, emissiveIntensity: 0.15
    });

    const human = new THREE.Group();

    // ====== HEAD ======
    const headG = new THREE.Group();
    headG.position.y = 1.63;

    const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.2, SEG * 2, SEG), M);
    cranium.scale.set(0.92, 1.08, 0.96);
    cranium.castShadow = true;
    headG.add(cranium);

    const faceFront = new THREE.Mesh(new THREE.SphereGeometry(0.17, SEG, SEG), M);
    faceFront.position.set(0, -0.03, 0.06);
    faceFront.scale.set(0.88, 0.95, 0.45);
    headG.add(faceFront);

    const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.13, SEG, 10), M);
    jaw.position.set(0, -0.12, 0.04);
    jaw.scale.set(0.85, 0.65, 0.75);
    headG.add(jaw);

    const chin = new THREE.Mesh(new THREE.SphereGeometry(0.05, SEG, 8), M);
    chin.position.set(0, -0.18, 0.08);
    chin.scale.set(0.85, 0.6, 0.7);
    headG.add(chin);

    const browRidge = new THREE.Mesh(new THREE.SphereGeometry(0.1, SEG, 8), M);
    browRidge.position.set(0, 0.06, 0.14);
    browRidge.scale.set(1.6, 0.35, 0.5);
    headG.add(browRidge);

    const noseBridge = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.07, 8), M);
    noseBridge.position.set(0, 0.0, 0.2);
    noseBridge.rotation.x = -0.2;
    headG.add(noseBridge);
    const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), M);
    noseTip.position.set(0, -0.04, 0.22);
    noseTip.scale.set(1, 0.7, 0.8);
    headG.add(noseTip);

    for (const sx of [-1, 1]) {
        const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), M);
        cheek.position.set(sx * 0.12, -0.04, 0.1);
        cheek.scale.set(0.8, 0.7, 0.6);
        headG.add(cheek);
    }

    for (const sx of [-1, 1]) {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), M);
        ear.position.set(sx * 0.2, 0, 0);
        ear.scale.set(0.35, 1.1, 0.7);
        headG.add(ear);
    }

    const lipBump = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), M);
    lipBump.position.set(0, -0.1, 0.18);
    lipBump.scale.set(1.4, 0.5, 0.5);
    headG.add(lipBump);

    human.add(headG);

    // ====== NECK ======
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.12, SEG), M);
    neck.position.y = 1.46;
    neck.castShadow = true;
    human.add(neck);

    // ====== TORSO ======
    const upperChest = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.21, 0.2, SEG), M);
    upperChest.position.y = 1.32;
    upperChest.castShadow = true;
    human.add(upperChest);

    const chestFront = new THREE.Mesh(new THREE.SphereGeometry(0.19, SEG, SEG), M);
    chestFront.position.set(0, 1.28, 0.04);
    chestFront.scale.set(1.15, 0.55, 0.6);
    human.add(chestFront);

    for (const sx of [-1, 1]) {
        const pec = new THREE.Mesh(new THREE.SphereGeometry(0.1, SEG, 10), M);
        pec.position.set(sx * 0.08, 1.28, 0.08);
        pec.scale.set(1, 0.65, 0.6);
        human.add(pec);
    }

    const midTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.18, SEG), M);
    midTorso.position.y = 1.14;
    midTorso.castShadow = true;
    human.add(midTorso);

    const back = new THREE.Mesh(new THREE.SphereGeometry(0.18, SEG, 10), M);
    back.position.set(0, 1.22, -0.05);
    back.scale.set(1.1, 0.8, 0.5);
    human.add(back);

    const absTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.16, 0.15, SEG), M);
    absTorso.position.y = 1.0;
    absTorso.castShadow = true;
    human.add(absTorso);

    const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.1, SEG), M);
    waist.position.y = 0.9;
    human.add(waist);

    const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.18, SEG, 12), M);
    pelvis.position.y = 0.84;
    pelvis.scale.set(1.05, 0.5, 0.7);
    human.add(pelvis);

    for (const sx of [-1, 1]) {
        const glute = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), M);
        glute.position.set(sx * 0.06, 0.8, -0.06);
        glute.scale.set(1, 0.8, 0.9);
        human.add(glute);
    }

    for (const sx of [-1, 1]) {
        const delt = new THREE.Mesh(new THREE.SphereGeometry(0.085, SEG, 10), M);
        delt.position.set(sx * 0.24, 1.36, 0);
        delt.scale.set(0.9, 0.85, 0.8);
        delt.castShadow = true;
        human.add(delt);

        const trap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 0.15, 8), M);
        trap.position.set(sx * 0.12, 1.42, -0.02);
        trap.rotation.z = sx * 0.7;
        human.add(trap);
    }

    // ====== ARMS ======
    function buildArm(sign) {
        const g = new THREE.Group();

        const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.28, SEG), M);
        upper.position.set(sign * 0.27, 1.2, 0);
        upper.castShadow = true;
        g.add(upper);

        const bicep = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), M);
        bicep.position.set(sign * 0.27, 1.22, 0.02);
        bicep.scale.set(0.85, 1.2, 0.85);
        g.add(bicep);

        const tricep = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), M);
        tricep.position.set(sign * 0.27, 1.18, -0.025);
        tricep.scale.set(0.8, 1.1, 0.75);
        g.add(tricep);

        const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.045, SEG, 10), M);
        elbow.position.set(sign * 0.27, 1.04, 0);
        g.add(elbow);

        const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.048, 0.27, SEG), M);
        fore.position.set(sign * 0.27, 0.88, 0);
        fore.castShadow = true;
        g.add(fore);

        const foreMuscle = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), M);
        foreMuscle.position.set(sign * 0.27, 0.93, 0.01);
        foreMuscle.scale.set(0.85, 1.4, 0.8);
        g.add(foreMuscle);

        const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.033, 0.04, 10), M);
        wrist.position.set(sign * 0.27, 0.73, 0);
        g.add(wrist);

        const palm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.085, 0.028), M);
        palm.position.set(sign * 0.27, 0.665, 0);
        g.add(palm);

        const palmFlesh = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), M);
        palmFlesh.position.set(sign * 0.27, 0.665, 0.005);
        palmFlesh.scale.set(0.9, 1.2, 0.5);
        g.add(palmFlesh);

        for (let f = 0; f < 4; f++) {
            const finger = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.009, 0.065, 6), M);
            finger.position.set(sign * (0.248 + f * 0.015), 0.59, 0);
            g.add(finger);
            const tip = new THREE.Mesh(new THREE.SphereGeometry(0.009, 6, 6), M);
            tip.position.set(sign * (0.248 + f * 0.015), 0.555, 0);
            g.add(tip);
        }

        const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.011, 0.05, 6), M);
        thumb.position.set(sign * (sign === 1 ? 0.3 : 0.24), 0.635, 0.02);
        thumb.rotation.z = sign * -0.5;
        thumb.rotation.x = -0.3;
        g.add(thumb);
        const thumbTip = new THREE.Mesh(new THREE.SphereGeometry(0.011, 6, 6), M);
        thumbTip.position.set(sign * (sign === 1 ? 0.31 : 0.23), 0.615, 0.028);
        g.add(thumbTip);

        return g;
    }
    human.add(buildArm(-1));
    human.add(buildArm(1));

    // ====== LEGS ======
    function buildLeg(sign) {
        const g = new THREE.Group();

        const hip = new THREE.Mesh(new THREE.SphereGeometry(0.065, SEG, 10), M);
        hip.position.set(sign * 0.09, 0.78, 0);
        g.add(hip);

        const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.35, SEG), M);
        thigh.position.set(sign * 0.1, 0.58, 0);
        thigh.castShadow = true;
        g.add(thigh);

        const quad = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), M);
        quad.position.set(sign * 0.1, 0.62, 0.03);
        quad.scale.set(0.9, 1.5, 0.75);
        g.add(quad);

        const ham = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), M);
        ham.position.set(sign * 0.1, 0.6, -0.03);
        ham.scale.set(0.85, 1.3, 0.7);
        g.add(ham);

        const inner = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), M);
        inner.position.set(sign * 0.07, 0.65, 0);
        inner.scale.set(0.6, 1.3, 0.8);
        g.add(inner);

        const knee = new THREE.Mesh(new THREE.SphereGeometry(0.048, SEG, 10), M);
        knee.position.set(sign * 0.1, 0.39, 0);
        g.add(knee);

        const kneecap = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), M);
        kneecap.position.set(sign * 0.1, 0.39, 0.04);
        kneecap.scale.set(0.9, 0.8, 0.5);
        g.add(kneecap);

        const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.34, SEG), M);
        shin.position.set(sign * 0.1, 0.2, 0);
        shin.castShadow = true;
        g.add(shin);

        const calf = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 8), M);
        calf.position.set(sign * 0.1, 0.28, -0.025);
        calf.scale.set(0.8, 1.5, 0.8);
        g.add(calf);

        const shinFront = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), M);
        shinFront.position.set(sign * 0.1, 0.24, 0.02);
        shinFront.scale.set(0.7, 1.8, 0.5);
        g.add(shinFront);

        const ankle = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), M);
        ankle.position.set(sign * 0.1, 0.03, 0);
        g.add(ankle);

        const achilles = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.028, 0.08, 8), M);
        achilles.position.set(sign * 0.1, 0.06, -0.02);
        g.add(achilles);

        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.045, 0.18), M);
        foot.position.set(sign * 0.1, 0.0, 0.03);
        foot.castShadow = true;
        g.add(foot);

        const footTop = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), M);
        footTop.position.set(sign * 0.1, 0.025, 0.04);
        footTop.scale.set(0.9, 0.45, 1.5);
        g.add(footTop);

        const toeArea = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), M);
        toeArea.position.set(sign * 0.1, 0.01, 0.11);
        toeArea.scale.set(1, 0.45, 0.6);
        g.add(toeArea);

        const heel = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 6), M);
        heel.position.set(sign * 0.1, 0.015, -0.05);
        heel.scale.set(0.85, 0.5, 0.7);
        g.add(heel);

        return g;
    }
    human.add(buildLeg(-1));
    human.add(buildLeg(1));

    // ====== 暗所視認用内部ライト ======
    const innerLight = new THREE.PointLight(0xff2020, 1.5, 4);
    innerLight.position.set(0, 1.1, 0);
    human.add(innerLight);

    const headLight = new THREE.PointLight(0xff2020, 3, 18);
    headLight.position.set(0, 2.5, 0);
    human.add(headLight);

    const bodyLight = new THREE.PointLight(0xff1010, 2, 12);
    bodyLight.position.set(0, 1.2, 0.3);
    human.add(bodyLight);

    const faceLight = new THREE.PointLight(0xff2020, 1.5, 8);
    faceLight.position.set(0, 1.63, 0.3);
    human.add(faceLight);

    // headGへの参照をグループに保持（呼吸アニメーション用）
    human.userData.headGroup = headG;
    human.userData.chestMesh = upperChest; // 呼吸アニメーション対象

    return human;
}
```

使用例：
```javascript
// ゲーム初期化時
const oniGroup = createOniModel();
oniGroup.position.set(spawnX, 0, spawnZ);
scene.add(oniGroup);

// 歩行アニメーション（メインループ内）
function animateOniWalk(oni, time, speed) {
    const swing = Math.sin(time * speed * 3) * 0.4;
    // 脚を前後にスイング（左右の子Group内の脚パーツを操作）
    // 腕を逆位相でスイング
    // 呼吸: upperChest の scaleY を 1.0 ↔ 1.03 で変動
    oni.userData.chestMesh.scale.y = 1.0 + Math.sin(time * 1.5) * 0.015;
}

// 常にプレイヤー方向を向く
oniGroup.rotation.y = Math.atan2(
    player.position.x - oniGroup.position.x,
    player.position.z - oniGroup.position.z
);
```


════════════════════════════════════════════════════
APPENDIX B: 定数・パラメータ クイックリファレンス
════════════════════════════════════════════════════

■ 迷路パラメータ
```javascript
const CL = 4;        // セル幅(m)
const WH = 3.5;      // 壁高(m)
const FLOOR_H = 4;   // フロア間高(m)
const WALL_THICK = 0.15; // 壁厚(m)
```

■ ステージ定数
```javascript
const STAGES = [
    { id: 1, type: 'escape',   cols: 10, rows: 10, floors: 1, oniCount: 1, time: 75,  speedMul: 1.0, stairs: 0,   fogDensity: 0.010, lights: 50, exitHint: true },
    { id: 2, type: 'escape',   cols: 12, rows: 12, floors: 1, oniCount: 1, time: 90,  speedMul: 1.0, stairs: 0,   fogDensity: 0.012, lights: 40, exitHint: true },
    { id: 3, type: 'escape',   cols: 16, rows: 16, floors: 2, oniCount: 2, time: 100, speedMul: 1.2, stairs: 2,   fogDensity: 0.014, lights: 30, exitHint: false },
    { id: 4, type: 'escape',   cols: 20, rows: 20, floors: 2, oniCount: 3, time: 120, speedMul: 1.3, stairs: 3,   fogDensity: 0.018, lights: 20, exitHint: false },
    { id: 5, type: 'escape',   cols: 24, rows: 24, floors: 3, oniCount: 4, time: 150, speedMul: 1.5, stairs: 5,   fogDensity: 0.022, lights: 10, exitHint: false },
];

// 隠しステージ（通常のSTAGES配列には含めない。解放後に追加）
const HIDDEN_STAGE = {
    id: '???', type: 'escape', cols: 28, rows: 28, floors: 3, oniCount: 5, time: 120,
    speedMul: 1.6, stairs: 6, fogDensity: 0.15, lights: 0,
    fakeExits: 2,          // フェイク出口の数
    exitWarpInterval: 20,  // 出口ワープ間隔（秒）
    hidden: true,
};
```

■ 隠しステージ解放コマンド
```javascript
const HIDDEN_COMMAND = 'AWDS';  // ユーザー名入力欄に入力
```

■ プレイヤーパラメータ
```javascript
const PLAYER = {
    normalSpeed: 4.5,      // m/s
    sprintSpeed: 8.0,      // m/s
    stairSpeedMul: 0.8,    // 階段上速度倍率
    stamina: 100,
    staminaDrain: 25,      // /秒（スプリント中）
    staminaRecover: 12,    // /秒（通常時）
    collisionRadius: 0.3,  // m
    catchDistance: 1.2,     // m
    cameraHeight: 1.7,     // m
    fovNormal: 60,
    fovSprint: 70,
};
```

■ 鬼パラメータ
```javascript
const ONI = {
    baseSpeed: 3.2,        // m/s
    stairSpeedMul: 0.7,    // 階段上速度倍率
    pathRecalcInterval: 0.5, // 秒
    catchDistance: 1.2,     // m
    materialColor: 0xcc1818,
    emissiveColor: 0x330000,
};
```

■ プレイヤーカラー
```javascript
const PLAYER_COLORS = [
    { name: 'P1', color: 0xff3296, label: 'ピンク' },
    { name: 'P2', color: 0x00dcff, label: 'シアン' },
    { name: 'P3', color: 0xffdc00, label: 'イエロー' },
    { name: 'P4', color: 0xb450ff, label: 'パープル' },
];
```

■ HUD距離色閾値
```javascript
const DISTANCE_COLORS = {
    safe:   { threshold: 15, color: '#00ff41' }, // 緑 >15m
    medium: { threshold: 8,  color: '#ffaa00' }, // 橙 8-15m
    danger: { threshold: 0,  color: '#ff0040' }, // 赤 <8m
};
```

■ 危険フレーム閾値
```javascript
const DANGER_FRAME = {
    yellow: { minDist: 6, maxDist: 12, color: 'rgba(255, 200, 0, *)' },  // 黄色フレーム: 12m〜6m
    red:    { minDist: 0, maxDist: 6,  color: 'rgba(255, 0, 0, *)' },    // 赤フレーム: 6m以内
    pulse:  { threshold: 3, speed: '0.3s' },                              // 3m以内で点滅
};
```

■ 心拍BPM
```javascript
const BPM = {
    min: 72,
    max: 160,
    maxDistance: 30, // この距離以上で最小BPM
};
```

■ 鬼足音距離テーブル
```javascript
const ONI_FOOTSTEP = [
    { maxDist: Infinity, minDist: 15, volume: 0,    tempo: 0 },
    { maxDist: 15,       minDist: 10, volume: 0.1,  tempo: 500 },
    { maxDist: 10,       minDist: 5,  volume: 0.25, tempo: 400 },
    { maxDist: 5,        minDist: 2,  volume: 0.5,  tempo: 350 },
    { maxDist: 2,        minDist: 0,  volume: 0.8,  tempo: 300 },
];
// 別フロアの鬼: volume × 0.3 + lowpassフィルタ
```

■ ゲームモード定数
```javascript
const GAME_MODES = {
    story:       { label: 'ストーリー',     labelEn: 'Story',       solo: true,  multi: false, maxPlayers: 1, stages: 5 },
    scoreAttack: { label: 'スコアアタック',   labelEn: 'Score Attack', solo: true,  multi: false, maxPlayers: 1, stages: Infinity },
    freeForAll:  { label: '個人戦',         labelEn: 'Free for All', solo: false, multi: true,  maxPlayers: 4, minPlayers: 2, stages: 5, hasExit: true,  hasCpuOni: true },
    teamBattle:  { label: 'チーム戦',       labelEn: 'Team Battle',  solo: false, multi: true,  maxPlayers: 4, minPlayers: 2, stages: 5, hasExit: false, hasCpuOni: false },
    coop:        { label: '協力',           labelEn: 'Co-op',       solo: false, multi: true,  maxPlayers: 4, minPlayers: 2, stages: 5, hasExit: true,  hasCpuOni: true },
};
```

■ チーム戦パラメータ
```javascript
const TEAM_BATTLE = {
    // 鬼チーム（赤）
    oniCameraHeight: 3.0,         // 三人称カメラ高さ(m)
    oniCameraDistance: 2.0,        // 三人称カメラ距離(m)
    oniFlashlightColor: 0xff2020,  // 赤フラッシュライト
    oniEmissiveColor: 0xff2020,    // モデル発光色（赤）
    oniEmissiveIntensity: 0.4,     // 暗闇で目立つ
    oniSprintEnabled: false,       // 鬼側スプリント無効
    oniStaminaEnabled: false,      // 鬼側スタミナ無効
    oniZoneRadarCells: 8,          // ゾーンレーダー精度（8セル単位）
    oniZoneRadarInterval: 20000,   // ゾーンレーダー更新間隔(ms)
    oniDistanceUpdateInterval: 5000, // 距離表示更新間隔(ms)

    // 逃げチーム（青）
    runnerFlashlightColor: 0x2060ff, // 青フラッシュライト
    runnerEmissiveColor: 0x2060ff,   // モデル発光色（青）
    runnerEmissiveIntensity: 0.15,   // 控えめ（見つかりにくい）

    // HUD色
    oniHudColor: '#ff2020',
    runnerHudColor: '#2060ff',
    oniBadge: '🔴 ONI',
    runnerBadge: '🔵 RUNNER',
    oniBadgeJa: '🔴 鬼',
    runnerBadgeJa: '🔵 逃走者',

    // ステージ構成（チーム戦専用）
    stages: [
        { id: 1, cols: 12, rows: 12, floors: 1, time: 60,  speedMul: 1.0, stairs: 0 },
        { id: 2, cols: 14, rows: 14, floors: 1, time: 75,  speedMul: 1.0, stairs: 0 },
        { id: 3, cols: 16, rows: 16, floors: 2, time: 75,  speedMul: 1.2, stairs: 2 },
        { id: 4, cols: 20, rows: 20, floors: 2, time: 90,  speedMul: 1.3, stairs: 3 },
        { id: 5, cols: 24, rows: 24, floors: 3, time: 90,  speedMul: 1.5, stairs: 5 },
    ],
};
```

■ 協力プレイパラメータ
```javascript
const COOP = {
    // ステージ構成（協力専用 — ソロStage3相当から開始）
    stages: [
        { id: 1, cols: 16, rows: 16, floors: 2, oniCount: 2, time: 100, speedMul: 1.2, stairs: 2, exitHint: false },
        { id: 2, cols: 20, rows: 20, floors: 2, oniCount: 3, time: 120, speedMul: 1.3, stairs: 3, exitHint: false },
        { id: 3, cols: 24, rows: 24, floors: 3, oniCount: 4, time: 130, speedMul: 1.5, stairs: 5, exitHint: false },
        { id: 4, cols: 24, rows: 24, floors: 3, oniCount: 5, time: 120, speedMul: 1.6, stairs: 5, exitHint: false },
        { id: 5, cols: 28, rows: 28, floors: 3, oniCount: 6, time: 150, speedMul: 1.8, stairs: 6, exitHint: false },
    ],
    proximityBuffRange: 8,         // 近接バフ範囲(m)
    proximityBuffStaminaMul: 1.5,  // スタミナ回復倍率
    pinDuration: 15000,            // ピンマーカー持続時間(ms)
    respawnOnNextStage: true,      // 次ステージで全員復活
    clearCondition: 'anyOneEscaped', // 1人でも脱出すればクリア
};

const QUICK_CHAT = {
    ja: { 1: 'こっち！', 2: '危険！', 3: '出口発見！', 4: '逃げろ！' },
    en: { 1: 'Over here!', 2: 'Danger!', 3: 'Exit found!', 4: 'Run!' },
};
```


════════════════════════════════════════════════════
APPENDIX C: 実装フェーズ チェックリスト
════════════════════════════════════════════════════

以下を上から順に実装。各フェーズが完了したら次へ進む。
数値はセクション30の番号に対応。

□ Phase 1: 基盤
  □ 1. HTMLスケルトン + 全screen DOM構造
  □ 2. CSS: ネオンテーマ全体（変数、ボタン、モーダル）
  □ 3. マトリックス背景アニメーション（緑70%+赤30%混合）
  □ 4. 画面遷移（showScreen / showModal）
  □ 5. 起動キャッチコピー演出

□ Phase 2: タイトル + ユーザー管理
  □ 6. タイトル画面UI全配置（FALL DODGE統一レイアウト）
  □ 7. Firebase初期化 + ユーザー登録/ゲスト処理
  □ 8. ランキングモーダル（Firebase取得・表示）
  □ 9. ルール説明モーダル
  □ 10. ゲームモード選択UI

□ Phase 3: 3D基盤（1F）
  □ 11. Three.js初期化（WebGLRenderer, Scene, Camera）
  □ 12. 迷路生成（Recursive Backtracker）+ 3Dメッシュ構築
  □ 13. 照明セットアップ（Ambient, Hemisphere, PointLights）
  □ 14. フォグ + CRTオーバーレイ
  □ 15. Pointer Lock + カメラ操作
  □ 16. プレイヤー移動（WASD / 矢印 + 壁衝突判定）
  □ 17. フラッシュライト
  □ 18. POV両手表示 + 歩行アニメーション

□ Phase 3.5: マルチフロア
  □ 19. マルチフロア迷路生成（floors配列）
  □ 20. 階段配置（通路セル、最低3セル間隔）
  □ 21. 階段3Dメッシュ（スロープ + ネオン手すり + 矢印ライト）
  □ 22. 全フロア3Dメッシュ配置（y = floor * FLOOR_H）
  □ 23. 天井メッシュ + 階段穴
  □ 24. プレイヤーY座標制御（updatePlayerY）
  □ 25. フロア切替判定
  □ 26. 階段上速度低下（×0.8）

□ Phase 4: 敵キャラクター
  □ 27. 鬼モデル読み込み（GLTFLoader + ステージ別GLBファイル）
  □ 28. 鬼マテリアル + 自己発光 + 専用PointLights
  □ 29. マルチフロアBFS（bfsPathfind3D）
  □ 30. 鬼の移動 + 壁衝突判定
  □ 31. 鬼のY座標制御（updateOniY、速度×0.7）
  □ 32. 鬼の歩行アニメーション
  □ 33. 鬼の向き更新（プレイヤー方向）

□ Phase 5: ゲームプレイ
  □ 34. 捕獲判定（同一フロア限定）+ 捕獲演出
  □ 35. HUD実装（スタミナ、タイマー、距離、BPM、危険フレーム、フロア表示）
  □ 36. ミニマップ実装（現在フロア表示 + 階段▲）
  □ 37. スプリント + スタミナシステム
  □ 38. 脱出ステージ（制限時間内に出口を見つけて脱出）
  □ 39. 脱出ステージ（EXIT配置、光柱、到達判定 — 同一フロア限定）
  □ 40. 脱出HUD（FIND EXIT + 距離+フロア）
  □ 41. Stage 5: EXITワープ（30秒ごと、フロア間ワープ）
  □ 42. ステージ制（5ステージ、全脱出統一）
  □ 43. リザルト画面（ゲームオーバー/クリア/脱出成功/時間切れ/全クリア）
  □ 44. スコアアタックモード

□ Phase 6: マルチプレイ
  □ 45. ロビー画面 + ルーム作成/参加 + URL共有
  □ 46. SyncLayer実装（currentFloor同期含む）
  □ 47. ホスト鬼AI → Firebase同期
  □ 48. ゲストの鬼受信 → 描画
  □ 49. プレイヤー位置相互同期
  □ 50. 勝敗判定（個人戦/チーム戦/協力）
  □ 51. 退席処理
  □ 52. 再戦 / 終了処理

□ Phase 7: 演出・サウンド
  □ 53. サウンド統合（BGM / SE / 心拍）
  □ 54. FootstepManager（歩行/スプリント/疲労/ブレーキ、Web Audio API）
  □ 55. 鬼の足音（距離連動、別フロア減衰）
  □ 56. ナビゲーターシステム（i18n、方向指示、行き止まり/経路ブロック検知）
  □ 57. 捕獲カメラ演出
  □ 58. ダストパーティクル
  □ 59. ライトちらつきアニメーション
  □ 60. 脱出成功演出

□ Phase 8: スマホ対応
  □ 61. バーチャルジョイスティック
  □ 62. タッチ視点操作
  □ 63. スプリントボタン
  □ 64. レスポンシブUI調整

□ Phase 9: 仕上げ
  □ 65. ランキング登録・表示
  □ 66. 多言語対応（日本語 / English 切替）
  □ 67. レスポンシブ最終調整
  □ 68. エッジケーステスト
  □ 69. パフォーマンス最適化（別フロアのライト制御等）

═══════════════════ 仕様書 終了 ═══════════════════
