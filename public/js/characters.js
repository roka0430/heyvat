document.addEventListener("alpine:init", () => {
  Alpine.data("charactersList", () => ({
    referenceScore: "recommendation",
    characters: [],

    async init() {
      await this.loadCharacters();
    },

    async loadCharacters() {
      const source = new EventSource("/api/characters/events");

      source.addEventListener("cache", (event) => {
        this.characters = JSON.parse(event.data);
      });

      source.addEventListener("update", (event) => {
        this.characters = JSON.parse(event.data);
        source.close();
      });

      source.addEventListener("error", () => {
        source.close();
      });
    },
  }));
});
