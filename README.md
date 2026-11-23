# caveman-workbuddy-hooks

WorkBuddy adapters for [caveman](https://github.com/JuliusBrussee/caveman) v4.2.0.

WorkBuddy is not an upstream caveman provider. These two hooks give WorkBuddy the same auto-activation and mode-switch behavior without patching the upstream CLI:

- `hooks/session-start.js` — injects the active caveman ruleset at session start.
- `hooks/user-prompt-submit.js` — handles `/caveman`, `/ultracave`, `/megacave`, `stop caveman`, `normal mode`, and Chinese off phrases (`正常模式`).

Both emit WorkBuddy's `{"systemMessage": "..."}` hook output. Mode state lives in `~/.workbuddy/caveman-hook-state/`.

## Install

1. Clone this repo.
2. Run `./install.sh` (fetches pinned upstream helper modules and copies hooks to `~/.workbuddy/caveman-hooks/`).
3. Add the hooks to `~/.workbuddy/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [ { "type": "command", "command": "node /home/Xiang/.workbuddy/caveman-hooks/session-start.js", "timeout": 5 } ] }
    ],
    "UserPromptSubmit": [
      { "hooks": [ { "type": "command", "command": "node /home/Xiang/.workbuddy/caveman-hooks/user-prompt-submit.js", "timeout": 5 } ] }
    ]
  }
}
```

Keep existing hook entries. The RTK `PreToolUse` hook can coexist.

4. Optional: create `~/.config/caveman/config.json`:

```json
{ "defaultMode": "caveman", "reinforce": false }
```

`reinforce: false` suppresses the per-prompt line. Mode switches still inject the full ruleset.

## Usage

No manual activation needed. To switch: `/ultracave`, `/megacave`, `/caveman ultra`, `/caveman wenyan`. To stop: `stop caveman`, `normal mode`, `正常模式`, or `/caveman off`.

## Scope

These hooks only implement the voice/activation layer. They do not enable caveman proxy, output compression, or MCP recovery. WorkBuddy shell-output compression is handled by the existing RTK hook.

## License

Derived work based on caveman v4.2.0, licensed Apache-2.0. See `NOTICE.md`.
