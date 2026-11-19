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

    cells: [],

    get cells() {
      return Array.from({ length: 42 }, (_, index) => ({
        key: index,
        date: index,
      }));
    },
  }));
});
