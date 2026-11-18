document.addEventListener("alpine:init", () => {
  Alpine.store("toast", {
    messages: [],

    // TODO typeに対応させる
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
});
