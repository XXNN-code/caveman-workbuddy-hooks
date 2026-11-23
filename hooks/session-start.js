#!/usr/bin/env node
'use strict';
// WorkBuddy SessionStart hook: inject the active caveman ruleset once per session.
// Uses upstream caveman v4.2.0 config/loader modules copied next to this file.

const fs = require('fs');
const os = require('os');
const path = require('path');
const cfg = require('./caveman-config');

const STATE_DIR = process.env.WORKBUDDY_CAVEMAN_STATE_DIR
  || path.join(os.homedir(), '.workbuddy', 'caveman-hook-state');
const SWITCH_LINE = 'Switch: /caveman, /ultracave, /megacave. Off: "stop caveman", "normal mode", or 正常模式.';

function readPayload() {
  try {
    const raw = fs.readFileSync(0, 'utf8').trim();
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function emit(obj) {
  process.stdout.write(JSON.stringify(obj || {}));
}

function main() {
  const payload = readPayload();
  const source = typeof payload.source === 'string' ? payload.source : 'startup';
  const sessionId = cfg.validateSessionId(payload.session_id);
  const cwd = typeof payload.cwd === 'string' ? payload.cwd : process.cwd();
  const reset = source === 'startup' || source === 'clear';

  let stored = cfg.readSessionModeRaw(STATE_DIR, sessionId);
  if (stored === null) stored = cfg.readFlag(cfg.legacyFlagPath(STATE_DIR));

  let mode;
  if (reset || !cfg.VALID_MODES.includes(stored)) mode = cfg.getDefaultMode(cwd);
  else mode = stored;

  if (mode === 'off' || mode === 'manual') {
    cfg.writeSessionMode(STATE_DIR, sessionId, null);
    emit({});
    return;
  }

  cfg.recordModeChange(STATE_DIR, mode, sessionId);
  cfg.writeSessionMode(STATE_DIR, sessionId, mode);

  const body = (cfg.loadRuleset(mode, __dirname) || cfg.fallbackRuleset(mode, __dirname)).trim();
  emit({ systemMessage: cfg.rulesetBanner(mode) + '\n\n' + body + '\n\n' + SWITCH_LINE });
}

try {
  main();
} catch (e) {
  emit({});
}
