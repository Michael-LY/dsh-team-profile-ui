# dsh-team-profile-ui 代码审核报告

- 审核对象：`dsh-team-profile-ui`（DSH 插件，非 git 仓库）
- 审核范围：`client.js`、`index.js`、`cordis.patch.yml`、`package.json`、`locale/en.json`、`locale/zh.json`、`README.md`
- 审核维度：正确性 / 健壮性 / 可访问性(a11y) / 边界条件 / i18n 一致性 / 代码规范
- 严重度：**Blocking**（阻断发布）> **High** > **Medium** > **Low**
- 说明：本项目体量小，未修改任何源码，仅输出本报告。

## 总览

| 级别 | 数量 | 编号 |
| --- | --- | --- |
| Blocking | 0 | — |
| High | 5 | H1–H5 |
| Medium | 4 | M1–M4 |
| Low | 8 | L1–L8 |
| 合计 | 17 | — |

> 结论：无严格意义上的 Blocking（现有功能在正常路径下可运行），但有 5 项 High 需要优先处理，主要集中在 **复制失败误报成功**、**i18n 文案双重维护 + 简报硬编码中文**、**列表 index key**、**package.json exports 与 bundle 入口一致性问题**、以及 **表单 a11y 缺失**。

---

## 一、必须修复

### H1 [High][正确性/健壮性] `fallbackCopy` 无条件回调成功
- 位置：`client.js:129-143`（`execCommand` 在 `137`，`catch` 在 `138-140`，`done()` 在 `142`）
- 问题：`document.execCommand('copy')` 的返回值被忽略，异常被 `catch` 静默吞掉后仍无条件执行 `done()`。即使复制实际失败，UI 也会把按钮文案切成「已复制」，属于**假成功**，会误导用户粘贴出空内容。
- 修复建议：
  1. 让 `fallbackCopy` 返回布尔结果：读取 `const ok = document.execCommand('copy')`，`catch` 中 `return false`，成功则 `return true`。
  2. 由 `copy()` 汇总结果：成功才 `setCopied(true)`；失败时 `setError(...)` 提示「复制失败，请手动选择文本复制」，并**不要**显示已复制。

### H2 [High][i18n 一致性] UI 文案与 locale 文件重复维护 + 生成简报硬编码中文
- 位置：
  - `client.js:8-42`（`en`/`zh` 内联字典，包含与 locale 文件重复的 `title`）
  - 对比 `locale/en.json:3`、`locale/zh.json:3`（`meta.title` 分别为 `Team builder` / `团队构建器`）
  - `client.js:183-196`（`generate()` 拼接的简报全为中文常量）
- 问题：
  1. 面板所有 UI 文案都写在 `client.js` 内的 `en`/`zh` 字典里，而 `locale/*.json` 只存 `meta`。同一批文案（如标题）在两个体系里各自维护，容易不同步；新增语言时也无统一入口。
  2. `generate()` 生成的简报文本（`请自动创建并使用一个智能体团队…` 等）**硬编码为中文**，当用户处于英文 locale 时，界面是英文但生成的简报仍是中文，体验割裂。
- 修复建议：
  - 将面板文案统一收敛到 locale 资源（如 `locale/en.json` / `locale/zh.json` 增加 `panel.*` 命名空间），`client.js` 通过 `tr()` 读取，避免双份字典。
  - 简报模板也走 i18n：为 `brief.goalPrefix`、`brief.memberHeader`、`brief.instructions[]` 等建立 key，按当前 locale 生成；或明确产品决策「简报固定中文」并在 README 注明。

### H3 [High][正确性/a11y] 成员列表使用数组 index 作为 React key
- 位置：`client.js:232-250`（`key: i` 在 `235`）
- 问题：`members.map((m, i) => h('div', { key: i, ... }))` 用下标作 key。删除中间行后，后续行 key 前移，React 复用同一 DOM 节点导致**受控输入值与 DOM 位置错位、光标跳动、焦点丢失**（尤其配合 `removeMember` 的 filter 逻辑）。这是典型的列表 key 反模式。
- 修复建议：为每个成员分配稳定唯一 id（如 `crypto.randomUUID()` 或递增计数器），存于成员对象 `{ id, name, role }`，渲染时 `key: m.id`，`removeMember` 按 `id` 过滤而非 index。

