# 部署指南：INFER Seminar Tool（GitHub + Supabase + Render）

按下面顺序做即可：先 Supabase 建表，再 GitHub 建仓并推送，最后在 Render 上建静态站点并绑定仓库。

---

## 一、Supabase（用 **pilot study** 项目，不用 Till 的主实验库）

Seminar 使用**以前 pilot study 的 Supabase 项目**（和 `infer-task-survey-version` / 根目录 `app-base.js` 用的同一个），只建一张新表 `seminar_sessions`。

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)，进入 **pilot study** 项目（URL 里是 `immrkllzjvhdnzesmaat`，不是 Till 的 `cvmzsljalmkrehfkqjtc`）。
2. 左侧 **SQL Editor** → **New query**。
3. 把本仓库里的 **`SEMINAR_SUPABASE_TABLE.sql`** 整段复制进去，点 **Run**。
4. 若报错 `EXECUTE FUNCTION` 不存在，把最后一句改成：
   ```sql
   EXECUTE PROCEDURE seminar_sessions_updated_at();
   ```
   再运行一次。
5. 左侧 **Table Editor** 里应能看到表 **seminar_sessions**（`participant_name`, `saw_tutorial`, `video_id`, `created_at`, `updated_at`）。

**不需要**改环境变量：app.js 里已经写好了 pilot study 项目的 `SUPABASE_URL` 和 `SUPABASE_KEY`。

---

## 二、GitHub（新仓库，只放 seminar 网站）

1. **在 GitHub 上建新仓库**
   - 例如名字：`infer-seminar-tool`
   - 选 **Public**，**不要**勾 “Add a README” （本地已有代码）。
   - 创建后记下仓库地址，例如：`https://github.com/SiruiruiRen/infer-seminar-tool.git`。

2. **在本地只推送 seminar 这个文件夹**
   在终端执行（把路径和仓库地址换成你的）：

   ```bash
   cd /Users/sirui/Desktop/tubigen/infer-seminar-tool

   git init
   git add .
   git commit -m "Initial commit: INFER seminar tool"
   git branch -M main
   git remote add origin https://github.com/SiruiruiRen/infer-seminar-tool.git
   git push -u origin main
   ```

   若已有 `git init` 且已经 `add`/`commit` 过，只需：

   ```bash
   cd /Users/sirui/Desktop/tubigen/infer-seminar-tool
   git remote add origin https://github.com/SiruiruiRen/infer-seminar-tool.git
   git push -u origin main
   ```

3. 之后每次改代码：
   ```bash
   git add .
   git commit -m "描述你的修改"
   git push
   ```

---

## 三、Render（新 Static Site，新 URL）

1. 登录 [Render](https://render.com) → **Dashboard** → **New +** → **Static Site**。

2. **Connect repository**
   - 选 **Connect a repository**，连你的 GitHub。
   - 选中刚建的 **infer-seminar-tool** 仓库（不要选 Till 实验的 assignment/alpha/beta/gamma 仓库）。

3. **配置**
   - **Name**：例如 `infer-seminar-tool`（会出现在 URL 里：`https://infer-seminar-tool.onrender.com`，或你自定义的域名）。
   - **Branch**：`main`。
   - **Build Command**：留空（纯静态，无需 build）。
   - **Publish Directory**：填 `.`（根目录，因为 `index.html` 在根目录）。
   - **Environment**：**不需要添加任何环境变量**（见下方说明）。

4. 点 **Create Static Site**，等第一次部署完成。

---

### 为什么 Render 上不用加环境变量？

- **这是纯静态站点**：Render 只负责把仓库里的 HTML/JS/CSS/资源原样发给浏览器，没有 Node 或后端进程，所以没有“服务器端环境变量”这一层。
- **Supabase**：`SUPABASE_URL` 和 `SUPABASE_KEY`（anon 公钥）已经写在 **app.js** 里。前端用 anon key 是 Supabase 的常规做法，依赖 RLS 保护数据，不需要也不适合再在 Render 配一遍。
- **GPT API**：Seminar 不直接调 OpenAI，而是请求你们自己的 **CORS 代理**（`tubingen-feedback-cors-proxy.onrender.com`），由代理再调 GPT。**API Key 只配在 CORS 代理那个服务上**，seminar-tool 这个 Static Site 不碰 API Key，所以 Render 上不用配 GPT 相关变量。

总结：**在 Render 的 infer-seminar-tool Static Site 里，不用加 GPT、Supabase 等环境变量。**

5. 部署好后，在 Static Site 页面顶部会看到 **URL**，例如：
   `https://infer-seminar-tool.onrender.com`  
   用这个链接给 Kathleen 的 seminar 使用即可。

6. （可选）**自定义域名**  
   在 Static Site → **Settings** → **Custom Domains** 里添加你自己的域名，按提示在域名服务商处加 CNAME 即可。

---

## 四、检查清单

- [ ] Supabase 里已存在表 **seminar_sessions**，且能打开 Table Editor 查看。
- [ ] GitHub 上有 **infer-seminar-tool** 仓库，代码已 push（含 `index.html`, `app.js`, `styles.css`, PDF、图片、视频等）。
- [ ] Render 上建的是 **Static Site**，连接的仓库是 **infer-seminar-tool**，Publish Directory 为 **`.`**。
- [ ] 用 Render 给的 URL 打开网站：能先看到 Data collection 页 → 填 ID → 选视频 →（随机）tutorial → 反思 + 生成反馈 → Post-survey 说明与验证码 628034。
- [ ] 在 Supabase → **Table Editor** → **seminar_sessions** 里能看到测试时写入的 `participant_name`、`saw_tutorial`、`video_id` 等。

---

## 五、和 Till 实验的关系（不要搞混）

| 项目 | Till 主实验 | Seminar（本仓库） |
|------|-------------|-------------------|
| GitHub 仓库 | assignment / alpha / beta / gamma 各自或同一仓库 | **单独** `infer-seminar-tool` |
| Render | 各一个 Web Service / Static Site | **单独**一个 Static Site（不同 URL） |
| Supabase | Till 主实验项目（cvmzsljalmkrehfkqjtc） | **Pilot study 项目**（immrkllzjvhdnzesmaat），只用 **seminar_sessions** 表 |
| Qualtrics | Till 的问卷与验证码 | 本工具用 **SV_9ZiPKf0uGc7ZKOW**，验证码 **628034** |

这样部署后，Seminar 和 Till 的实验在代码、URL、数据表上都是分开的，只有 Supabase 项目共用。
