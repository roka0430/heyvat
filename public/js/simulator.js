document.addEventListener("alpine:init", () => {
  Alpine.data("simulator", () => ({
    LOCAL_STORAGE_KEY: "heyvat:simulator_inputs",

    defaultInputs: {
      target: 0,
      primo: 0,
      fate: 0,
      starlight: 0,
      pity: 0,
      guaranteed: false,
    },

    inputs: {
      target: 0,
      primo: 0,
      fate: 0,
      starlight: 0,
      pity: 0,
      guaranteed: false,
    },

    async init() {
      this.$watch(
        () => this.inputs,
        () => {
          this.saveInputs();
          this.simulateWish();
        },
      );

      this.loadInputs();
    },

    loadInputs() {
      const content = localStorage.getItem(this.LOCAL_STORAGE_KEY) ?? null;
      const inputs = content ? JSON.parse(content) : {};
      this.inputs = { ...this.defaultInputs, ...inputs };
    },

    saveInputs() {
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(this.inputs));
    },

    async simulateWish() {
      // TODO inputsから引数を生成するところを

      const result = await this.requestSimulation(10, 1, this.inputs.guaranteed);
      console.log(result);
    },

    async requestSimulation(maxPulls, target, guaranteed = false) {
      try {
        const body = { maxPulls, target, guaranteed };

        const res = await fetch("/api/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        return res.json();
      } catch (error) {
        console.error(error);
        return {};
      }
    },
  }));
});
