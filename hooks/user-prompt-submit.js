#!/usr/bin/env node
'use strict';
// WorkBuddy UserPromptSubmit hook: handle caveman mode switches and, when
// enabled, add a one-line reinforcement. Output uses WorkBuddy's systemMessage.

const fs = require('fs');
const os = require('os');
const path = require('path');
const cfg = require('./caveman-config');
const parse = require('./caveman-parse');

const STATE_DIR = process.env.WORKBUDDY_CAVEMAN_STATE_DIR
  || path.join(os.homedir(), '.workbuddy', 'caveman-hook-state');
const SWITCH_LINE = 'Switch: /caveman, /ultracave, /megacave. Off: "stop caveman", "normal mode", or 正常模式.';
const QUOTED = /(["`])(?:(?!\1).)*\1/g;

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

function activeMode(sessionId) {
  const mode = cfg.resolveActiveMode(STATE_DIR, sessionId);
  return mode && mode !== 'off' ? mode : null;
}

function rulesetMessage(mode) {
  const body = (cfg.loadRuleset(mode, __dirname) || cfg.fallbackRuleset(mode, __dirname)).trim();
  return cfg.rulesetBanner(mode) + '\n\n' + body + '\n\n' + SWITCH_LINE;
}

function main() {
  const payload = readPayload();
  const promptRaw = typeof payload.user_prompt === 'string' ? payload.user_prompt : '';
  const cwd = typeof payload.cwd === 'string' ? payload.cwd : process.cwd();
  const sessionId = cfg.validateSessionId(payload.session_id);
  const plain = promptRaw.replace(QUOTED, ' ');

  // Chinese off-switch phrases (upstream parser covers English only).
  const zhOff = /正常模式/.test(plain)
    || /(停止|关闭|退出|关掉|停用)\s*(caveman|卡维曼)/i.test(plain)
    || /(caveman|卡维曼)\s*(模式)?\s*(关闭|停止|退出|关掉|停用)/i.test(plain);
  if (zhOff) {
    cfg.recordModeChange(STATE_DIR, null, sessionId);
    cfg.writeSessionMode(STATE_DIR, sessionId, null);
    emit({ systemMessage: 'Caveman mode: off.' });
    return;
  }

  const change = parse.parseModeChange(promptRaw, {
    getDefaultMode: () => cfg.getDefaultMode(cwd),
  });

  if (change && change.action === 'set') {
    const mode = cfg.canonicalMode(change.mode);
    if (mode && mode !== 'off') {
      cfg.recordModeChange(STATE_DIR, mode, sessionId);
      cfg.writeSessionMode(STATE_DIR, sessionId, mode);
      emit({ systemMessage: rulesetMessage(mode) });
      return;
    }
  }

  if (change && change.action === 'clear') {
    cfg.recordModeChange(STATE_DIR, null, sessionId);
    cfg.writeSessionMode(STATE_DIR, sessionId, null);
    emit({ systemMessage: 'Caveman mode: off.' });
    return;
  }

  if (change && change.action === 'status') {
    emit({ systemMessage: 'Caveman mode: ' + (activeMode(sessionId) || 'off') });
    return;
  }

  const mode = activeMode(sessionId);
  if (!mode || cfg.getReinforce(cwd) === false) {
    emit({});
    return;
  }

  const thesis = cfg.thesisLine(mode, __dirname) || '';
  emit({ systemMessage: cfg.rulesetBanner(mode) + '. ' + thesis });
}

try {
  main();
} catch (e) {
  emit({});
}
