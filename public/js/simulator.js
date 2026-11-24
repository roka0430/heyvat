document.addEventListener("alpine:init", () => {
  Alpine.data("simulator", () => ({
    LOCAL_STORAGE_KEY: "heyvat:simulator_inputs",
    PRIMO_PER_MONTH: 9500,

    defaultInputs: {
      target: 0,
      primo: 0,
      fate: 0,
      starlight: 0,
      pity: 0,
      guaranteed: false,
      welkin: false,
    },

    inputs: {
      target: 0,
      primo: 0,
      fate: 0,
      starlight: 0,
      pity: 0,
      guaranteed: false,
      welkin: false,
    },

    outputs: [],

    async init() {
      this.loadInputs();
      this.simulateWish();

      this.$watch(
        () => this.inputs,
        () => {
          this.saveInputs();
        },
      );
    },

    get totalPrimo() {
      return Math.floor(this.inputs.primo + (this.inputs.fate + this.inputs.pity + this.inputs.starlight / 5) * 160);
    },

    get primoPerDay() {
      const primoPerMonth = this.PRIMO_PER_MONTH + (this.inputs.welkin ? 3000 : 0);
      return (primoPerMonth * 12) / 365.2422;
    },

    toDateString(date) {
      const dt = new Date(date);
      return [
        String(dt.getFullYear()).padStart(2, "4"),
        String(dt.getMonth() + 1).padStart(2, "0"),
        String(dt.getDate()).padStart(2, "0"),
      ].join("-");
    },

    toVersionString(major, minor, half) {
      return `${major}.${minor}${["前半", "後半"][half]}`;
    },

    formatPercentage(probability) {
      return (probability * 100).toFixed(2);
    },

    getDateDiff(date1, date2) {
      const dt1 = new Date(date1);
      dt1.setHours(0, 0, 0, 0);
      const dt2 = new Date(date2);
      dt2.setHours(0, 0, 0, 0);

      const msPerDay = 24 * 60 * 60 * 1000;
      return Math.floor(Math.abs(dt2 - dt1) / msPerDay);
    },

    loadInputs() {
      const content = localStorage.getItem(this.LOCAL_STORAGE_KEY) ?? null;
      const inputs = content ? JSON.parse(content) : {};
      this.inputs = { ...this.defaultInputs, ...inputs };
    },

    saveInputs() {
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(this.inputs));
    },

    async loadVersionList() {
      try {
        const dateFrom = new Date();
        const dateTo = new Date(dateFrom.getFullYear() + 1, dateFrom.getMonth(), dateFrom.getDate());

        const dateFromString = this.toDateString(dateFrom);
        const dateToString = this.toDateString(dateTo);

        const res = await fetch(`/api/versions?dateFrom=${dateFromString}&dateTo=${dateToString}`);
        return await res.json();
      } catch (error) {
        console.error(error);
        return [];
      }
    },

    async simulateWish() {
      const now = new Date();
      const versions = await this.loadVersionList();

      const primo = this.totalPrimo;
      const outputs = [];

      for (const version of versions) {
        const days = this.getDateDiff(now, version.end);
        const totalPrimo = Math.floor((primo + days * this.primoPerDay) * (16 / 15));

        outputs.push({
          version: this.toVersionString(version.major, version.minor, version.half),
          end: this.toDateString(version.end),
          days: days,
          primo: totalPrimo,
          fate: Math.floor(totalPrimo / 160),
        });
      }

      const pullsList = outputs.map((item) => item.fate);
      const result = await this.requestSimulation(pullsList, this.inputs.target, this.inputs.guaranteed);

      for (const output of outputs) {
        output.probability = result?.[output.fate] ?? 0;
      }

      this.outputs = outputs;
    },

    async requestSimulation(pullsList, target, guaranteed = false) {
      try {
        const body = { pullsList, target, guaranteed };

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
