# 前測 1.1：VR 桌面任務提示偏好問卷

## 資料夾內容

| 檔案 | 用途 |
|---|---|
| `index.html` | 問卷頁面 |
| `app.js` | 題目、流程與送出方式（要改題目就改這裡） |
| `config.js` | 填入 Google Apps Script 的網址，**上線前一定要改** |
| `videos/` | 13 段提示影片（p01～p13） |
| `thumbs/` | 排序題用的影片截圖 |
| `apps-script/Code.gs` | 貼進 Google 試算表的程式，用來接收答案；**不用上傳到 GitHub** |

## 一、建立接收答案的 Google 試算表

1. 到 Google 雲端硬碟新增一份試算表，命名為「前測 1.1 回收資料」。
2. 上方選單點「擴充功能 → Apps Script」。
3. 把原本的程式碼全部刪掉，貼上 `apps-script/Code.gs` 的內容，按儲存。
4. 右上角「部署 → 新增部署作業」，類型選「網頁應用程式」：
   - 執行身分：**我**
   - 誰可以存取：**所有人**
5. 按「部署」，第一次會要求授權：選你的帳號 →「進階」→「前往（不安全）」→「允許」。這是因為程式是你自己寫的、還沒經過 Google 審核，屬於正常現象。
6. 複製「網頁應用程式網址」（以 `/exec` 結尾）。在瀏覽器打開這個網址，看到「資料接收網址運作中」就代表成功。

## 二、把網址填進 config.js

用記事本打開 `config.js`，把網址貼進引號：

```js
window.SURVEY_ENDPOINT = "https://script.google.com/macros/s/AKfycb.../exec";
```

## 三、上傳到 GitHub

1. 到 github.com 註冊並登入。
2. 右上角「+ → New repository」：
   - Repository name：例如 `vr-cue-survey`（會出現在網址裡）
   - 選 **Public**（免費帳號的 GitHub Pages 需要公開）
   - 按「Create repository」
3. 在新的 repository 頁面點「uploading an existing file」。
4. 把 `index.html`、`app.js`、`config.js`、`README.md` 和 `videos`、`thumbs` 兩個資料夾一起拖進去（`apps-script` 資料夾不用傳）。
5. 等上傳完成，按下方綠色的「Commit changes」。

## 四、開啟 GitHub Pages

1. 在 repository 上方點「Settings」，左側選「Pages」。
2. Source 選「Deploy from a branch」，Branch 選 `main`、資料夾選 `/ (root)`，按「Save」。
3. 等 1～2 分鐘後重新整理，頁面上方會出現網址：
   `https://你的帳號.github.io/vr-cue-survey/`

## 五、正式發放前

1. 自己用手機和電腦各填一次，確認試算表的「回收資料」分頁有出現新的一列。
2. 找 2～3 位同學試填，確認時間、影片與題目都沒問題。
3. 把測試的資料列刪掉（標題列保留），再正式發放網址。

## 之後要修改

- **改題目或文字**：在 GitHub 上點 `app.js` → 鉛筆圖示 → 修改 → Commit changes，約 1 分鐘後生效。
- **換影片**：用相同檔名（例如 `p07.mp4`）重新上傳覆蓋即可。
- **重新部署 Apps Script**：如果改了 `Code.gs`，要用「部署 → 管理部署作業 → 編輯 → 版本選『新版本』」，網址才會維持不變。

## 資料欄位說明（第 2 版）

- 問卷分 5 類、每類一頁，依固定順序呈現：語音 → 傳統方式 → 過程演示 → 結果演示 → 自行探索。
- `P1_U1`～`P13_U4`：每段影片的 UEQ-S 實用面 4 題原始分數（1～7）。U1 妨礙的－支持的、U2 複雜的－簡單的、U3 沒效率的－有效率的、U4 令人困惑的－清楚的。分析時減 4 換成 −3～+3，4 題平均即為「實用面分數」。
- `D1_最喜歡的類別`：受測者最喜歡的類別名稱；`D2_原因`、`D3_其他建議`：開放題。
- `各頁秒數`、`作答秒數`：可用來排除作答過快的問卷。
- 從第 1 版換到第 2 版時，請先刪除試算表中舊的「回收資料」分頁，程式會依新欄位重新建立。

## 題目來源

- UEQ-S 實用面量表：Schrepp, M., Hinderks, A., & Thomaschewski, J. (2017). Design and evaluation of a short version of the User Experience Questionnaire (UEQ-S). *International Journal of Interactive Multimedia and Artificial Intelligence, 4*(6), 103–108. https://doi.org/10.9781/ijimai.2017.09.001
