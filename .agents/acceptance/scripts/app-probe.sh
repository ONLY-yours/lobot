#!/usr/bin/env bash
# app-probe.sh — standardized probes for a running LobeHub app (Electron via
# CDP, or a web agent-browser session). Use these instead of hand-rolling
# `window.__LOBE_STORES` eval snippets — especially the auth check.
#
# Usage:
#   app-probe.sh ready             # app root and exposed-store readiness
#   app-probe.sh auth              # { isSignedIn, userId } from the user store
#   app-probe.sh server-auth       # authenticated server request status
#   app-probe.sh route             # current SPA route
#   app-probe.sh stores            # exposed store names
#   app-probe.sh ops               # running chat operations (type / status / startTime)
#   app-probe.sh wait-ops [secs]   # wait for running chat operations to settle
#   app-probe.sh topic             # active topic and metadata from its paged view
#   app-probe.sh goto <path>       # navigate the SPA to a route (full reload), e.g. goto /agent/agt_xxx
#   app-probe.sh workspace         # enter the test workspace, creating it on first use
#   app-probe.sh errors-install    # install a console.error interceptor
#   app-probe.sh errors            # dump errors captured since errors-install
#
# Target selection (default: electron-dev.sh instance 1, CDP 9223):
#   AB_TARGET="--cdp 9224"             # another instance (CDP_PORT also honored)
#
# Common routes (desktop SPA): /  /agent/<agentId>  /agent/<agentId>/<topicId>
#   /task  /task/<taskId>  /page  /settings  /community

set -euo pipefail

AB_TARGET="${AB_TARGET:---cdp ${CDP_PORT:-9223}}"

run_eval() {
  # shellcheck disable=SC2086
  agent-browser $AB_TARGET eval --stdin
}

case "${1:-}" in
  ready)
    run_eval << 'EVALEOF'
(function () {
  var root = document.getElementById('root');
  var stores = window.__LOBE_STORES;
  var storeNames = stores ? Object.keys(stores).sort() : [];
  return JSON.stringify({
    ok: !!root && root.childElementCount > 0 && storeNames.length > 0,
    rootChildren: root ? root.childElementCount : 0,
    storeCount: storeNames.length,
    stores: storeNames,
  });
})()
EVALEOF
    ;;
  auth)
    run_eval << 'EVALEOF'
(function () {
  var stores = window.__LOBE_STORES;
  if (!stores || !stores.user) return JSON.stringify({ ok: false, reason: 'no user store — app not loaded yet?' });
  var u = stores.user();
  return JSON.stringify({ ok: !!u.isSignedIn, isSignedIn: !!u.isSignedIn, userId: (u.user && u.user.id) || null });
})()
EVALEOF
    ;;
  server-auth)
    run_eval << 'EVALEOF'
(async function () {
  var input = encodeURIComponent(JSON.stringify({ json: {} }));
  var response = await fetch('/trpc/lambda/user.getUserState?input=' + input, {
    credentials: 'include',
  });
  return JSON.stringify({
    ok: response.status === 200,
    authenticated: response.status === 200,
    status: response.status,
  });
})()
EVALEOF
    ;;
  route)
    run_eval << 'EVALEOF'
location.pathname + location.search + location.hash
EVALEOF
    ;;
  stores)
    run_eval << 'EVALEOF'
(function () {
  var stores = window.__LOBE_STORES;
  return JSON.stringify({
    ok: !!stores,
    stores: stores ? Object.keys(stores).sort() : [],
  });
})()
EVALEOF
    ;;
  ops)
    run_eval << 'EVALEOF'
