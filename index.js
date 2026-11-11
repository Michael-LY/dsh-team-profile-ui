/**
 * Host half of the Team builder bundle.
 *
 * The team capability itself is supplied by the DSH base layer
 * (`@deepseek-ai/dsh-subagent` service + spawn/fork providers) together with the rc.2
 * model-facing tools wired in `cordis.patch.yml`'s `delegation` group:
 * `@deepseek-ai/dsh-tool-subagent` (tools `subagent` / `subagent_fork`) and
 * `@deepseek-ai/dsh-tool-subagent-control` (`send_message` / `interrupt_agent` /
 * `list_agents`). This bundle adds the preset that steers a Lead agent to build a
 * team automatically, plus the browser half that renders the brief composer panel.
 *
 * The optional `@deepseek-ai/dsh-experimental-agent-team-profile` layer provides a
 * shared members/task panel per session; this bundle does not depend on it.
 */
export function apply() {}
