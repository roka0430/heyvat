const getDatesInMonth = (year, month) => {
  const lastDate = new Date(year, month, 0).getDate();
  return Array.from({ length: lastDate }, (_, i) => new Date(year, month - 1, i + 1));
};

const getCellsInMonth = (year, month) => {
  const dates = getDatesInMonth(year, month);
  const offset = dates[0].getDay();

  const cells = Array.from({ length: offset }, () => ({ date: null }));

  cells.push(...dates.map((date) => ({ date: date.getDate() })));

  const padding = Math.ceil(cells.length / 7) * 7 - cells.length;

  cells.push(...Array.from({ length: padding }, () => ({ date: null })));

  cells.forEach((cell, i) => (cell.key = i));

  return cells;
};

document.addEventListener("alpine:init", () => {
  Alpine.data("calendar", () => ({
    weekdays: [
      { value: 0, weekday: "日" },
      { value: 1, weekday: "月" },
      { value: 2, weekday: "火" },
      { value: 3, weekday: "水" },
      { value: 4, weekday: "木" },
      { value: 5, weekday: "金" },
      { value: 6, weekday: "土" },
    ],

    year: null,
    month: null,
    cells: [],

    init() {
      const now = new Date();
      this.year = now.getFullYear();
      this.month = now.getMonth() + 1;

      this.cells = getCellsInMonth(this.year, this.month);

      this.$watch(
        () => [this.year, this.month],
        () => {
          this.cells = getCellsInMonth(this.year, this.month);
        },
      );
    },

    changeMonth(offset) {
      const date = new Date(this.year, this.month - 1 + offset);

      this.year = date.getFullYear();
      this.month = date.getMonth() + 1;
    },
  }));
});
