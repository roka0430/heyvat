import settings from "./settings.js";

const VERSION_RULES = {
  major: {
    6: {
      maxMinor: 7,
    },
  },
  minor: {
    "1.0.0": {
      start: "2020-09-28",
    },
    "6.0.0": {
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
  .filter(([_, rule]) => "start" in rule || "end" in rule)
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

const findNearestDateRule = (version) => {
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

const getVersionDate = (version) => {
  const { major, minor, half, start } = findNearestDateRule(version);

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
    if (this.half === 0) {
      return addDays(this.start, 20);
    }

    return addDays(this.start, 21);
  }

  get next() {
    if (this.half === 0) {
      return new Version(this.major, this.minor, 1, addDays(this.start, 20));
    }

    if (this.minor < this.maxMinor) {
      return new Version(this.major, this.minor + 1, 0, addDays(this.start, 22));
    }

    return new Version(this.major + 1, 0, 0, addDays(this.start, 20));
  }

  get data() {
    return {
      major: this.major,
      minor: this.minor,
      half: this.half,
      start: this.start,
      end: this.end,
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

const getCurrentVersion = async () => {
  return { num: 10 };
};

const getVersionsByDateRange = async (dateFrom, dateTo) => {
  return { dateFrom, dateTo };
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

const version = {
  getCurrentVersion,
  getVersionsByDateRange,
  getVersionsByVersionRange,
};

export default version;