(function () {
  var stores = window.__LOBE_STORES;
  if (!stores || !stores.chat) return JSON.stringify({ ok: false, reason: 'no chat store — open a conversation first' });
  var ops = Object.values(stores.chat().operations || {});
  var running = ops.filter(function (o) { return o.status === 'running'; });
  return JSON.stringify({
    ok: true,
    running: running.map(function (o) { return { startTime: o.metadata && o.metadata.startTime, type: o.type }; }),
    runningCount: running.length,
    total: ops.length,
  });
})()
EVALEOF
    ;;
  wait-ops)
    TIMEOUT_SECONDS="${2:-60}"
    [[ "$TIMEOUT_SECONDS" =~ ^[0-9]+$ ]] || {
      echo "Usage: $0 wait-ops [timeout-seconds]" >&2
      exit 2
    }
    DEADLINE=$((SECONDS + TIMEOUT_SECONDS))
    while (( SECONDS <= DEADLINE )); do
      OPS_OUTPUT="$(AB_TARGET="$AB_TARGET" bash "${BASH_SOURCE[0]}" ops)"
      RUNNING_COUNT="$(
        node -e '
          const value = JSON.parse(process.argv[1]);
          const parsed = typeof value === "string" ? JSON.parse(value) : value;
          process.stdout.write(String(parsed.runningCount ?? -1));
        ' "$OPS_OUTPUT"
      )"
      if [[ "$RUNNING_COUNT" == "0" ]]; then
        printf '%s\n' "$OPS_OUTPUT"
        exit 0
      fi
      sleep 1
    done
    echo "Timed out after ${TIMEOUT_SECONDS}s waiting for chat operations" >&2
    exit 1
    ;;
  topic)
    run_eval << 'EVALEOF'
(function () {
  var stores = window.__LOBE_STORES;
  if (!stores || !stores.chat) {
    return JSON.stringify({ ok: false, reason: 'no chat store — open a conversation first' });
  }
  var chat = stores.chat();
  var agentId = chat.activeAgentId;
  var view = agentId && chat.topicDataMap && chat.topicDataMap['agent_' + agentId];
  var items = (view && view.items) || [];
  var topic = items.find(function (item) { return item.id === chat.activeTopicId; });
  return JSON.stringify({
    ok: !!topic,
    activeTopicId: chat.activeTopicId || null,
    agentId: agentId || null,
    metadata: topic ? topic.metadata || null : null,
    reason: topic ? null : 'active topic not found in the agent paged view',
  });
})()
EVALEOF
    ;;
  goto)
    TARGET_PATH="${2:?Usage: app-probe.sh goto <path>}"
    TARGET_PATH_JSON="$(node -e 'process.stdout.write(JSON.stringify(process.argv[1]))' "$TARGET_PATH")"
    # shellcheck disable=SC2086
    agent-browser $AB_TARGET eval "location.href = $TARGET_PATH_JSON" > /dev/null
    sleep 2
    bash "${BASH_SOURCE[0]}" route
    ;;
  workspace)
    # Acceptance runs against the real cloud account, so everything it creates goes into
    # one dedicated workspace instead of the user's own spaces. Found by its slug prefix,
    # created on first use (per user: slugs are global). The switch is the store's silent
    # one: it does not write the `lastWorkspaceId` preference, so the user's own apps keep
    # opening where they were. A page reload drops it — run this command again after one.
    ENSURED="$(run_eval << 'EVALEOF'
