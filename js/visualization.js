function getCanvasForVersion(version) {
  let canvas = document.createElement('canvas');
  canvas.id = `chart_${version}`;
  canvas.style = "width:100%;height:75%;";
  return canvas;
}

function createRootElementFrom(query, rootClassName) {
  let root = document.createElement("div");
  if (rootClassName) {
    root.className = rootClassName;
  }
  document.querySelector(query).appendChild(root);
  return root;
}

/**
 * Priority Section
 */
 async function createPrioritySection() {
  let title = document.createElement('h2');
  title.innerHTML = `Open Bugs Overview`;
  document.querySelector(".priority-overview>.title").appendChild(title);
  createProrityBugReportSection("P1");
  createProrityBugReportSection("P2");
  createProrityBugReportSection("P3");
  createProrityBugReportSection("P4");
  createProrityBugReportSection("P5");
}

async function createProrityBugReportSection(priority) {
  const root = createRootElementFrom(
      ".priority-overview>.data-section", "priority-section");
  let priorityTitle = document.createElement('h2');
  priorityTitle.innerHTML = priority;
  root.appendChild(priorityTitle);

  let bugAmount = document.createElement('a');
  bugAmount.innerHTML = await getBugCountForPriority(priority);
  bugAmount.href = getBugListLinkForPriority(priority);
  root.appendChild(bugAmount);

  // Get bug count for recent updates
  let url = getBugzillaRestfulUrl({
    request : PRIORITY_BUGS_REQUEST,
    target : "${PRIORITY}",
    replace : priority,
    count_only: true,
    update_within_months: 1,
  });
  let rv = await fecthAndParse(url);
  console.log(rv.bug_count);
}

/**
 * Version Section
 */
async function getPieChartForFixedBugsFromVersion(version) {
  const root = createRootElementFrom(
      ".chart-data > .horizontal-scroll-bar", "fixed-bug-list");

  let titleDiv = document.createElement("div");
  let title = document.createElement('h2');
  title.innerHTML = `Firefox ${version} Fixed Bugs Overview`;
  titleDiv.className = "title";
  titleDiv.appendChild(title);
  root.appendChild(titleDiv);

  let desDiv = document.createElement("div");
  let buglistLink = document.createElement("a");
  buglistLink.innerHTML = "buglist";
  buglistLink.href = getBugListLinkForVersion(version);
  desDiv.appendChild(buglistLink);
  desDiv.className = "description"
  root.appendChild(desDiv);

  let canvas = getCanvasForVersion(version);
  root.appendChild(canvas);

  await createPieChart(canvas, version);
}

async function createPieChart(canvas, version) {
  let buglist = await generateFixedBugListForVersion(version);
  let data = getCategoriesDistributionFromBugList(buglist);

  // convert map to arrays
  let categories = Array.from(data.keys());
  let bugAmounts = Array.from(data.values());

  function getLabelWidth(labelNums) {
    return labelNums > 7 ? 10 : 20;
  }

  function getColorArray(labelNums) {
    if (this.arr == undefined) {
      this.arr = [];
    }
    if (this.arr.length >= labelNums) {
      return arr;
    }
    let currentSz = this.arr.length;
    for (let idx = 0; idx < labelNums - currentSz; idx++) {
      this.arr.push("#" + Math.floor(Math.random()*16777215).toString(16));
    }
    return arr;
  }

  new Chart(canvas, {
    type: "pie",
    data: {
      labels: categories,
      datasets: [{
        backgroundColor: getColorArray(categories.length),
        data: bugAmounts
      }]
    },
    options: {
      legend: {
        // https://www.chartjs.org/docs/latest/configuration/legend.html#legend-label-configuration
        labels: {
          boxWidth: getLabelWidth(categories.length),
          // generateLabels: function(chart) {
          //   return "";
          // }
        }
      }
    }
  });
}
