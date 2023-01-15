function getCanvasForVersion(version) {
  let canvas = document.createElement('canvas');
  canvas.id = `chart_${version}`;
  canvas.style = "width:100%;height:75%;";
  return canvas;
}

async function getPieChartForFixedBugsFromVersion(version) {
  const root = createFixedBugListVisualRoot();

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

function createFixedBugListVisualRoot() {
  let root = document.createElement("div");
  root.className = "fixed-bug-list";
  document.querySelector(".chart-data > .horizontal-scroll-bar").appendChild(root);
  return root;
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