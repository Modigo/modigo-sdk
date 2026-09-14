const S = "https://modigo.online/embed/editor", C = "https://api.modigo.online/api/v1";
function F(e) {
  return typeof e == "string" ? document.querySelector(e) : e;
}
function M(e, i) {
  const s = new URLSearchParams();
  return s.set("token", i), e.session ? (s.set("session_id", String(e.session.id)), s.set("participant_id", e.session.participantId), e.session.displayName && s.set("display_name", e.session.displayName)) : (e.instruction && s.set("instruction", e.instruction), e.language && s.set("language", e.language), e.starterCode && s.set("code", e.starterCode), e.filename && s.set("filename", e.filename)), e.files && e.files.length > 0 && s.set("files", JSON.stringify(e.files)), e.folders && e.folders.length > 0 && s.set("folders", JSON.stringify(e.folders)), `${S}?${s.toString()}`;
}
async function _(e) {
  const i = await fetch(`${C}/editor/token`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${e}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    }
  });
  if (!i.ok) {
    const d = await i.json().catch(() => ({}));
    throw new Error(d.message || d.error || `Auth failed (${i.status})`);
  }
  return (await i.json()).token;
}
async function $(e) {
  var u;
  const i = F(e.container);
  if (!i)
    throw new Error(`[Modigo] Container not found: ${e.container}`);
  let s;
  try {
    s = await _(e.apiKey);
  } catch (r) {
    const o = r.message;
    throw (u = e.onError) == null || u.call(e, { code: "auth_failed", message: o }), r;
  }
  let d = e.files ?? [], l = e.folders ?? [];
  const a = document.createElement("iframe");
  a.src = M(e, s), a.style.border = "none", a.style.width = typeof e.width == "number" ? `${e.width}px` : e.width ?? "100%", a.style.height = typeof e.height == "number" ? `${e.height}px` : e.height ?? "600px", a.style.display = "block", a.allow = "clipboard-write", a.setAttribute("loading", "eager"), a.setAttribute("title", "Modigo Code Editor"), i.innerHTML = "", i.appendChild(a);
  const m = (r) => {
    var n, p, h, y, w, b, k;
    if (!r.origin.includes("modigo.online") || !r.data || typeof r.data.type != "string") return;
    const { type: o, payload: t } = r.data;
    switch (o) {
      case "modigo:ready":
        (n = e.onReady) == null || n.call(e);
        break;
      case "modigo:submit":
        (p = e.onSubmit) == null || p.call(e, {
          exitCode: t.exit_code,
          stdout: t.stdout,
          stderr: t.stderr,
          status: t.status,
          score: t.score,
          file: t.file
        });
        break;
      case "modigo:session_end":
        (h = e.onSessionEnd) == null || h.call(
          e,
          t.results ?? []
        );
        break;
      case "modigo:error":
        (y = e.onError) == null || y.call(e, {
          code: t.code,
          message: t.message
        });
        break;
      case "modigo:file-change":
        if (t.file && typeof t.code == "string") {
          const E = {
            name: t.file,
            content: t.code
          };
          d = d.map((A) => A.name === t.file ? E : A), (w = e.onFileChange) == null || w.call(e, E);
        }
        break;
      case "modigo:files-change":
        Array.isArray(t.files) && (d = t.files, (b = e.onFilesChange) == null || b.call(e, d, l));
        break;
      case "modigo:folders-change":
        Array.isArray(t.folders) && (l = t.folders);
        break;
      case "modigo:run-start":
        (k = e.onSubmit) == null || k.call(e, {
          exitCode: 0,
          stdout: "",
          stderr: "",
          status: "Accepted",
          file: t.file
        });
        break;
    }
  };
  return window.addEventListener("message", m), {
    destroy() {
      window.removeEventListener("message", m), a.remove();
    },
    send(r, o = {}) {
      var t;
      (t = a.contentWindow) == null || t.postMessage({ type: r, payload: o }, "https://modigo.online");
    },
    getFiles() {
      return [...d];
    },
    getFolders() {
      return [...l];
    },
    setFiles(r) {
      var o;
      d = r, (o = a.contentWindow) == null || o.postMessage(
        { type: "set-files", files: r },
        "https://modigo.online"
      );
    },
    updateFile(r, o) {
      var t;
      d = d.map((n) => n.name === r ? { ...n, content: o } : n), (t = a.contentWindow) == null || t.postMessage(
        { type: "set-code", code: o, file: r },
        "https://modigo.online"
      );
    }
  };
}
const x = { init: $ };
typeof window < "u" && (window.modigo = x);
export {
  x as default,
  $ as init
};
//# sourceMappingURL=modigo.es.js.map
