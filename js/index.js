import * as Visual from "./visualization.js";

(async _ => {
  console.log(Visual);
  Visual.createPrioritySection();

  const latestVersion = 120;
  const displayVersionAmount = 5;
  for (let ver = latestVersion; ver > latestVersion - displayVersionAmount; ver--) {
    await Visual.getPieChartForFixedBugsFromVersion(ver);
  }
})();
