# Seminar 工具：收集哪些数据？会不会影响以前的数据？

## 一、这次会收集哪些数据？

### 1. Supabase 表（pilot 项目，仅 seminar 专用表）

#### `seminar_sessions`（每人一行）
| 字段 | 含义 |
|------|------|
| participant_name | 匿名 ID（如 ER04LF09） |
| saw_tutorial | 是否被随机到看教程（true/false） |
| video_id | 选择的视频（video1～video4） |
| survey_verification_code | 问卷验证码（如 628034，在点击「继续到 Post-Survey」时写入） |
| created_at / updated_at | 首次/最后更新时间 |

#### `seminar_reflections`（每次生成反馈一行；最后提交会更新 submitted_at）
| 字段 | 含义 |
|------|------|
| participant_name | 匿名 ID |
| video_id | 视频 ID |
| reflection_text | 反思原文（含最后提交时的文本） |
| analysis_percentages | D/E/P 分析结果（JSON） |
| weakest_component | 最弱维度 |
| feedback_extended | AI 反馈（学术版） |
| feedback_short | AI 反馈（简短版） |
| revision_number | 版本号（当前为 1） |
| submitted_at | 最后提交时间（点击「继续到 Post-Survey」时写入） |
| created_at | 创建时间 |

#### `seminar_user_events`（timeline 事件流）
| 字段 | 含义 |
|------|------|
| participant_name | 匿名 ID |
| event_type | 事件类型（见下表） |
| event_data | JSON（含 video_id、duration_seconds、style、concept_name 等） |
| timestamp_utc | 时间戳 |
| reflection_id | 关联的 reflection（若有） |

**事件类型示例：**
- `datacollection_continue`：点击数据收集页「继续」
- `id_entered`：输入匿名 ID 并继续
- `video_selected`：选择视频并继续
- `tutorial_page_shown`：进入教程页
- `tutorial_completed`：看完教程并继续
- `task_page_shown`：进入任务页（反思+反馈）
- `feedback_generated_successfully`：生成反馈成功
- `view_feedback_start`：开始看反馈（含 style: extended/short）
- `view_feedback_end`：结束看反馈（含 **duration_seconds** 阅读时间）
- `concept_explanation_clicked`：点击概念/反馈区块（Description / Explanation / Prediction）
- `final_submission`：点击「继续到 Post-Survey」（最后提交的反思）
- `post_survey_link_clicked`：前往问卷（含 survey_verification_code 628034）

### 2. 不在此后台收集的

- **问卷具体答案**：在 Qualtrics（SV_9ZiPKf0uGc7ZKOW），验证码 628034 会写入 `seminar_sessions.survey_verification_code` 和事件 `post_survey_link_clicked`。
- **视频观看 trace**：本站在 seminar 中不嵌入视频，不记录看视频行为；仅记录「选了哪个 video_id」。

---

## 二、会影响以前的数据吗？**不会。**

- Seminar 只使用三张**新表**：`seminar_sessions`、`seminar_reflections`、`seminar_user_events`。
- **不读取、不修改** pilot 或任何其他项目里已有的表和数据。
- 与以前的数据收集完全隔离。
