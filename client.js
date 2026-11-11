window.__ModuleLoader__.load({
  id: '@local/dsh-team-profile-ui',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const NS = 'team-profile-ui';

    const en = {
      title: 'Team builder',
      subtitle: 'Compose a team brief, then hand it to a session running the Team builder preset.',
      goalLabel: 'Team goal',
      goalPlaceholder: 'What should the team accomplish?',
      membersLabel: 'Members',
      addMember: 'Add member',
      namePlaceholder: 'Teammate name (kebab-case)',
      rolePlaceholder: 'Responsibility / focus',
      remove: 'Remove',
      generate: 'Generate brief',
      previewLabel: 'Team brief',
      copy: 'Copy brief',
      copied: 'Copied',
      hint: 'Create a New Session, pick the "Team builder" preset, and paste this brief. The Lead agent spawns the teammates and builds the shared task board.',
      empty: 'Add at least one member.',
      copyFailed: 'Copy failed. Please select the text and copy it manually.',
      briefIntro: 'Automatically create and use an agent team to complete the task below.',
      briefGoalPrefix: 'Team goal: ',
      briefGoalEmpty: '(not provided)',
      briefMembersHeader: 'Members and responsibilities:',
      briefRoleSep: ': ',
      briefInstructionsHeader: 'Execution requirements:',
      briefStep1: '1. Plan the work first, splitting it into subtasks that can run in parallel or in order.',
      briefStep2: '2. Use spawn_teammate to create the teammates listed above, each with a clear scope.',
      briefStep3: '3. Use team_task_create to build a shared task board, stating dependencies and write scopes.',
      briefStep4:
        "4. Coordinate progress with send_message / wait_agent, then summarize all members' results and give a conclusion.",
    };

    const zh = {
      title: '团队构建器',
      subtitle: '填写团队简报，交给使用「团队构建器」模式的智能体会话执行。',
      goalLabel: '团队目标',
      goalPlaceholder: '这个团队要完成什么？',
      membersLabel: '成员',
      addMember: '添加成员',
      namePlaceholder: '队友名称（kebab-case）',
      rolePlaceholder: '职责 / 关注点',
      remove: '移除',
      generate: '生成简报',
      previewLabel: '团队简报',
      copy: '复制简报',
      copied: '已复制',
      hint: '新建一个会话，选择「团队构建器」模式，把这段简报粘贴进去。Lead 智能体会自动创建队友并建立共享任务板。',
      empty: '至少添加一名成员。',
      copyFailed: '复制失败，请手动选择复制',
      briefIntro: '请自动创建并使用一个智能体团队来完成下面的任务。',
      briefGoalPrefix: '团队目标：',
      briefGoalEmpty: '(未填写)',
      briefMembersHeader: '成员与职责：',
      briefRoleSep: '：',
      briefInstructionsHeader: '执行要求：',
      briefStep1: '1. 先规划任务，拆成可并行或有序的子任务。',
      briefStep2: '2. 用 spawn_teammate 按上面的名单创建队友，每个队友给清晰范围。',
      briefStep3: '3. 用 team_task_create 建立共享任务板，标明依赖与写入范围。',
      briefStep4: '4. 通过 send_message / wait_agent 协调进度，最后汇总所有成员的结果并给出结论。',
    };

    const S = {
      page: {
        padding: '28px 32px',
        maxWidth: 860,
        margin: '0 auto',
        height: '100%',
        overflowY: 'auto',
        boxSizing: 'border-box',
        color: 'var(--dsw-alias-label-primary)',
        fontFamily: 'inherit',
      },
      h1: { fontSize: 20, fontWeight: 600, margin: '0 0 6px' },
      sub: { margin: '0 0 20px', color: 'var(--dsw-alias-label-secondary)', fontSize: 13, lineHeight: 1.5 },
      label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--dsw-alias-label-secondary)', margin: '14px 0 6px' },
      textarea: {
        width: '100%',
        boxSizing: 'border-box',
        resize: 'vertical',
        background: 'var(--dsw-alias-bg-layer-1)',
        color: 'var(--dsw-alias-label-primary)',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 8,
        padding: '9px 11px',
        fontSize: 13,
        fontFamily: 'inherit',
        outline: 'none',
      },
      input: {
        flex: '1 1 0',
        minWidth: 0,
        background: 'var(--dsw-alias-bg-layer-1)',
        color: 'var(--dsw-alias-label-primary)',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 8,
        padding: '8px 10px',
        fontSize: 13,
        fontFamily: 'inherit',
        outline: 'none',
      },
      sectionHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
      memberRow: { display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' },
      actions: { display: 'flex', gap: 10, marginTop: 16, alignItems: 'center' },
      primary: {
        background: 'var(--dsw-alias-brand-primary)',
        color: '#ffffff',
        border: 'none',
        borderRadius: 8,
        padding: '8px 16px',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
      },
      secondary: {
        background: 'transparent',
        color: 'var(--dsw-alias-label-primary)',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 8,
        padding: '6px 12px',
        fontSize: 12,
        cursor: 'pointer',
      },
      ghost: {
        background: 'transparent',
        color: 'var(--dsw-alias-label-secondary)',
        border: 'none',
        fontSize: 12,
        cursor: 'pointer',
        padding: '4px 6px',
      },
      ghostDisabled: {
        background: 'transparent',
        color: 'var(--dsw-alias-label-secondary)',
        border: 'none',
        fontSize: 12,
        cursor: 'not-allowed',
        opacity: 0.5,
        padding: '4px 6px',
      },
      pre: {
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        background: 'var(--dsw-alias-bg-layer-1)',
        border: '1px solid var(--dsw-alias-border-l1)',
        borderRadius: 8,
        padding: '12px 14px',
        fontSize: 12.5,
        lineHeight: 1.6,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        margin: '6px 0 0',
      },
      hint: { marginTop: 18, color: 'var(--dsw-alias-label-secondary)', fontSize: 12, lineHeight: 1.55 },
      error: { color: 'var(--dsw-alias-state-error-primary)', fontSize: 12, margin: '4px 0' },
    };

    // Stable id generator for member rows (counter keeps old browsers happy,
    // no dependency on crypto.randomUUID).
    let memberSeq = 0;
    function makeMember() {
      memberSeq += 1;
      return { id: 'm' + memberSeq, name: '', role: '' };
    }

    // Returns true on success, false on failure. Never pretends to succeed.
    function fallbackCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      ta.setAttribute('readOnly', '');
      ta.setAttribute('aria-hidden', 'true');
      ta.tabIndex = -1;
      const prevFocus = document.activeElement;
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (e) {
        ok = false;
      }
      document.body.removeChild(ta);
      if (prevFocus && typeof prevFocus.focus === 'function') {
        try {
          prevFocus.focus();
        } catch (e) {
          /* focus restore best-effort */
        }
      }
      return ok;
    }

    function PanelIcon(props) {
      const size = props && props.size ? props.size : 20;
      return h(
        'svg',
        { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true, style: { display: 'block' } },
        h('circle', { cx: 12, cy: 5.5, r: 2.4, stroke: 'currentColor', strokeWidth: 1.6 }),
        h('circle', { cx: 5, cy: 18, r: 2.4, stroke: 'currentColor', strokeWidth: 1.6 }),
        h('circle', { cx: 19, cy: 18, r: 2.4, stroke: 'currentColor', strokeWidth: 1.6 }),
        h('path', {
          d: 'M12 7.9V12M12 12l-5.2 3.6M12 12l5.2 3.6',
          stroke: 'currentColor',
          strokeWidth: 1.6,
          strokeLinecap: 'round',
        })
      );
    }

    function TeamBuilderPanel(props) {
      const t = props && typeof props.t === 'function' ? props.t : (k) => k;
      const [goal, setGoal] = React.useState('');
      const [members, setMembers] = React.useState(() => [makeMember()]);
      const [brief, setBrief] = React.useState('');
      const [copied, setCopied] = React.useState(false);
      const [error, setError] = React.useState('');
      const timerRef = React.useRef(null);

      React.useEffect(
        () => () => {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
        },
        []
      );

      const addMember = () => setMembers((rows) => rows.concat([makeMember()]));
      const removeMember = (id) => setMembers((rows) => rows.filter((m) => m.id !== id));
      const setField = (id, key, value) =>
        setMembers((rows) => rows.map((row) => (row.id === id ? { ...row, [key]: value } : row)));

      const generate = () => {
        const named = members.filter((m) => m.name.trim() || m.role.trim());
        if (named.length === 0) {
          setError('empty');
          return;
        }
        setError('');
        const lines = [];
        lines.push(t('briefIntro'));
        lines.push('');
        lines.push(t('briefGoalPrefix') + (goal.trim() || t('briefGoalEmpty')));
        lines.push('');
        lines.push(t('briefMembersHeader'));
        named.forEach((m, i) => {
          lines.push('- ' + (m.name.trim() || 'member-' + (i + 1)) + (m.role.trim() ? t('briefRoleSep') + m.role.trim() : ''));
        });
        lines.push('');
        lines.push(t('briefInstructionsHeader'));
        lines.push(t('briefStep1'));
        lines.push(t('briefStep2'));
        lines.push(t('briefStep3'));
        lines.push(t('briefStep4'));
        setBrief(lines.join('\n'));
      };

      const copy = () => {
        if (!brief) return;
        const succeed = () => {
          setError('');
          setCopied(true);
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            setCopied(false);
            timerRef.current = null;
          }, 1500);
        };
        const fail = () => {
          setCopied(false);
          setError('copyFailed');
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(brief).then(succeed).catch(() => {
            if (fallbackCopy(brief)) succeed();
            else fail();
          });
        } else if (fallbackCopy(brief)) {
          succeed();
        } else {
          fail();
        }
      };

      const removeStyle = members.length <= 1 ? S.ghostDisabled : S.ghost;

      return h(
        'div',
        { style: S.page },
        h('h1', { style: S.h1 }, t('title')),
        h('p', { style: S.sub }, t('subtitle')),
        h('label', { style: S.label, htmlFor: 'tb-goal' }, t('goalLabel')),
        h('textarea', {
          id: 'tb-goal',
          style: S.textarea,
          rows: 3,
          maxLength: 2000,
          value: goal,
          placeholder: t('goalPlaceholder'),
          onChange: (e) => setGoal(e.target.value),
        }),
        h(
          'div',
          { style: S.sectionHead },
          h('label', { style: S.label }, t('membersLabel')),
          h('button', { type: 'button', style: S.secondary, onClick: addMember }, t('addMember'))
        ),
        members.map((m, i) =>
          h(
            'div',
            { key: m.id, style: S.memberRow },
            h('input', {
              style: S.input,
              value: m.name,
              maxLength: 64,
              placeholder: t('namePlaceholder'),
              'aria-label': t('namePlaceholder') + ' ' + (i + 1),
              onChange: (e) => setField(m.id, 'name', e.target.value),
            }),
            h('input', {
              style: S.input,
              value: m.role,
              maxLength: 200,
              placeholder: t('rolePlaceholder'),
              'aria-label': t('rolePlaceholder') + ' ' + (i + 1),
              onChange: (e) => setField(m.id, 'role', e.target.value),
            }),
            h(
              'button',
              {
                type: 'button',
                style: removeStyle,
                onClick: () => removeMember(m.id),
                disabled: members.length <= 1,
                'aria-label': t('remove') + ' ' + (m.name.trim() || i + 1),
              },
              t('remove')
            )
          )
        ),
        error ? h('p', { style: S.error, role: 'alert', 'aria-live': 'assertive' }, t(error)) : null,
        h(
          'div',
          { style: S.actions },
          h('button', { type: 'button', style: S.primary, onClick: generate }, t('generate')),
          brief ? h('button', { type: 'button', style: S.secondary, onClick: copy }, copied ? t('copied') : t('copy')) : null
        ),
        brief
          ? h('div', null, h('label', { style: S.label }, t('previewLabel')), h('pre', { style: S.pre }, brief))
          : null,
        h('p', { style: S.hint }, t('hint'))
      );
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const tr = ctx.locale.bind(NS);
        ctx.effect(() => ctx.locale.register(NS, { en, zh }), NS + ':locale');
        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: 'team-builder',
              order: 40,
              label: () => tr('title'),
            },
            PanelIcon
          )
        );
        ctx.slots.inject('main', () =>
          ctx.slots.register({ name: 'main', key: 'team-builder' }, () => h(TeamBuilderPanel, { t: tr }))
        );
      },
    };
  },
});
