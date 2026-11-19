document.addEventListener("alpine:init", () => {
  Alpine.store("toast", {
    messages: [],

    show(message, type) {
      const id = Date.now() + Math.random();

      this.messages.unshift({ id, message, type, leaving: false });

      setTimeout(() => {
        const message = this.messages.find((message) => message.id === id);

        if (!message) {
          return;
        }

        message.leaving = true;

        setTimeout(() => {
          this.remove(id);
        }, 300);
      }, 4000);
    },

    remove(id) {
      this.messages = this.messages.filter((message) => message.id !== id);
    },
  });

  Alpine.data("header", () => ({
    async copyUid(uid) {
      try {
        await navigator.clipboard.writeText(String(uid));
        this.$store.toast.show("UIDをコピーしました", "success");
      } catch (error) {
        console.error("Clipboard copy failed:", error);
        this.$store.toast.show("UIDのコピーに失敗しました", "error");
      }
    },
  }));

  Alpine.data("sidebar", () => ({
    theme: "light",

    init() {
      const theme = localStorage.getItem("heyvat:theme");

      if (theme === "light" || theme === "dark") {
        this.theme = theme;
      }

      this.updateTheme();
    },

    toggleTheme() {
      this.theme = this.theme === "light" ? "dark" : "light";
      localStorage.setItem("heyvat:theme", this.theme);
      this.updateTheme();
    },

    updateTheme() {
      document.documentElement.classList.toggle("dark", this.theme === "dark");
    },
  }));
});
