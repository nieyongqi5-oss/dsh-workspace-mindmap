/* 工作区思维导图 — Client half.
 * 顶部导航条（shell.overlay）+ 主页面板（main key='mindmap'）。
 */
window.__ModuleLoader__.load({
  id: 'dsh-workspace-mindmap',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useRef, useCallback, useMemo } = React;

    /* ------------------------------------------------------------
       数据：由当前工作区的会话列表动态生成，按标题关键词归入 8 个应用
       ------------------------------------------------------------ */
    const APPS = [
      { id: 'a1', name: '库存与 WMS', color: '#2563eb', desc: 'WMS 库存比对、托盘明细导出与推送', kw: ['库存', '托盘', 'WMS', '比对', '导出'] },
      { id: 'a2', name: '装箱与单据', color: '#0891b2', desc: '装箱单、七点表、对账单的生成与打印', kw: ['装箱', '七点表', '对账', '统计表', '理货', '单据', '打印'] },
      { id: 'a3', name: '海运出口', color: '#059669', desc: '海运出口流程的本机验证与风险提醒', kw: ['海运', '出口', '港航'] },
      { id: 'a4', name: '网络与光猫', color: '#7c3aed', desc: '光猫桥接、超级密码与网络测速', kw: ['光猫', '网络', '测速', '桥接'] },
      { id: 'a5', name: 'Windows 调优与清理', color: '#ea580c', desc: '游戏帧率、鼠标 DPI 与流氓软件清理', kw: ['三角洲', '游戏', 'DPI', '鼠标', '清理', '流氓', '优化'] },
      { id: 'a6', name: 'Apple Watch 解锁', color: '#db2777', desc: '用 Apple Watch 解锁 Windows', kw: ['Apple Watch', '解锁'] },
      { id: 'a7', name: '安装与识别工具', color: '#f59e0b', desc: '图绳识别、设备电量等小工具', kw: ['PicRope', '图绳', 'MyFinder', '电量', '识别'] },
      { id: 'a8', name: '移动端与车机', color: '#0d9488', desc: '室内定位与车机固件分析', kw: ['定位', '车机', 'ADB', '固件', '哈弗'] },
      { id: 'a9', name: '其他会话', color: '#64748b', desc: '标题没命中关键词的会话', kw: [] },
    ];

    const L = {
      rootX: 28, rootW: 150, rootH: 48,
      appX: 250, appW: 188, appH: 38,
      branchX: 470, branchW: 46,
      leafX: 540, leafH: 25, leafGap: 1,
      groupGap: 8, rowGap: 8, padTop: 12, padBottom: 14,
    };
    const WORLD_W = 920;

    /* 会话列表还没就绪时的兜底：至少能看到结构，不至于空白 */
    const FALLBACK = [
      { id: 'demo-01', name: '库存比对自动化', date: 1, running: false },
      { id: 'demo-08', name: '库存比对 · 20261016', date: 2, running: false },
      { id: 'demo-10', name: '托盘导出 · 全自动终版', date: 3, running: false },
      { id: 'demo-16', name: '托盘明细 × 库存比对推送', date: 4, running: false },
      { id: 'demo-04', name: '托盘导出 · Edge 旧方案', date: 5, running: false },
      { id: 'demo-09', name: '装箱单 + 七点表打印', date: 6, running: false },
      { id: 'demo-03', name: '对账单集装箱号回填', date: 7, running: false },
      { id: 'demo-02', name: '统计表合并', date: 8, running: false },
      { id: 'demo-05', name: '问题物料理货员', date: 9, running: false },
      { id: 'demo-17', name: '装箱工作台算法', date: 10, running: false },
      { id: 'demo-15', name: '海运出口风险提醒', date: 11, running: false },
      { id: 'demo-06', name: '光猫桥接与网络测速', date: 12, running: false },
      { id: 'demo-14', name: '光猫超级密码获取', date: 13, running: false },
      { id: 'demo-19', name: '三角洲游戏优化', date: 14, running: false },
      { id: 'demo-20', name: '鼠标 DPI 漂移诊断', date: 15, running: false },
      { id: 'demo-21', name: '鲁大师等流氓软件清理', date: 16, running: false },
      { id: 'demo-12', name: 'Apple Watch 解锁 Windows', date: 17, running: false },
      { id: 'demo-13', name: 'PicRope 图绳 + 识别文字', date: 18, running: false },
      { id: 'demo-18', name: 'MyFinder 设备电量', date: 19, running: false },
      { id: 'demo-07', name: '室内定位 App', date: 20, running: false },
      { id: 'demo-11', name: '哈弗车机固件分析', date: 21, running: false },
    ];

    /* 把会话条目归到应用，再排出竖版树；返回 rows / mods / worldH / rootCy
       focusId：被点开的应用，它那一行显示全部会话，其余行只露 2 条 */
    function build(entries, focusId) {
      const mods = {};
      const byApp = {};
      APPS.forEach((a) => { byApp[a.id] = []; });
      entries.forEach((e) => {
        const t = String(e.name || '').toLowerCase();
        let app = null;
        for (let i = 0; i < APPS.length; i++) {
          const a = APPS[i];
          if (a.kw.some((k) => t.indexOf(String(k).toLowerCase()) >= 0)) { app = a; break; }
        }
        if (!app) app = APPS[APPS.length - 1];
        mods[e.id] = { num: e.id, name: e.name, date: e.date || 0, once: !e.running, sid: e.id };
        byApp[app.id].push(e.id);
      });

      const PEEK = 2;

      let y = L.padTop;
      const rows = [];
      APPS.forEach((app) => {
        const ids = byApp[app.id];
        if (!ids.length) return;
        ids.sort((a, b) => (mods[b].date || 0) - (mods[a].date || 0));
        const groups = [];
        const run = ids.filter((id) => !mods[id].once);
        const done = ids.filter((id) => mods[id].once);
        if (run.length) groups.push({ kind: 'run', label: '进行中', items: run });
        if (done.length) groups.push({ kind: 'done', label: '已完成', items: done });
        if (app.id !== focusId) {
          groups.forEach((g) => {
            if (g.items.length > PEEK) {
              g.more = g.items.length - PEEK;
              g.items = g.items.slice(0, PEEK);
            }
          });
        }
        let gh = 0;
        groups.forEach((g, i) => {
          const body = g.items.length * L.leafH + (g.items.length - 1) * L.leafGap;
          g.h = 18 + body + (g.more ? L.leafH : 0);
          g.y = gh;
          gh += g.h + (i < groups.length - 1 ? L.groupGap : 0);
        });
        const inner = gh;
        const blockH = Math.max(L.appH, inner);
        const row = { app, groups, inner, blockH, y, top: y, bottom: y + blockH };
        y = row.bottom + L.rowGap;
        rows.push(row);
      });

      const worldH = Math.max(240, y - L.rowGap + L.padBottom);
      const rootCy = L.padTop + (worldH - L.padTop - L.padBottom) / 2;
      rows.forEach((r) => {
        r.appCy = r.top + r.blockH / 2;
        r.groups.forEach((g) => { g.topAbs = r.top + (r.blockH - r.inner) / 2 + g.y; });
      });
      return { rows, mods, worldH, rootCy, total: entries.length };
    }

    function edgePaths(rows, rootCy) {
      const segs = [];
      rows.forEach((row) => {
        const ac = row.appCy;
        segs.push({ d: `M${L.rootX + L.rootW},${rootCy} H${L.appX - 22} V${ac} H${L.appX}`, color: row.app.color });
        row.groups.forEach((g) => {
          const gy = g.topAbs + 18;
          segs.push({ d: `M${L.appX + L.appW},${ac} H${L.appX + L.appW + 18} V${gy} H${L.branchX}`, color: row.app.color });
          g.items.forEach((num, i) => {
            const ly = g.topAbs + 18 + i * (L.leafH + L.leafGap) + L.leafH / 2;
            segs.push({ d: `M${L.branchX + L.branchW},${gy} H${L.branchX + L.branchW + 12} V${ly} H${L.leafX - 8}`, color: row.app.color, thin: true });
          });
        });
      });
      return segs;
    }


    /* ------------------------------------------------------------
       样式
       ------------------------------------------------------------ */
    const CSS = `
.dsh-mm-topbar{position:absolute;left:64px;right:150px;top:0;height:52px;z-index:2147483000;
  display:flex;align-items:center;justify-content:center;gap:6px;padding:0 12px;
  background:rgba(255,255,255,.96);backdrop-filter:blur(14px);
  border-bottom:1px solid #e2e8f0;-webkit-app-region:drag;font:13px/1.4 -apple-system,"Segoe UI","Microsoft YaHei",sans-serif;color:#0f172a}
.dsh-mm-topbar button,.dsh-mm-topbar .hint{-webkit-app-region:no-drag}
/* 官方左上角那一行（侧栏开关 / 应用 / 编辑）下移到顶栏之下，避免叠字 */
[class*="leadingSeat"]{top:64px !important}
.dsh-mm-topbar .dsh-mm-nav{display:flex;align-items:center;gap:6px}
.dsh-mm-topbar .hint{position:absolute;right:14px;color:#94a3b8;font-size:12px}
.dsh-mm-topbar .brand{display:flex;align-items:center;gap:8px;margin-right:8px;font-weight:650;letter-spacing:.2px}
.dsh-mm-topbar .mark{width:24px;height:24px;border-radius:7px;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700}
.dsh-mm-topbar button.nav{border:1px solid #e2e8f0;background:#fff;color:#334155;padding:6px 12px;border-radius:8px;cursor:pointer;font:inherit;white-space:nowrap}
.dsh-mm-topbar button.nav:hover{background:#f1f5f9;color:#0f172a;border-color:#cbd5e1}
.dsh-mm-topbar button.nav.on{background:#eef2ff;color:#3730a3;border-color:#c7d2fe;font-weight:600}
.dsh-mm-topbar button.primary{background:#2563eb;color:#fff;border-radius:8px;padding:7px 14px;border:0;cursor:pointer;font:inherit;font-weight:600}
.dsh-mm-topbar button.primary:hover{background:#1d4ed8}
.dsh-mm-topbar .spacer{flex:1}
.dsh-mm-topbar .hint{color:#94a3b8;font-size:12px}
.dsh-mm-panel{height:100%;display:flex;flex-direction:column;background:#f8fafc;overflow:hidden;position:relative}
.dsh-mm-head{display:flex;align-items:center;gap:10px;padding:14px 20px 10px;flex-wrap:wrap}
.dsh-mm-head h1{font-size:15px;margin:0;font-weight:650;color:#0f172a}
.dsh-mm-head .sub{color:#64748b;font-size:12px}
.dsh-mm-head .grow{flex:1}
.dsh-mm-head select,.dsh-mm-head input{font:inherit;font-size:12px;padding:6px 9px;border:1px solid #dbe3ee;border-radius:8px;background:#fff;color:#0f172a}
.dsh-mm-head input{width:190px}
.dsh-mm-stage{position:relative;flex:1;overflow:hidden;margin:6px 20px 20px;border:1px solid #e5ebf3;border-radius:14px;background:#fff}
.dsh-mm-scene{position:absolute;left:0;top:0;transform-origin:0 0;transition:transform .5s cubic-bezier(.22,.61,.36,1)}
.dsh-mm-root{position:absolute;display:flex;flex-direction:column;justify-content:center;padding:0 14px;border-radius:10px;background:#b4533f;color:#fff;cursor:pointer;box-shadow:0 6px 16px rgba(180,83,63,.24)}
.dsh-mm-root .t{font-size:15px;font-weight:700;letter-spacing:.5px}
.dsh-mm-root .s{font-size:10px;opacity:.82;margin-top:2px}
.dsh-mm-app{position:absolute;display:flex;align-items:center;padding:0 12px;border-radius:8px;color:#fff;font-size:13.5px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(15,23,42,.12)}
.dsh-mm-app.sel{outline:2px solid #0f172a;outline-offset:2px}
.dsh-mm-app .n{margin-left:auto;font-size:11px;font-weight:500;opacity:.85}
.dsh-mm-branch{position:absolute;font-size:11px;color:#64748b;letter-spacing:.4px;display:flex;align-items:center;cursor:default}
.dsh-mm-leaf{position:absolute;display:flex;align-items:center;gap:7px;font-size:13px;color:#334155;cursor:pointer;padding:0 4px;border-radius:6px;white-space:nowrap;max-width:${WORLD_W - L.leafX - 16}px}
.dsh-mm-leaf .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:${WORLD_W - L.leafX - 40}px}
.dsh-mm-leaf:hover{background:#f1f5f9}
.dsh-mm-leaf.sel{background:#e0e7ff;color:#1e1b4b}
.dsh-mm-leaf.hist{opacity:.66}
.dsh-mm-leaf .dot{width:7px;height:7px;border-radius:50%;flex:none}
.dsh-mm-leaf .cbar{width:3px;height:14px;border-radius:2px;flex:none}
.dsh-mm-leaf .num{color:#94a3b8;font-size:10px;font-variant-numeric:tabular-nums}
.dsh-mm-leaf .tag{font-size:9.5px;padding:1px 5px;border-radius:5px;background:#fef3c7;color:#92400e}
.dsh-mm-leaf.hit{background:#fef9c3}
.dsh-mm-more{position:absolute;display:flex;align-items:center;height:22px;font-size:12px;color:#2563eb;cursor:pointer;padding:0 4px;white-space:nowrap}
.dsh-mm-more:hover{text-decoration:underline}
.dsh-mm-top{position:absolute;right:14px;top:14px;width:250px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:14px;box-shadow:0 12px 30px rgba(15,23,42,.10);font-size:12px;color:#334155}
.dsh-mm-top h3{margin:0 0 6px;font-size:13px;color:#0f172a}
.dsh-mm-top .muted{color:#94a3b8}
.dsh-mm-top .row{display:flex;justify-content:space-between;padding:3px 0;border-top:1px dashed #eef2f7}
.dsh-mm-top .row span:first-child{color:#94a3b8}
.dsh-mm-empty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:13px}
`;

    function useStyleTag() {
      useEffect(() => {
        const el = document.createElement('style');
        el.setAttribute('data-dsh-mindmap', '');
        el.textContent = CSS;
        document.head.appendChild(el);
        return () => el.remove();
      }, []);
    }

    /* ------------------------------------------------------------
       顶部导航条
       ------------------------------------------------------------ */
    function TopBar() {
      const [panel, setPanel] = useState('mindmap');
      useStyleTag();

      useEffect(() => {
        const bar = document.querySelector('[data-shell-overlay]');
        const host = bar ? bar.parentElement : null;
        if (!host) return undefined;
        const apply = () => {
          try { host.style.setProperty('padding-top', 'calc(var(--dsh-frame-chrome-top, 0px) + 20px)', 'important'); } catch (e) {}
        };
        apply();
        const id = setInterval(apply, 400);
        const stop = setTimeout(() => clearInterval(id), 15000);
        return () => {
          clearInterval(id); clearTimeout(stop);
          try { host.style.removeProperty('padding-top'); } catch (e) {}
        };
      }, []);

      /* 入口已收进顶栏：收起侧栏里重复的行 */
      useEffect(() => {
        let alive = true;
        const tidy = () => {
          if (!alive) return;
          /* 顶部残留的「应用 / 编辑」与顶栏同处一行：整行隐藏，入口已收进顶栏 */
          document.querySelectorAll('button,[role="button"],[role="tab"],a,span').forEach((b) => {
            if (b.closest('.dsh-mm-topbar')) return;
            const t = (b.textContent || '').trim();
            if (t !== '应用' && t !== '编辑') return;
            const r = b.getBoundingClientRect();
            if (r.top >= 0 && r.top < 56) b.style.setProperty('display', 'none', 'important');
          });
          const port = document.querySelector('[data-sidebar-scrollport]');
          if (!port) return;
          const nav = port.querySelector('nav');
          if (nav) nav.style.display = 'none';
          const aside = port.closest('aside');
          if (!aside) return;
          aside.querySelectorAll('button').forEach((btn) => {
            if (btn.closest('.dsh-mm-topbar')) return;
            const t = (btn.textContent || '').replace(/\s+/g, '');
            if (t.indexOf('新会话') === 0 || t.indexOf('定时任务') === 0) {
              const row = btn.parentElement;
              if (row && row !== aside) row.style.display = 'none';
            }
          });
        };
        tidy();
        const id = setInterval(tidy, 600);
        const stop = setTimeout(() => clearInterval(id), 12000);
        return () => { alive = false; clearInterval(id); clearTimeout(stop); };
      }, []);

      /* 首次进入本标签页时落到思维导图 */
      useEffect(() => {
        let entered = false;
        try { entered = sessionStorage.getItem('dsh-mm-entered') === '1'; } catch (e) {}
        if (entered) return undefined;
        try { sessionStorage.setItem('dsh-mm-entered', '1'); } catch (e) {}
        const timer = setTimeout(() => {
          const api = window.__DSH_MINDMAP__;
          if (api) { api.layout.selectPanel('mindmap'); setPanel('mindmap'); }
        }, 500);
        return () => clearTimeout(timer);
      }, []);

      const go = (id) => (e) => {
        e.preventDefault();
        const api = window.__DSH_MINDMAP__;
        if (!api) return;
        api.layout.selectPanel(id);
        setPanel(id);
      };

      const newSession = (e) => {
        e.preventDefault();
        const api = window.__DSH_MINDMAP__;
        if (api && api.uiWorkspace) api.uiWorkspace.startSession();
        setPanel('conversation');
      };

      const openWorkspace = async (e) => {
        e.preventDefault();
        const api = window.__DSH_MINDMAP__;
        if (!api) return;
        try {
          const dir = await api.uiWorkspace.pickDirectory();
          if (dir) await api.workspaces.create({ path: dir });
        } catch (err) { /* 用户取消 */ }
      };

      const nav = panel === 'mindmap' ? 'mindmap' : panel;

      return h('div', { className: 'dsh-mm-topbar' },
        h('div', { className: 'dsh-mm-nav' },
          h('button', { className: 'primary', onClick: newSession }, '新会话'),
          h('button', { className: 'nav' + (nav === 'conversation' ? ' on' : ''), onClick: go('conversation') }, '会话'),
          h('button', { className: 'nav', onClick: openWorkspace }, '工作区'),
          h('button', { className: 'nav' + (nav === 'mindmap' ? ' on' : ''), onClick: go('mindmap') }, '思维导图'),
          h('button', { className: 'nav' + (nav === 'plugins' ? ' on' : ''), onClick: go('plugins') }, '插件'),
          h('button', { className: 'nav' + (nav === 'schedules' ? ' on' : ''), onClick: go('schedules') }, '定时任务')
        ),
        h('span', { className: 'hint', id: 'dshMmHint' }, '工作区 · 按会话标题归类')
      );
    }

    /* ------------------------------------------------------------
       思维导图面板
       ------------------------------------------------------------ */
    function MindMap() {
      useStyleTag();
      const [density, setDensity] = useState(() => {
        try { return localStorage.getItem('dsh-mindmap-density') || 'dot'; } catch (e) { return 'dot'; }
      });
      const [sel, setSel] = useState(null);
      const [q, setQ] = useState('');
      const stageRef = useRef(null);
      const sceneRef = useRef(null);
      const [cam, setCam] = useState({ k: 1, x: 0, y: 0 });
      const [entries, setEntries] = useState([]);
      /* 记住"当前展开的是哪个应用"：点叶子只换详情，不改展开状态、不动镜头 */
      const appFocusRef = useRef(null);

      /* 会话列表 → 导图条目：工作区里每个会话都在，新建的也立刻出现 */
      useEffect(() => {
        const api = window.__DSH_MINDMAP__;
        const list = api && api.sessions && api.sessions.list;
        if (!list) return undefined;
        const normCwd = (p) => String(p || '').replace(/[\\/]+/g, '\\').toLowerCase();
        const mine = normCwd('C:\\Users\\29540\\Desktop\\deepseek文件');
        const stamp = (ms) => {
          const d = new Date(ms || Date.now());
          const p2 = (n) => (n < 10 ? '0' + n : String(n));
          return p2(d.getMonth() + 1) + '-' + p2(d.getDate()) + ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
        };
        const update = () => {
          let st;
          try { st = list.getSnapshot(); } catch (e) { return; }
          const arr = [];
          (st.ids || []).forEach((id) => {
            const s = st.byId[id] || {};
            if (s.origin === 'subagent') return;
            const base = String(s.displayTitle || s.title || '').trim();
            const name = (!base || base === id) ? ('新会话 · ' + stamp(s.updatedAt)) : base;
            arr.push({ id, name, date: s.updatedAt || 0, running: !!s.running, cwd: s.cwd || '' });
          });
          /* 不再按 cwd 过滤：换台机器、换工作区也能用；子代理会话已在上面排除 */
          setEntries(arr.slice(0, 200));
        };
        update();
        let off = () => {};
        try { off = list.subscribe(update); } catch (e) { /* 快照源不可订阅时就保持首帧 */ }
        const ping = () => {
          try { if (api && api.sessions && api.sessions.refresh) api.sessions.refresh(); } catch (e) {}
        };
        ping();
        const timer = setInterval(ping, 15000);
        return () => {
          clearInterval(timer);
          try { off(); } catch (e) {}
        };
      }, []);

      const focusId = (sel && sel.kind === 'app' && sel.id) || appFocusRef.current || null;
      const model = useMemo(() => build(entries.length ? entries : FALLBACK, focusId), [entries, focusId]);
      const layoutRef = useRef(model);
      layoutRef.current = model;
      const data = { current: { l: model, edges: edgePaths(model.rows, model.rootCy) } };

      const viewRef = useRef({ w: 1200, h: 700 });

      const fit = useCallback(() => {
        const st = stageRef.current;
        if (!st) return;
        const w = st.clientWidth, hgt = st.clientHeight;
        if (!w || !hgt) return;
        viewRef.current = { w, h: hgt };
        const { worldH } = layoutRef.current;
        if (!isFinite(worldH) || worldH <= 0) return;
        const kFit = Math.min(w / WORLD_W, hgt / worldH, 1.05) * 0.96;
        const k = Math.max(0.8, Math.min(kFit, 1.05));
        setCam({ k, x: (w - WORLD_W * k) / 2, y: (hgt - worldH * k) / 2 });
      }, []);

      const focusApp = useCallback((row) => {
        const st = stageRef.current;
        if (!st) return;
        const w = st.clientWidth, hgt = st.clientHeight;
        const regionW = WORLD_W - L.appX + 10;
        const k = Math.min(w / regionW, hgt / (row.blockH + 60), 1.45);
        const cy = row.top + row.blockH / 2;
        setCam({ k, x: -L.appX * k + 24, y: hgt / 2 - cy * k });
      }, []);

      /* 镜头：只有"展开的应用"变了（或它展开后的高度变了）才推近；
         点叶子、刷新会话列表、只是选中某一条，都不动镜头 */
      useEffect(() => {
        if (!focusId) return undefined;
        const row = model.rows.find((r) => r.app.id === focusId);
        const raf = requestAnimationFrame(() => { if (row) focusApp(row); });
        return () => cancelAnimationFrame(raf);
      }, [model, focusId, focusApp]);

      /* 首次拿到数据 / 窗口改尺寸时对准全览 */
      useEffect(() => {
        const raf = requestAnimationFrame(() => fit());
        const onResize = () => fit();
        window.addEventListener('resize', onResize);
        return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
      }, [entries.length > 0, fit]);

      const goOverview = useCallback(() => { appFocusRef.current = null; setSel(null); fit(); }, [fit]);

      const onApp = (row) => (e) => {
        e.stopPropagation();
        appFocusRef.current = row.app.id;
        setSel({ kind: 'app', id: row.app.id });
      };

      const onLeaf = (num) => (e) => {
        e.stopPropagation();
        setSel({ kind: 'mod', num });
      };

      /* 双击项目：条目 id 就是 sessionId，直接打开对应会话 */
      const openSessionFor = (sid) => {
        const api = window.__DSH_MINDMAP__;
        if (!api || !api.uiWorkspace) return;
        api.uiWorkspace.openSession(sid);
      };

      const l = layoutRef.current;
      const dim = `translate(${cam.x}px, ${cam.y}px) scale(${cam.k})`;

      const appColor = (app) => app.color;

      const leafNode = (num, x, y, kind, app) => {
        const m = model.mods[num] || { name: '', once: false };
        let mark = null;
        if (density === 'dot') mark = h('i', { className: 'dot', style: { background: appColor(app) } });
        else if (density === 'bar') mark = h('i', { className: 'cbar', style: { background: appColor(app) } });
        const isHit = q && m.name.toLowerCase().includes(q.toLowerCase());
        return h('div', {
          key: num,
          className: 'dsh-mm-leaf' + (m.hist ? ' hist' : '') + (sel && sel.kind === 'mod' && sel.num === num ? ' sel' : '') + (isHit ? ' hit' : ''),
          style: { left: x, top: y, height: L.leafH },
          onClick: onLeaf(num),
          onDoubleClick: () => openSessionFor(num),
          title: '单击看简介，双击进入会话',
        },
          mark,
          density === 'full' ? h('span', { className: 'num' }, num) : null,
          h('span', { className: 'nm' }, m.name),
          density === 'full' ? h('span', { className: 'tag' }, m.once ? '已完成' : '进行中') : null
        );
      };

      const rows = l.rows.map((row) => {
        const app = row.app;
        const nodes = [];
        nodes.push(h('div', {
          key: 'app-' + app.id,
          className: 'dsh-mm-app' + (sel && sel.kind === 'app' && sel.id === app.id ? ' sel' : ''),
          style: {
            left: L.appX, top: row.top + (row.blockH - L.appH) / 2, width: L.appW, height: L.appH,
            background: appColor(app),
          },
          onClick: onApp(row),
        }, h('span', null, app.name), h('span', { className: 'n' }, row.groups.reduce((n, g) => n + g.items.length, 0) + ' 项')));
        row.groups.forEach((g) => {
          nodes.push(h('div', {
            key: 'br-' + app.id + g.kind,
            className: 'dsh-mm-branch',
            style: { left: L.branchX, top: g.topAbs + 10, width: L.branchW, height: 16 },
          }, g.label));
          g.items.forEach((num, i) => {
            nodes.push(leafNode(num, L.leafX, g.topAbs + 18 + i * (L.leafH + L.leafGap), g.kind, app));
          });
          if (g.more) {
            nodes.push(h('div', {
              key: 'more-' + app.id + g.kind,
              className: 'dsh-mm-more',
              style: { left: L.leafX, top: g.topAbs + 18 + g.items.length * (L.leafH + L.leafGap) },
              onClick: (e) => { e.stopPropagation(); appFocusRef.current = app.id; setSel({ kind: 'app', id: app.id }); },
            }, '… 还有 ' + g.more + ' 条（点开看全部）'));
          }
        });
        return nodes;
      });

      const rootNode = h('div', {
        className: 'dsh-mm-root',
        style: { left: L.rootX, top: l.rootCy - L.rootH / 2, width: L.rootW, height: L.rootH },
        onClick: goOverview,
      },
        h('div', { className: 't' }, '工作区'),
        h('div', { className: 's' }, model.rows.length + ' 个应用 · ' + model.total + ' 个会话')
      );

      const selApp = sel && sel.kind === 'app' ? APPS.find((a) => a.id === sel.id) : null;
      const selMod = sel && sel.kind === 'mod' ? (model.mods[sel.num] || null) : null;
      const rowOf = (appId) => model.rows.find((r) => r.app.id === appId) || null;
      const selAppOfMod = selMod
        ? ((model.rows.find((r) => r.groups.some((g) => g.items.indexOf(selMod.sid) >= 0)) || {}).app || null)
        : null;
      const appItems = selApp ? (rowOf(selApp.id) || { groups: [] }).groups.reduce((acc, g) => acc.concat(g.items), []) : [];

      const detail = (selApp || selMod) ? h('div', { className: 'dsh-mm-top', onClick: (e) => e.stopPropagation() },
        h('h3', null, selApp ? selApp.name : selMod.name),
        h('div', { className: 'muted', style: { marginBottom: 8 } },
          selApp ? selApp.desc : ((selMod.once ? '已完成' : '进行中') + ' · 双击进入会话')),
        selApp ? appItems.map((n) => h('div', { className: 'row', key: n },
          h('span', null, model.mods[n] ? model.mods[n].name : n))) : null,
        selAppOfMod ? h('div', { className: 'row' }, h('span', null, '归入'), h('span', null, selAppOfMod.name)) : null,
        h('div', { style: { marginTop: 10 } },
          h('button', {
            className: 'nav', style: { border: '1px solid #e2e8f0', background: '#fff', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' },
            onClick: goOverview,
          }, '← 全览'))
      ) : null;

      const onWheel = (e) => {
        const st = stageRef.current;
        if (!st) return;
        e.preventDefault();
        const hgt = st.clientHeight;
        setCam((c) => {
          const minY = Math.min(0, hgt - layoutRef.current.worldH * c.k);
          return { ...c, y: Math.max(minY, Math.min(0, c.y - (e.deltaY || 0))) };
        });
      };

      return h('div', { className: 'dsh-mm-panel' },
        h('div', { className: 'dsh-mm-head' },
          h('h1', null, '工作区思维导图'),
          h('span', { className: 'sub' }, '点应用推近 · 点空白回全览'),
          h('div', { className: 'grow' }),
          h('input', {
            placeholder: '搜索项目…', value: q,
            onChange: (e) => setQ(e.target.value),
          }),
          h('select', { value: density, onChange: (e) => { setDensity(e.target.value); try { localStorage.setItem('dsh-mindmap-density', e.target.value); } catch (err) {} } },
            h('option', { value: 'text' }, '纯文字'),
            h('option', { value: 'dot' }, '文字 + 状态点'),
            h('option', { value: 'bar' }, '文字 + 色条'),
            h('option', { value: 'full' }, '文字 + 编号 + 标签')
          ),
          h('button', {
            style: { border: '1px solid #dbe3ee', background: '#fff', borderRadius: 8, padding: '6px 11px', fontSize: 12, cursor: 'pointer', color: '#334155' },
            onClick: goOverview,
          }, '← 全览')
        ),
        h('div', { className: 'dsh-mm-stage', ref: stageRef, onClick: () => goOverview(), onWheel },
          h('div', { className: 'dsh-mm-scene', ref: sceneRef, style: { transform: dim, width: WORLD_W, height: l.worldH } },
            h('svg', { width: WORLD_W, height: l.worldH, style: { position: 'absolute', left: 0, top: 0, overflow: 'visible' } },
              h('g', { fill: 'none', strokeWidth: 1.3 },
                data.current.edges.map((e, i) => h('path', {
                  key: i, d: e.d, stroke: e.color, strokeOpacity: e.thin ? 0.4 : 0.55,
                }))
              )
            ),
            rootNode,
            rows
          ),
          detail,
          sel || q ? null : h('div', { className: 'dsh-mm-empty', style: { pointerEvents: 'none', top: 'auto', bottom: 16, height: 'auto' } })
        )
      );
    }

    /* 渲染出错时把错误显示出来，而不是留一片空白 */
    class Boundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { err: null };
      }
      static getDerivedStateFromError(err) { return { err }; }
      componentDidCatch(err) {
        try { console.error('[dsh-workspace-mindmap]', err); } catch (e) {}
      }
      render() {
        if (!this.state.err) return this.props.children;
        const msg = String((this.state.err && this.state.err.message) || this.state.err);
        const stack = String((this.state.err && this.state.err.stack) || '');
        return h('div', { style: { padding: 24, fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 12, lineHeight: 1.6, color: '#b91c1c', whiteSpace: 'pre-wrap' } },
          '思维导图渲染出错：' + msg + '\n\n' + stack);
      }
    }

    function PanelIcon({ size }) {
      return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7 },
        h('rect', { x: 2.5, y: 9.5, width: 6, height: 5, rx: 1.2 }),
        h('path', { d: 'M8.5 12h3M11.5 12V6h3.5M11.5 12v6h3.5' }),
        h('rect', { x: 15, y: 3.5, width: 6, height: 5, rx: 1.2 }),
        h('rect', { x: 15, y: 15.5, width: 6, height: 5, rx: 1.2 })
      );
    }

    return {
      inject: ['slots', 'layout', 'uiWorkspace', 'workspaces', 'sessions', 'locale'],
      apply(ctx) {
        ctx.effect(() => {
          window.__DSH_MINDMAP__ = {
            layout: ctx.layout,
            uiWorkspace: ctx.uiWorkspace,
            workspaces: ctx.workspaces,
            sessions: ctx.sessions,
          };
          return () => { delete window.__DSH_MINDMAP__; };
        });

        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay', id: 'workspace-mindmap.topbar', order: -100,
        }, (props) => h(Boundary, null, h(TopBar, props))));

        ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: 'mindmap' },
          (props) => h(Boundary, null, h(MindMap, props))));

        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist', id: 'mindmap', order: 20, label: () => '思维导图',
        }, PanelIcon));
      },
    };
  },
});
