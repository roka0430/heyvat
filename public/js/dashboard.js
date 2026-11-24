document.addEventListener("alpine:init", () => {
  Alpine.data("user", () => ({
    USER_INFO_KEY: "heyvat:user_info",

    userInfo: {},

    async init() {
      await this.loadUserInfo();
    },

    async loadUserInfo() {
      const source = new EventSource("/api/user/events");

      source.addEventListener("cache", (event) => {
        this.userInfo = JSON.parse(event.data);
      });

      source.addEventListener("update", (event) => {
        this.userInfo = JSON.parse(event.data);
        source.close();
      });

      source.addEventListener("error", () => {
        source.close();
      });
    },
  }));

  Alpine.data("events", () => ({
    currentVersion: {
      major: null,
      minor: null,
      half: null,
      display: null,
    },

    toVersionName(major, minor, half) {
      return `${major}.${minor}${["前半", "後半"][half]}`;
    },

    get currentVersionName() {
      return this.currentVersion.display
        ? this.currentVersion.display
        : this.toVersionName(this.currentVersion.major, this.currentVersion.minor, this.currentVersion.half);
    },

    async init() {
      const current = await this.getCurrentVersion();

      this.currentVersion.major = current.major;
      this.currentVersion.minor = current.minor;
      this.currentVersion.half = current.half;
      this.currentVersion.display = current.display;
    },

    async getCurrentVersion() {
      try {
        const res = await fetch("/api/versions");
        return await res.json();
      } catch (error) {
        console.error(error);
        return {};
      }
    },
  }));
});
