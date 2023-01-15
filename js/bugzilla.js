const BUGZILLA_REST_URL = "https://bugzilla.mozilla.org/rest/bug";
const BUGZILLA_BUTLIST_URL = "https://bugzilla.mozilla.org/buglist.cgi";
const FIXED_BUGS_REQUEST = "?v2=verified&o1=equals&query_format=advanced&f1=cf_status_firefox${VERSION}&component=Audio%2FVideo&component=Audio%2FVideo%3A%20cubeb&component=Audio%2FVideo%3A%20GMP&component=Audio%2FVideo%3A%20Playback&resolution=FIXED&j_top=OR&f2=cf_status_firefox${VERSION}&v1=fixed&o2=equals&product=Core"

var DEBUG = true;
var VERVOSE = false;

function LOG(message) {
  if (DEBUG) {
    console.log(message);
  }
}

function LOGV(message) {
  if (DEBUG && VERVOSE) {
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
  { name: "Web codec API", blockers : [1774300], keywords : ["VideoFrame"]},
  { name: "Libdvaid update", keywords : ["update", "libdav1d"]},
  { name: "Android playback", keywords : ["android"]},
  { name: "GMP", keywords : ["gmp"]},
  { name: "Seamless looping", blockers : [1262276], keywords : ["seamless"]},
  { name : "Others"},
];

function GetBugListLinkForVersion(version) {
  return BUGZILLA_BUTLIST_URL + FIXED_BUGS_REQUEST.replaceAll("${VERSION}", version);
}

function GetBugListRestfulForVersion(version) {
  return BUGZILLA_REST_URL + FIXED_BUGS_REQUEST.replaceAll("${VERSION}", version);
}

async function GenerateFixedBugListForVersion(version) {
  // TODO : verify version
  let buglist;
  if (sessionStorage.getItem(version)) {
    buglist = JSON.parse(sessionStorage.getItem(version));
    LOG(`Generate buglist for ${version} from session storage`);
  } else {
    const response = await fetch(GetBugListRestfulForVersion(version));
    buglist = await response.json();
    buglist.bugs.sort((a,b) => a.cf_last_resolved > b.cf_last_resolved);
    sessionStorage.setItem(version, JSON.stringify(buglist));
    LOG(`Generate buglist for ${version} from fetching`);
  }
  return buglist;
}

function isBugBelongToCategory(bug, category) {
  // By blockers
  if (bug.depends_on && category.blockers) {
    for (let blocker of category.blockers) {
      if (bug.depends_on.includes(blocker)) {
        LOGV(`'${bug.summary}' matches '${category.name}' due to blocker match`);
        return true;
      }
    }
  }

  // By keywords
  if (category.keywords) {
    let isMatched = true;
    for (let keyword of category.keywords) {
      if (!bug.summary.toLowerCase().includes(keyword.toLowerCase())) {
        isMatched = false;
        break;
      }
    }
    if (isMatched) {
      LOGV(`'${bug.summary}' matches '${category.name}' due to keyword match`);
    }
    return isMatched;
  }

  LOGV(`'${bug.summary}' doesn't find any match`);
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
    const category = GetCategoryForBug(bug);
    if (map.has(category)) {
      map.set(category, map.get(category) + 1);
    } else {
      map.set(category, 1);
    }
  });
  return map;
}

(async _ =>{
  let buglist = await GenerateFixedBugListForVersion("110");
  GetCategoriesDistributionFromBugList(buglist);
})();

