const isSameDay = (dt1, dt2) => {
  return (
    dt1.getFullYear() === dt2.getFullYear() && dt1.getMonth() === dt2.getMonth() && dt1.getDate() === dt2.getDate()
  );
};

const isToday = (dt) => {
  return isSameDay(dt, new Date());
};

const getDatesInMonth = (year, month) => {
  const lastDate = new Date(year, month, 0).getDate();
  return Array.from({ length: lastDate }, (_, i) => new Date(year, month - 1, i + 1));
};

const createCalendarCells = (year, month) => {
  const dates = getDatesInMonth(year, month);

  const offset = dates[0].getDay();
  const padding = (7 - ((offset + dates.length) % 7)) % 7;

  const leadingBlanks = Array.from({ length: offset }, () => ({ date: null }));
  const trailingBlanks = Array.from({ length: padding }, () => ({ date: null }));

  const dateCells = dates.map((dt) => ({
    dt: dt,
    date: dt.getDate(),
  }));

  const cells = [...leadingBlanks, ...dateCells, ...trailingBlanks];
  cells.forEach((cell, i) => (cell.key = i));

  return cells;
};

const enrichCalendarCells = (cells) => {
  for (const cell of cells) {
    cell.classes = [];

    if (cell.dt && isToday(cell.dt)) {
      cell.classes.push("is-today");
    }
  }

  return cells;
};

const getCalendarCells = (year, month) => {
  const cells = createCalendarCells(year, month);
  const enrichedCells = enrichCalendarCells(cells);
  return enrichedCells.map(({ dt, ...rest }) => rest);
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
      this.$watch(
        () => [this.year, this.month],
        () => {
          this.cells = getCalendarCells(this.year, this.month);
        },
      );

      this.goToToday();
    },

    changeMonth(offset) {
      const date = new Date(this.year, this.month - 1 + offset);

      this.year = date.getFullYear();
      this.month = date.getMonth() + 1;
    },

    goToToday() {
      const now = new Date();
      this.year = now.getFullYear();
      this.month = now.getMonth() + 1;
    },
  }));
});
