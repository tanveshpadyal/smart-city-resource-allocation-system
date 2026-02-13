const { Op } = require("sequelize");
const db = require("../models");

const SLA_HOURS = 48;
const SLA_CHECK_INTERVAL_MS = 15 * 60 * 1000;

const getSlaCutoff = () =>
  new Date(Date.now() - SLA_HOURS * 60 * 60 * 1000);

const updateSlaBreaches = async () => {
  const cutoff = getSlaCutoff();

  const [breachedMarked] = await db.Request.update(
    { slaBreached: true },
    {
      where: {
        status: { [Op.ne]: "RESOLVED" },
        createdAt: { [Op.lt]: cutoff },
        slaBreached: false,
      },
    },
  );

  const [resolvedReset] = await db.Request.update(
    { slaBreached: false },
    {
      where: {
        status: "RESOLVED",
        slaBreached: true,
      },
    },
  );

  return {
    breachedMarked,
    resolvedReset,
    cutoff,
    thresholdHours: SLA_HOURS,
  };
};

const startSlaCheckScheduler = () => {
  if (process.env.ENABLE_SLA_CRON === "false") {
    console.log("[SLA] Scheduler disabled by ENABLE_SLA_CRON=false");
    return null;
  }

  const run = async () => {
    try {
      const result = await updateSlaBreaches();
      if (result.breachedMarked > 0 || result.resolvedReset > 0) {
        console.log(
          `[SLA] Updated breaches: +${result.breachedMarked}, reset:${result.resolvedReset}`,
        );
      }
    } catch (error) {
      console.error("[SLA] Scheduler run failed:", error.message);
    }
  };

  run();
  const timer = setInterval(run, SLA_CHECK_INTERVAL_MS);
  if (typeof timer.unref === "function") {
    timer.unref();
  }
  console.log("[SLA] Scheduler started (15-minute interval)");
  return timer;
};

module.exports = {
  SLA_HOURS,
  updateSlaBreaches,
  startSlaCheckScheduler,
};
