import type { SessionSummary } from "@threadcast/shared";

type DatePreset = {
  label: string;
  days: number;
};

const DATE_PRESETS: DatePreset[] = [
  { label: "Today", days: 1 },
  { label: "Last 3 days", days: 3 },
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
];

const filterSessionsByAge = (opts: {
  sessions: SessionSummary[];
  days: number;
}): SessionSummary[] => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - opts.days);
  cutoff.setHours(0, 0, 0, 0);
  return opts.sessions.filter(
    (s) => new Date(s.lastModified).getTime() >= cutoff.getTime()
  );
};

const filterSessionsSince = (opts: {
  sessions: SessionSummary[];
  since: Date;
}): SessionSummary[] => {
  const cutoff = opts.since.getTime();
  return opts.sessions.filter(
    (s) => new Date(s.lastModified).getTime() >= cutoff
  );
};

type PresetCount = {
  label: string;
  days: number;
  total: number;
};

const getPresetCounts = (opts: {
  sessions: SessionSummary[];
}): PresetCount[] => {
  return DATE_PRESETS.map((preset) => {
    const matching = filterSessionsByAge({
      sessions: opts.sessions,
      days: preset.days,
    });
    return {
      label: preset.label,
      days: preset.days,
      total: matching.length,
    };
  });
};

export {
  filterSessionsByAge,
  filterSessionsSince,
  getPresetCounts,
  DATE_PRESETS,
  type DatePreset,
  type PresetCount,
};
