document.addEventListener("alpine:init", () => {
  Alpine.data("charactersList", () => ({
    characters: [],

    async init() {
      this.characters = await this.loadCharacters();
    },

    async loadCharacters() {
      try {
        const res = await fetch("/api/characters");
        return res.json();
      } catch (error) {
        console.error(error);
        return [];
      }
    },
  }));
});