### H4 [High][正确性/打包] `package.json` 的 `exports` 未包含 bundle patch 入口
- 位置：`package.json:8-13`（`exports`）、`package.json:22-25`（`dsh.bundle.patch: "./cordis.patch.yml"`）、`package.json:17`（`files` 含 `cordis.patch.yml`）
- 问题：一旦声明了 `exports` 字段，Node 的包解析会**封闭子路径**：未在 `exports` 中列出的子路径（这里是 `./cordis.patch.yml`）将无法通过包名方式被 `require`/`import` 解析。`dsh.bundle.patch` 指向的正是该子路径，若加载器通过包 `exports` 解析（而非直接 `fs` 读文件），插件安装/加载会失败。`files` 里有但 `exports` 里没有，属于**exports/files 不一致**。同理 `./package.json` 也未导出（部分工具/元数据读取会用到）。
- 修复建议：
  - 二选一：① 若加载器走包解析，在 `exports` 增加 `"./cordis.patch.yml": "./cordis.patch.yml"`（及必要时 `"./package.json": "./package.json"`）；② 若加载器直接从包根读取文件，请在 README/注释注明该路径不经 `exports` 解析。
  - 建议保留 `files` 与 `exports` 的入口清单对齐，避免遗漏。

### H5 [High][a11y] 表单控件缺少可访问名称与标签关联
- 位置：
  - `client.js:218`（`label` 无 `htmlFor`）与 `client.js:219-225`（`textarea` 无 `id`）——标签与控件未程序化关联
  - `client.js:236-247`（成员姓名/职责两个 `input` 仅靠 `placeholder`，无 `<label>`/`aria-label`）
  - `client.js:248`（每行「移除」按钮文案完全相同，无区分）
- 问题：
  1. `label` 元素没有 `htmlFor`、控件没有 `id`，屏幕阅读器无法把「团队目标」标签读给 `textarea`。
  2. `placeholder` 不能作为可靠的可访问名称（输入后消失，部分读屏不朗读）。
  3. 多个「移除」按钮文本一致，使用读屏/键盘用户无法分辨删除的是哪一行。
- 修复建议：
  - 为 `textarea` 加 `id="tb-goal"`，`label` 加 `htmlFor="tb-goal"`。
  - 成员输入加 `aria-label`（如 `t('namePlaceholder')` / `t('rolePlaceholder')` 或带序号的标签），或包裹 `<label>`。
  - 移除按钮加 `aria-label`，包含行标识，如 `${t('remove')} ${m.name || index+1}`。

---

## 二、可选优化

### M1 [Medium][健壮性] `setTimeout` 未清理
- 位置：`client.js:200-211`（`setTimeout(() => setCopied(false), 1500)` 在 `204`）
- 问题：定时器句柄未保存、未在组件卸载或下次点击时清除。① 切换面板/卸载后仍可能触发 `setState`；② 快速多次点击「复制」会产生多个定时器，先前的定时器可能在新的复制后把「已复制」提前翻回，状态错乱。
- 修复建议：用 `useRef` 保存 timer id，回调前 `clearTimeout`；并在 `useEffect` 卸载时清理。

### M2 [Medium][a11y/UX] `disabled` 按钮的视觉与可访问反馈缺失
- 位置：`client.js:248`（`disabled: members.length <= 1`）配合 `client.js:105-112`（`S.ghost` 固定 `cursor: 'pointer'`）
- 问题：按钮被禁用时仍显示 `pointer` 手型光标（样式覆盖了浏览器默认的 `not-allowed`），且没有明显的禁用态视觉，用户会以为可点。原生 `disabled` 也无法被聚焦，读屏用户可能感知不到「为何不能删」。
- 修复建议：为禁用态增加独立样式（降透明度、`cursor: 'not-allowed'`）；如需保留可聚焦，改用 `aria-disabled` + 逻辑拦截；或对最后一名成员采用「隐藏删除按钮」避免歧义。

