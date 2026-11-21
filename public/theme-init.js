/* Sets the studio theme before first paint (no flash). Same logic as src/lib/theme.ts — keep in sync.
   Invitation pages always render light: templates bring their own palettes. */
(function () {
  var d = document.documentElement;
  try {
    var p = location.pathname;
    var invite = /^\/(i|preview)\//.test(p) || /^\/templates\/[^/]+\/preview/.test(p);
    var saved = localStorage.getItem("vs-theme");
    d.dataset.theme = invite
      ? "light"
      : saved === "light" || saved === "dark"
        ? saved
        : matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
  } catch {
    d.dataset.theme = "light";
  }
})();
