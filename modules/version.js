import settings from "./settings.js";

const VERSION_RULES = {
  major: {
    1: {
      maxMinor: 6,
    },
    6: {
      maxMinor: 7,
    },
  },
  minor: {
    "1.0.0": {
      start: "2020-09-28",
    },
    "1.0.1": {
      start: "2020-10-20",
      end: "2020-11-09",
    },
    "2.0.0": {
      start: "2021-07-21",
    },
    "2.6.1": {
      end: "2022-05-31",
    },
    "2.7.0": {
      start: "2022-05-31",
      end: "2022-06-21",
    },
    "2.7.1": {
      start: "2022-06-21",
      end: "2022-07-12",
    },
    "3.0.0": {
      end: "2022-09-09",
    },
    "3.0.1": {
      start: "2022-09-09",
      end: "2022-09-27",
    },
    "3.1.0": {
      start: "2022-09-28",
      end: "2022-10-14",
    },
    "3.1.1": {
      start: "2022-10-14",
      end: "2022-11-01",
    },
    "3.2.0": {
      start: "2022-11-02",
      end: "2022-11-18",
    },
    "3.2.1": {
      start: "2022-11-18",
      end: "2022-12-06",
    },
    "3.3.0": {
      start: "2022-12-07",
    },
    "4.0.0": {
      start: "2023-08-16",
    },
    "5.0.0": {
      start: "2024-08-28",
    },
    "6.0.0": {
      start: "2025-09-10",
      displayName: "Luna Ⅰ",
    },
    "6.0.1": {
      displayName: "Luna Ⅰ",
    },
    "6.1.0": {
      displayName: "Luna Ⅱ",
    },
    "6.1.1": {
      displayName: "Luna Ⅱ",
    },
    "6.2.0": {
      displayName: "Luna Ⅲ",
    },
    "6.2.1": {
      displayName: "Luna Ⅲ",
    },
    "6.3.0": {
      displayName: "Luna Ⅳ",
    },
    "6.3.1": {
      displayName: "Luna Ⅳ",
    },
    "6.4.0": {
      displayName: "Luna Ⅴ",
    },
    "6.4.1": {
      displayName: "Luna Ⅴ",
    },
    "6.5.0": {
      displayName: "Luna Ⅵ",
    },
    "6.5.1": {
      displayName: "Luna Ⅵ",
    },
    "6.6.0": {
      displayName: "Luna Ⅶ",
    },
    "6.6.1": {
      displayName: "Luna Ⅶ",
    },
    "6.7.0": {
      displayName: "Luna Ⅷ",
    },
    "6.7.1": {
      displayName: "Luna Ⅷ",
    },
    "7.0.0": {
      start: "2026-08-12",
    },
  },
};

const VERSION_DATE_RULES = Object.entries(VERSION_RULES.minor)
  .filter(([_, rule]) => "start" in rule)
  .map(([version, rule]) => {
    const [major, minor, half] = version.split(".").map(Number);
    return {
      major,
      minor,
      half,
      ...rule,
    };
  })
  .sort((a, b) => a.major - b.major || a.minor - b.minor || a.half - b.half);

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const compareDates = (date1, date2) => {
  const dt1 = new Date(date1);
  const dt2 = new Date(date2);

  if (dt1 < dt2) return -1;
  if (dt1 > dt2) return 1;
  return 0;
};

const isValidDate = (date) => {
  if (typeof date !== "string") return false;

  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const [, year, month, day] = match.map(Number);

  const parsed = new Date(Date.UTC(year, month - 1, day));

  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
};

const findNearestRuleByVersion = (version) => {
  let i = VERSION_DATE_RULES.length - 1;

  while (i > 0) {
    const rule = VERSION_DATE_RULES[i];

    if (
      rule.major < version.major ||
      (rule.major === version.major && rule.minor < version.minor) ||
      (rule.major === version.major && rule.minor === version.minor && rule.half <= version.half)
    ) {
      break;
    }

    i--;
  }

  return VERSION_DATE_RULES[i];
};

const findNearestRuleByDate = (date) => {
  let i = VERSION_DATE_RULES.length - 1;

  while (i > 0) {
    const rule = VERSION_DATE_RULES[i];

    if (compareDates(rule.start, date) <= 0) {
      break;
    }

    i--;
  }

  return VERSION_DATE_RULES[i];
};

const getVersionDate = (version) => {
  const { major, minor, half, start } = findNearestRuleByVersion(version);

  let v = new Version(major, minor, half, new Date(start));

  while (v.major !== version.major || v.minor !== version.minor || v.half !== version.half) {
    v = v.next;
  }

  return v.inheritedStart;
};