### M3 [Medium][a11y] 校验错误未通过 aria-live 播报
- 位置：`client.js:251`（`error ? h('p', { style: S.error }, error) : null`）
- 问题：错误提示只是普通文本节点，无 `role="alert"` / `aria-live`，屏幕阅读器不会在出现时主动朗读，用户（尤其键盘流）可能不知道生成失败的原因。
- 修复建议：给错误容器加 `role="alert"`（或 `aria-live="assertive"`），并在 `error` 变化时确保节点存在（可用固定容器 + 内容为空）。

### M4 [Medium][i18n] 预设名称/描述未本地化，与中文 persona 混排
- 位置：`cordis.patch.yml:18-19`（`name: Team builder`、`description: Lead agent that decomposes...` 为英文硬编码），`cordis.patch.yml:25-36`（persona 前缀为中文）
- 问题：预设选择器展示项固定英文，而 persona 内容为中文；中文用户看到英文预设名，英文用户又会得到中文 persona，语义混排。
- 修复建议：若预设元数据支持 i18n，改用本地化字段；否则统一为一种语言，并在 README 说明预设展示语言策略。

---

### L1 [Low][规范/健壮性] `document.execCommand` 已废弃、textarea 未设只读
- 位置：`client.js:129-143`（`execCommand('copy')` 在 `137`）
- 问题：`execCommand` 属废弃 API；且兜底 `textarea` 未设 `readOnly`/`aria-hidden`，移动端聚焦可能弹键盘、影响焦点。
- 修复建议：优先 `navigator.clipboard.writeText`（已有）；兜底方案给 `ta` 加 `readOnly`、`ta.setAttribute('aria-hidden','true')`、`tabIndex=-1`，复制后恢复原焦点。

### L2 [Low][a11y] 复制成功反馈缺少 aria-live 播报
- 位置：`client.js:256`（按钮文案 `copied ? t('copied') : t('copy')` 切换）
- 问题：文案切换本身不会被读屏主动播报，键盘用户可能不确定是否复制成功。
- 修复建议：增加一个视觉隐藏的 `aria-live="polite"` 状态区，复制成功时播报。

### L3 [Low][正确性/边界] 目标为空仍生成简报且无提示
- 位置：`client.js:185`（`'团队目标：' + (goal.trim() || '(未填写)')`）
- 问题：目标为空时静默用「(未填写)」占位生成，可能产出无意义简报。
- 修复建议：可选对空目标给出轻提示（不阻断），或在简报末尾提示「请补充目标」，与产品确认边界策略。

### L4 [Low][i18n] 错误信息在切换语言后不刷新
- 位置：`client.js:168`（`error` 存字符串）、`client.js:178`（存入 `t('empty')` 的快照）
- 问题：若用户先触发错误再切换 locale，已存的错误文本仍是旧语言。
- 修复建议：只存错误 key（如 `'empty'`），渲染时再 `t(errorKey)`。

### L5 [Low][规范] slot 注册 `id` / `key` 用法不一致
- 位置：`client.js:272-274`（侧边栏用 `id: 'team-builder'`）vs `client.js:281-283`（主面板用 `key: 'team-builder'`）
- 问题：两处 slot 注册分别使用 `id` 与 `key`，字段名不一致，易混淆或存在参数用错风险（取决于 slots API 约定）。
- 修复建议：核对 slots API 对 `id`/`key` 的语义，统一字段；若确为不同用途，加注释说明。

### L6 [Low][规范/文档] `index.js` 注释中的依赖包名与 README 不一致
- 位置：`index.js:4-8`（注释写 `dsh-experimental-agent-team-profile`、`tool-agent-team`）vs `README.md:22-24`（写 `dsh-experimental-agent-team`、`dsh-experimental-tool-agent-team`、`dsh-experimental-client-ui-agent-team`）
- 问题：同一依赖在代码注释与 README 中包名不一致，容易误导维护者。
- 修复建议：以实际依赖包的正式名称统一两处描述。

