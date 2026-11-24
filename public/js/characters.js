document.addEventListener("alpine:init", () => {
  Alpine.data("charactersList", () => ({
    characters: [],

    async init() {
      this.characters = await this.loadCharacters();
    },

    // async loadCharacters() {
    //   try {
    //     const res = await fetch("/api/characters");
    //     return res.json();
    //   } catch (error) {
    //     console.error(error);
    //     return [];
    //   }
    // },

    async loadCharacters() {
      const source = new EventSource("/api/characters/events");

      source.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("受信:", data);
      };

      source.onerror = (err) => {
        console.error("SSEエラー:", err);
      };
    },
  }));
});
