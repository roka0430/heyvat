document.addEventListener("alpine:init", () => {
  Alpine.data("user", () => ({
    USER_INFO_KEY: "heyvat:user_info",

    userInfo: {},

    async init() {
      this.userInfo = this.loadUserInfoCache();
      this.userInfo = await this.loadUserInfo();
      this.saveUserInfoCache();
    },

    loadUserInfoCache() {
      const userInfoCache = localStorage.getItem(this.USER_INFO_KEY) ?? null;
      return userInfoCache ? JSON.parse(userInfoCache) : {};
    },

    saveUserInfoCache() {
      localStorage.setItem(this.USER_INFO_KEY, JSON.stringify(this.userInfo));
    },

    async loadUserInfo() {
      try {
        const res = await fetch("/api/user");
        return res.json();
      } catch (error) {
        console.error(error);
        return {};
      }
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
