const BUGZILLA_REST_URL = "https://bugzilla.mozilla.org/rest/bug";
const FIXED_BUGS_REQUEST = "?v2=verified&o1=equals&query_format=advanced&f1=cf_status_firefox${VERSION}&component=Audio%2FVideo&component=Audio%2FVideo%3A%20cubeb&component=Audio%2FVideo%3A%20GMP&component=Audio%2FVideo%3A%20Playback&resolution=FIXED&j_top=OR&f2=cf_status_firefox${VERSION}&v1=fixed&o2=equals&product=Core"

var DEBUG = false;

function LOG(message) {
  if (DEBUG) {
    console.log(message);
  }
}

const CATERGORIES = [
  { name: "Web platform test sync", keywords : ["wpt-sync"]},
  { name: "WMF media engine", keywords : ["wmfme"]},
  { name: "Cubeb update", keywords : ["update", "libcubeb"]},
  { name: "Opus update", keywords : ["update", "opus"],},
  { name: "Interminttent test failures", keywords : ["intermittent"]},
  { name: "Crashes", keywords : ["crash"]},
  { name: "Web codec API", keywords : ["VideoFrame"]},
  { name : "Others"},
];

function GetFixedBugsURLForVersion(version) {
  return BUGZILLA_REST_URL + FIXED_BUGS_REQUEST.replaceAll("${VERSION}", version);
}

async function GenerateFixedBugListForVersion(version) {
  // TODO : verify version
  const response = await fetch(GetFixedBugsURLForVersion("110"));
  const buglist = await response.json();
  buglist.bugs.sort((a,b) => a.cf_last_resolved > b.cf_last_resolved);
  console.log(buglist);
  return buglist;
}

function isBugBelongToCategory(bug, category) {
  if (category.keywords) {
    let isMatched = true;
    for (let keyword of category.keywords) {
      if (!bug.summary.toLowerCase().includes(keyword.toLowerCase())) {
        LOG(`${bug.summary} doesn't include ${keyword}`);
        isMatched = false;
        break;
      }
    }
    return isMatched;
  }
  return false;
}

function GetCategoryForBug(bug) {
  for (let category of CATERGORIES) {
    if (isBugBelongToCategory(bug, category)) {
      return category.name;
    }
  }
  return CATERGORIES[CATERGORIES.length - 1].name;
}

function GetCategoriesDistributionFromBugList(buglist) {
  let map = new Map();
  buglist.bugs.forEach(bug => {
    console.log(bug.summary);
    const category = GetCategoryForBug(bug);
    console.log(category);
    if (map.has(category)) {
      map.set(category, map.get(category) + 1);
    } else {
      map.set(category, 1);
    }
  });
  console.log(map);
  return map;
}

(async _ =>{
  let buglist = await GenerateFixedBugListForVersion("110");
  GetCategoriesDistributionFromBugList(buglist);
})();