(async function () {
  var call = async function (path, input, method) {
    var url = '/trpc/lambda/' + path;
    var init = { credentials: 'include', method: method || 'GET' };
    if (method === 'POST') {
      init.headers = { 'content-type': 'application/json' };
      init.body = JSON.stringify({ json: input });
    } else {
      url += '?input=' + encodeURIComponent(JSON.stringify({ json: input }));
    }
    var response = await fetch(url, init);
    var body = await response.json().catch(function () { return null; });
    if (!response.ok) throw new Error(path + ' ' + response.status + ' ' + JSON.stringify(body));
    return body.result.data.json;
  };
  try {
    var stores = window.__LOBE_STORES;
    var user = stores && stores.user && stores.user().user;
    if (!user || !user.id) return JSON.stringify({ ok: false, reason: 'not signed in' });
    var prefix = 'lobot-acceptance';
    var slug = prefix + '-' + user.id.toLowerCase().replace(/[^a-z0-9]/g, '').slice(-6);
    var list = await call('workspace.list', {});
    var found = list.find(function (ws) { return ws.slug && ws.slug.indexOf(prefix) === 0; });
    if (found) return JSON.stringify({ ok: true, created: false, id: found.id, slug: found.slug });
    var made = await call('workspace.create', { name: 'Lobot Acceptance', slug: slug }, 'POST');
    return JSON.stringify({ ok: true, created: true, id: made.id, slug: made.slug });
  } catch (error) {
    return JSON.stringify({ ok: false, reason: String(error && error.message || error) });
  }
})()
EVALEOF
)"
    WS_ID="$(node -e '
      const value = JSON.parse(process.argv[1]);
      const parsed = typeof value === "string" ? JSON.parse(value) : value;
      if (!parsed.ok) { console.error("workspace: " + parsed.reason); process.exit(1); }
      process.stdout.write(parsed.id);
    ' "$ENSURED")" || { printf '%s\n' "$ENSURED"; exit 1; }
    if [[ "$ENSURED" == *'\"created\":true'* || "$ENSURED" == *'"created":true'* ]]; then
      # The rail lists workspaces from its own fetch; reload so it knows the new one.
      # shellcheck disable=SC2086
      agent-browser $AB_TARGET eval 'location.reload()' > /dev/null || true
      for _ in $(seq 1 30); do
        sleep 1
        READY="$(bash "${BASH_SOURCE[0]}" ready 2>/dev/null || true)"
        [[ "$READY" == *'"ok":true'* || "$READY" == *'\"ok\":true'* ]] && break
      done
    fi
    WS_ID_JSON="$(node -e 'process.stdout.write(JSON.stringify(process.argv[1]))' "$WS_ID")"
    # shellcheck disable=SC2086
    agent-browser $AB_TARGET eval --stdin << EVALEOF
(async function () {
  var id = $WS_ID_JSON;
  var stores = window.__LOBE_STORES;
  if (!stores || !stores.workspace) return JSON.stringify({ ok: false, reason: 'no workspace store exposed' });
  for (var i = 0; i < 30 && stores.workspace().isWorkspaceLoading; i++) {
    await new Promise(function (resolve) { setTimeout(resolve, 500); });
  }
  var state = stores.workspace();
  if (!state.workspaces.some(function (ws) { return ws.id === id; }))
    return JSON.stringify({ ok: false, reason: 'workspace not in the loaded list', id: id });
  state.switchWorkspace(id);
  // Like the rail: land on the Messages home, since the open page belongs to the
  // scope just left. Through the app's own router — a reload would drop the switch.
  var navigate = stores.global && stores.global().navigationRef.current;
  if (navigate) navigate('/');
  return JSON.stringify({ ok: stores.workspace().activeWorkspaceId === id, activeWorkspaceId: id, ensured: $ENSURED });
})()
EVALEOF
    ;;
  errors-install)
    run_eval << 'EVALEOF'
(function () {
  window.__CAPTURED_ERRORS = [];
  var orig = console.error;
  console.error = function () {
    var msg = Array.from(arguments).map(function (a) {
      if (a instanceof Error) return a.message;
      return typeof a === 'object' ? JSON.stringify(a) : String(a);
    }).join(' ');
    window.__CAPTURED_ERRORS.push(msg);
    orig.apply(console, arguments);
  };
  return 'installed';
})()
EVALEOF
    ;;
  errors)
    run_eval << 'EVALEOF'
JSON.stringify(window.__CAPTURED_ERRORS || 'interceptor not installed — run errors-install first')
EVALEOF
    ;;
  *)
    echo "Usage: $0 {ready|auth|server-auth|route|stores|ops|wait-ops [seconds]|topic|goto <path>|workspace|errors-install|errors}" >&2
    exit 2
    ;;
esac
