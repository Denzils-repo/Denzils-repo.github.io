const DISCORD_USER_ID = "1260528805861265535";
const GITHUB_URL = "https://github.com/your-username";

const body = document.body;
const toggleBtn = document.getElementById("toggle_mode");
const themeIcon = document.getElementById("theme_icon");

const ICONS = {
  light: "https://www.svgrepo.com/show/416093/basic-outline-sun.svg",
  dark: "https://www.svgrepo.com/show/326719/moon-outline.svg",
};

(function initTheme() {
  const storedTheme = localStorage.getItem("theme");
  if (storedTheme === "dark") {
    body.classList.add("dark");
    themeIcon.src = ICONS.dark;
  }
})();

toggleBtn?.addEventListener("click", () => {
  const darkMode = body.classList.toggle("dark");
  themeIcon.src = darkMode ? ICONS.dark : ICONS.light;
  localStorage.setItem("theme", darkMode ? "dark" : "light");
});

document.getElementById("github")?.addEventListener("click", () => {
  window.open(GITHUB_URL, "_blank");
});

const discordStatusCard = document.getElementById("discord_status");
const discordAvatarEl   = document.getElementById("discord_avatar");
const discordNameEl     = document.getElementById("discord_name");
const discordStateEl    = document.getElementById("discord_state");
const discordActivityEl = document.getElementById("discord_activity");

function formatStatus(status) {
  return {
    online: "Online",
    idle: "Idle",
    dnd: "Do Not Disturb",
    offline: "Offline",
    invisible: "Offline"
  }[status] || "Offline";
}

/* ---------- NEW: activity categories & helpers ---------- */

const ACTIVITY_KEYWORDS = {
  games: [
    "roblox", "fortnite", "valorant", "minecraft",
    "league of legends", "apex", "overwatch",
    "cs2", "cs:go", "rocket league", "genshin"
  ],
  browser: [
    "brave", "chrome", "google chrome", "firefox",
    "edge", "opera", "opera gx", "vivaldi"
  ],
  ide: [
    "visual studio code", "vs code", "vscode",
    "visual studio", "intellij", "webstorm",
    "pycharm", "rider", "clion", "android studio",
    "xcode"
  ],
  modeling: [
    "blender", "maya", "3ds max", "zbrush",
    "substance painter"
  ],
  productivity: [
    "figma", "premiere", "premiere pro", "after effects",
    "davinci", "davinci resolve", "photoshop",
    "illustrator", "canva"
  ],
  music: [
    "spotify", "apple music", "tidal",
    "yt music", "youtube music", "soundcloud"
  ]
};

function getActivityCategory(name) {
  const lower = name.toLowerCase();

  for (const [category, keywords] of Object.entries(ACTIVITY_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) {
      return category;
    }
  }
  return null;
}

function getActivityText(data) {
  if (!data?.activities?.length) return "Working on things...";

  const custom = data.activities.find(a => a.type === 4);
  if (custom?.state) return custom.state;

  const activity = data.activities.find(a => a.type === 0) || data.activities[0];
  if (!activity?.name) return "Working on things...";

  const name = activity.name;
  const category = getActivityCategory(name);

  switch (category) {
    case "games":
      return `Playing <span style="font-weight:800">${name}</span>`;
    case "browser":
      return `Surfing the web on <span style="font-weight:800">${name}</span>`;
    case "ide":
      return `Coding on <span style="font-weight:800">${name}</span>`;
    case "modeling":
      return `Modeling in <span style="font-weight:800">${name}</span>`;
    case "productivity":
      return `Editing in <span style="font-weight:800">${name}</span>`;
    case "music":
      return `Listening to music on <span style="font-weight:800">${name}</span>`;
    default:
      return `Using <span style="font-weight:800">${name}</span>`;
  }
}

function updateDiscordStatus(data) {
  if (!data.discord_user) return;

  const { discord_user, discord_status } = data;

  discordAvatarEl.src = discord_user.avatar
    ? `https://cdn.discordapp.com/avatars/${discord_user.id}/${discord_user.avatar}.png?size=128`
    : "https://cdn.discordapp.com/embed/avatars/1.png";

  discordNameEl.textContent = discord_user.global_name || discord_user.username;

  discordStateEl.textContent = formatStatus(discord_status);

  discordStatusCard.classList.remove("online", "idle", "dnd", "offline");
  discordStatusCard.classList.add(
    ["online", "idle", "dnd"].includes(discord_status) ? discord_status : "offline"
  );

  discordActivityEl.innerHTML = getActivityText(data);
}

function connectLanyard() {
  if (!DISCORD_USER_ID) return;

  const socket = new WebSocket("wss://api.lanyard.rest/socket");

  socket.addEventListener("open", () => {
    socket.send(JSON.stringify({
      op: 2,
      d: { subscribe_to_ids: [DISCORD_USER_ID] }
    }));
  });

  socket.addEventListener("message", event => {
    const payload = JSON.parse(event.data);

    if (payload.op === 1) {
      setInterval(() => socket.send(JSON.stringify({ op: 3 })), payload.d.heartbeat_interval);
    }

    if (["INIT_STATE", "PRESENCE_UPDATE"].includes(payload.t)) {
      const data = payload.d[DISCORD_USER_ID] || payload.d;
      updateDiscordStatus(data);
    }
  });

  socket.addEventListener("close", () => setTimeout(connectLanyard, 5000));
}

connectLanyard();

document.addEventListener("contextmenu", event => event.preventDefault());

document.addEventListener("keydown", event => {
  if (
    event.key === "F12" ||
    (event.ctrlKey && event.shiftKey && event.key === "I") ||
    (event.ctrlKey && event.shiftKey && event.key === "J") ||
    (event.ctrlKey && event.shiftKey && event.key === "C") ||
    (event.ctrlKey && event.key === "U") ||
    (event.key === "F11")
  ) {
    event.preventDefault();
  }
});