const addDays = (dt, days) => {
  const result = new Date(dt);
  result.setDate(result.getDate() + days);
  return result;
};

class Version {
  constructor(major, minor, half, start = null) {
    if (typeof major === "string") {
      const match = major.match(/^(\d+)\.(\d+)(?:\.(\d+))?$/);

      if (!match) {
        throw new Error(`Invalid version: ${major}`);
      }

      this.major = Number(match[1]);
      this.minor = Number(match[2]);
      this.half = Number(match[3] ?? 0);
    } else {
      this.major = major;
      this.minor = minor;
      this.half = half;
    }

    this.inheritedStart = start;
  }

  get isValid() {
    return this.major >= 1 && this.minor >= 0 && this.minor <= this.maxMinor && this.half >= 0 && this.half <= 1;
  }

  get maxMinor() {
    return VERSION_RULES.major?.[this.major]?.maxMinor ?? 8;
  }

  get name() {
    return `${this.major}.${this.minor}.${this.half}`;
  }

  get displayName() {
    return VERSION_RULES.minor?.[this.name]?.displayName ?? null;
  }

  get start() {
    const rule = VERSION_RULES.minor?.[this.name];

    if (rule?.start) {
      return new Date(rule.start);
    }

    if (this.inheritedStart) {
      return new Date(this.inheritedStart);
    }

    return getVersionDate(this);
  }

  get end() {
    const rule = VERSION_RULES.minor?.[this.name];

    if (rule?.end) {
      return new Date(rule.end);
    }

    if (this.half === 0) {
      return addDays(this.start, 20);
    }

    return addDays(this.start, 21);
  }

  get preview() {
    if (this.half === 1) {
      return null;
    }

    const twoWeeksAgo = addDays(this.start, -14);
    return addDays(twoWeeksAgo, 5 - twoWeeksAgo.getDay());
  }

  get next() {
    if (this.half === 0) {
      return new Version(this.major, this.minor, 1, addDays(this.start, 20));
    }

    if (this.minor < this.maxMinor) {
      return new Version(this.major, this.minor + 1, 0, addDays(this.start, 22));
    }

    return new Version(this.major + 1, 0, 0, addDays(this.start, 22));
  }

  get data() {
    return {
      major: this.major,
      minor: this.minor,
      half: this.half,
      start: this.start,
      end: this.end,
      ...(this.preview && { preview: this.preview }),
      ...(this.displayName && { name: this.displayName }),
    };
  }

  compare(other) {
    other = other instanceof Version ? other : new Version(other);

    for (const key of ["major", "minor", "half"]) {
      if (this[key] < other[key]) return -1;
      if (this[key] > other[key]) return 1;
    }

    return 0;
  }
}

const getVersionByDate = async (date, raw = false) => {
  if (!isValidDate(date)) {
    throw new Error("Invalid date");
  }

  const rule = findNearestRuleByDate(date);

  if (compareDates(rule.start, date) > 0) {
    throw new Error("Invalid date");
  }

  let v = new Version(rule.major, rule.minor, rule.half, rule.start);

  while (true) {
    if (compareDates(v.start, date) <= 0 && compareDates(v.end, date) >= 0) {
      break;
    }

    v = v.next;
  }

  if (raw) {
    return v;
  }

  return v.data;
};

const getVersionsByDateRange = async (dateFrom, dateTo) => {
  if (!isValidDate(dateFrom) || !isValidDate(dateTo) || compareDates(dateFrom, dateTo) >= 0) {
    throw new Error("Invalid date range");
  }

  let v = await getVersionByDate(dateFrom, true);

  const res = [v.data];

  while (compareDates(v.end, dateTo) < 0) {
    v = v.next;
    res.push(v.data);
  }

  return res;
};

const getVersionsByVersionRange = async (versionFrom, versionTo) => {
  let v = new Version(versionFrom);
  const to = new Version(versionTo);

  if (!v.isValid || !to.isValid || v.compare(to) > 0) {
    throw new Error("Invalid version range");
  }

  const res = [v.data];

  while (v.compare(to) < 0) {
    v = v.next;
    res.push(v.data);
  }

  return res;
};

const getVersionByVersionName = async (version) => {
  const versions = await getVersionsByVersionRange(version, version);

  if (versions.length === 1) {
    return versions[0];
  }

  throw new Error("Invalid version");
};

const getCurrentAndNextVersions = async () => {
  const now = new Date();

  const current = await getVersionByDate(formatDate(now), true);
  const next = current.next;

  return {
    current: current.data,
    next: next.data,
  };
};

const version = {
  getVersionByDate,
  getVersionsByDateRange,
  getVersionByVersionName,
  getVersionsByVersionRange,
  getCurrentAndNextVersions,
};

export default version;