### L7 [Low][边界] 输入无长度限制
- 位置：`client.js:219-225`（目标 textarea）、`client.js:236-247`（成员 input）
- 问题：无 `maxLength`，超长输入可能生成超长简报，影响复制/回填体验。
- 修复建议：按需设置合理 `maxLength`（如目标 2000、姓名 64、职责 200），或在生成时截断。

### L8 [Low][打包] `exports` 未导出 `./package.json`
- 位置：`package.json:8-13`
- 问题：部分工具/宿主需要读取包元数据 `@local/dsh-team-profile-ui/package.json`，未导出时可能读取失败（与 H4 同源，单独列出）。
- 修复建议：如宿主需要，补 `"./package.json": "./package.json"`；与 H4 一并处理。

---

## 三、逐文件小结

- **client.js**：核心逻辑集中于此，问题最多（H1/H3/H5 + M1/M2/M3/L1–L3/L5/L7）。功能正常路径可用，但错误处理、a11y、列表 key 需重点整治。
- **index.js**：空 `apply()` 符合「Host 半边占位」设计；仅注释包名需与 README 对齐（L6）。
- **cordis.patch.yml**：结构合法；主要是预设元数据未本地化（M4），persona 与名称语言混排。
- **package.json**：`exports`/`files`/`dsh.bundle.patch` 的一致性是关键风险点（H4/L8）。
- **locale/en.json、zh.json**：结构一致，但仅为市场 `meta`；与 `client.js` 内联字典存在标题重复（H2）。
- **README.md**：整体清晰；依赖包名与 `index.js` 注释不一致（L6），建议补一句 locale/面板文案维护位置说明。

## 四、优先级建议

1. **先修 H1、H3、H5**：影响功能正确性与无障碍可用性，改动局部、收益高。
2. **再定 H2 策略**：文案/简报的 i18n 统一需要产品确认（简报是否必须本地化），是唯一需要决策的项。
3. **核实 H4**：需确认 DSH 加载器如何解析 `dsh.bundle.patch`，据此决定是否补 `exports`。
4. M/L 级可随优化迭代批量处理（尤其 M1 定时器清理、M3 aria-live，成本很低）。

---

# 复核结论（task-4）

- 复核时间：2026-11-11
- 复核对象：task-3 优化后的 `client.js`（383 行）、`index.js`、`package.json`；并抽查 `cordis.patch.yml`、`locale/*.json`
- 复核方式：逐行通读 + 对照原报告 + `node --check client.js`/`index.js`（均 exit 0）+ `JSON.parse(package.json)`（OK）
- 说明：本轮仅追加本结论章节，未改动任何源码。

## 一、逐项核对结果

