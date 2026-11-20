const isSameDay = (dt1, dt2) => {
  return (
    dt1.getFullYear() === dt2.getFullYear() && dt1.getMonth() === dt2.getMonth() && dt1.getDate() === dt2.getDate()
  );
};

const isToday = (dt) => {
  return isSameDay(dt, new Date());
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

const getVersionData = async (year, month) => {
  const dtFrom = new Date(year, month - 1, 1);
  const dtTo = new Date(year, month, 1);

  try {
    const res = await fetch(`/api/versions?dateFrom=${formatDate(dtFrom)}&dateTo=${formatDate(dtTo)}`);
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

const getVersionDates = (versions) => {
  const infos = {};

  for (const version of versions) {
    infos[formatDate(new Date(version.start))] = {
      message: `${version.major}.${version.minor}${["前半", "後半"][version.half]}`,
      type: "start",
    };

    if ("preview" in version) {
      infos[formatDate(new Date(version.preview))] = {
        message: `${version.major}.${version.minor}予告番組`,
        type: "event",
      };
    }

    if ("stygian" in version) {
      infos[formatDate(new Date(version.stygian.start))] = {
        message: `幽境 開始`,
        type: "start",
      };

      infos[formatDate(new Date(version.stygian.end))] = {
        message: `幽境 終了`,
        type: "end",
      };

      infos[formatDate(new Date(version.stygian.disturbance))] = {
        message: `地脈活動期 終了`,
        type: "end",
      };
    }
  }

  return infos;
};

const enrichCalendarCells = async (cells, year, month) => {
  const versionData = await getVersionData(year, month);
  const versionDates = getVersionDates(versionData);

  for (const cell of cells) {
    cell.classes = [];
    cell.infos = [];

    const dateString = cell.date ? formatDate(new Date(year, month - 1, cell.date)) : null;

    if (dateString in versionDates) {
      cell.infos.push(versionDates[dateString]);
    }

    if (cell.dt && isToday(cell.dt)) {
      cell.classes.push("is-today");
    }

    if (cell.date === 1) {
      cell.infos.push({
        message: "幻想シアター",
        type: "event",
      });
    }

    if (cell.date === 16) {
      cell.infos.push({
        message: "深境螺旋",
        type: "event",
      });
    }
  }

  return cells;
};

const getCalendarCells = async (year, month) => {
  const cells = createCalendarCells(year, month);
  const enrichedCells = await enrichCalendarCells(cells, year, month);
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