| 编号 | 严重度 | 结论 | 核对说明 |
| --- | --- | --- | --- |
| H1 | High | ✅ 已修复 | `fallbackCopy` 现返回布尔值，`execCommand` 失败 `catch` 置 `false`，绝不再假成功；`copy()` 用 `succeed`/`fail` 分支，失败时提示 `copyFailed`（client.js:170-196, 264-289） |
| H2 | High | ✅ 已修复（按 Lead 裁决口径） | 简报全部改为 i18n：`briefIntro/briefGoalPrefix/briefGoalEmpty/briefMembersHeader/briefRoleSep/briefInstructionsHeader/briefStep1-4` 均已入 en/zh 字典并按 `t()` 生成（client.js:25-35,55-64,246-261）。Lead 裁决「只做简报本地化、不迁移字典」已满足，**字典仍内联符合裁决，不视为问题** |
| H3 | High | ✅ 已修复 | 成员对象改为 `{ id, name, role }`，稳定 id 生成器 `makeMember`；渲染 `key: m.id`；`removeMember`/`setField` 均按 `id` 操作（client.js:163-167, 234-237, 317, 324/332, 339） |
| H4 | High | ✅ 已修复 | `exports` 已补 `"./cordis.patch.yml": "./cordis.patch.yml"` 与 `"./package.json": "./package.json"`，与 `dsh.bundle.patch` 及 `files` 一致（package.json:13-14, 26） |
| H5 | High | ✅ 已修复 | `label htmlFor="tb-goal"` + `textarea id="tb-goal"`；成员输入加 `aria-label`（含序号）；移除按钮 `aria-label` 含成员名/序号（client.js:298-300, 323/331, 341） |
| M1 | Medium | ✅ 已修复 | 新增 `timerRef`，复制前 `clearTimeout`，`useEffect` 卸载清理（client.js:222-232, 269-273） |
| M2 | Medium | ✅ 已修复 | 新增 `ghostDisabled`（`cursor: not-allowed`、`opacity: 0.5`），`removeStyle` 按 `members.length<=1` 切换（client.js:136-144, 291, 338） |
| M3 | Medium | ✅ 已修复 | 错误节点加 `role="alert"` + `aria-live="assertive"`（client.js:347） |
| M4 | Medium | ❌ 未修复 | `cordis.patch.yml:18-19` 预设 `name`/`description` 仍英文硬编码，`persona` 仍中文；该文件不在本轮改动范围，保持原状 |
| L1 | Low | ✅ 已修复 | 兜底 textarea 加 `readOnly`/`aria-hidden`/`tabIndex=-1`，并恢复原焦点（client.js:175-178, 188-194） |
| L2 | Low | ❌ 未修复 | 复制成功仍仅切换按钮文案，无独立 `aria-live` 播报（client.js:352） |
| L3 | Low | ⏸ 维持现状 | 空目标仍以 `briefGoalEmpty` 占位生成，未加提示（client.js:249），属可选产品策略 |
| L4 | Low | ✅ 已修复 | `error` 改存 key（`'empty'`/`'copyFailed'`），渲染时 `t(error)`，切换语言可随之刷新（client.js:242,277,347） |
| L5 | Low | ❌ 未修复 | 侧边栏仍用 `id`、主面板仍用 `key`（client.js:370 vs 378），未统一 |
| L6 | Low | ❌ 未修复 | `index.js:5-6` 注释包名与 `README.md:22-24` 仍不一致 |
| L7 | Low | ✅ 已修复 | 目标 `maxLength=2000`、姓名 64、职责 200（client.js:303,321,329） |
| L8 | Low | ✅ 已修复 | 已导出 `./package.json`（同 H4，package.json:14） |

**必须修复项（H1–H5）：5/5 全部落实。**
可选优化项：M1/M2/M3 已修，M4 未修（非功能项）；L1/L4/L7/L8 已修，L2/L5/L6 未修，L3 维持现状。

## 二、新问题检查

- 语法/构建：`node --check client.js`、`node --check index.js` 均通过（exit 0）；`package.json` 为合法 JSON。未发现语法错误。
- 行为回退：`generate`/`copy`/`addMember`/`removeMember` 主流程逻辑保持；`error` 由「存文案」改为「存 key」后 `t(error)` 渲染正确；复制成功/失败分支闭合，未见回退。
- a11y：整体较原版明显改善；未见新引入的 a11y 缺陷。
- i18n：简报已随 locale 生成，未见新的中英错配。仅发现一处**低优先级**遗留：
  - N1 [Low][i18n] `client.js:253` 未命名成员的兜底名 `'member-' + (i+1)` 为硬编码英文，中文 locale 下仍显示 `member-1`，建议后续改为 `t('memberPrefix')` 或直接使用序号。

## 三、放行判断

**建议放行：可提交并推送。**

理由：全部 High（H1–H5）与关键 Medium（M1–M3）已正确修复，语法与行为校验通过，未引入阻断性新问题；H4 的 `exports` 已正确补 `./cordis.patch.yml` 与 `./package.json`。剩余项均非阻断。

## 四、仍需处理项（建议记录，不阻断本轮提交）

1. **M4**：`cordis.patch.yml` 预设名称/描述本地化（Medium）——若不打算改，请在 README 注明预设展示语言策略后明确接受。
2. **L2**：复制成功补 `aria-live` 播报（Low）。
3. **L5**：核对 slots API 后统一 `id`/`key`（Low）。
4. **L6**：`index.js` 注释包名与 README 对齐（Low）。
5. **N1**：简报未命名成员兜底名本地化（Low）。
6. **L3**：空目标提示策略（Low，产品确认）。
