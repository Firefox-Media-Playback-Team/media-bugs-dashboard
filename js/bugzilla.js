const BUGZILLA_REST_URL = "https://bugzilla.mozilla.org/rest/bug";
const BUGZILLA_BUGLIST_URL = "https://bugzilla.mozilla.org/buglist.cgi";
const FIXED_BUGS_REQUEST = "?v2=verified&o1=equals&query_format=advanced&f1=cf_status_firefox${VERSION}&component=Audio%2FVideo&component=Audio%2FVideo%3A%20cubeb&component=Audio%2FVideo%3A%20GMP&component=Audio%2FVideo%3A%20Playback&resolution=FIXED&j_top=OR&f2=cf_status_firefox${VERSION}&v1=fixed&o2=equals&product=Core"
export const PRIORITY_BUGS_REQUEST = "?resolution=---&component=Audio%2FVideo&component=Audio%2FVideo%3A%20cubeb&component=Audio%2FVideo%3A%20GMP&component=Audio%2FVideo%3A%20Playback&priority=${PRIORITY}";

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

var CATEGORIES;

export function getBugListLinkForVersion(version) {
  return BUGZILLA_BUGLIST_URL + FIXED_BUGS_REQUEST.replaceAll("${VERSION}", version);
}

export function getBugListLinkForPriority(priority) {
  return BUGZILLA_BUGLIST_URL + PRIORITY_BUGS_REQUEST.replaceAll("${PRIORITY}", priority);
}

function getBugListRestfulForVersion(version) {
  return BUGZILLA_REST_URL + FIXED_BUGS_REQUEST.replaceAll("${VERSION}", version);
}

function getBugListRestfulForPriority(priority, countOnly = false) {
  return BUGZILLA_REST_URL +
         PRIORITY_BUGS_REQUEST.replaceAll("${PRIORITY}", priority) +
        (countOnly ? "&count_only=1":"");
}

export function getBugzillaRestfulUrl({request, target, replace, count_only, update_within_months}) {
  let url = BUGZILLA_REST_URL + request.replaceAll(`${target}`, `${replace}`);

  if (count_only) {
    url += "&count_only=1";
  }
  if (update_within_months) {
    let date = new Date();
    date.setMonth(date.getMonth() - update_within_months);
    let updateSince = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    url += `&chfieldfrom=${updateSince}`;
  }
  return url;
}

export function getBugzillaListUrl({request, target, replace, update_within_months}) {
  let url = BUGZILLA_BUGLIST_URL + request.replaceAll(`${target}`, `${replace}`);
  if (update_within_months) {
    let date = new Date();
    date.setMonth(date.getMonth() - update_within_months);
    let updateSince = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    url += `&chfieldfrom=${updateSince}`;
  }
  console.log(url);
  return url;
}

/**
 * For version
 */
export async function generateFixedBugListForVersion(version) {
  // TODO : verify version
  let buglist;
  if (sessionStorage.getItem(version)) {
    buglist = JSON.parse(sessionStorage.getItem(version));
    LOG(`Generate buglist for ${version} from session storage`);
  } else {
    const response = await fetch(getBugListRestfulForVersion(version));
    buglist = await response.json();
    buglist.bugs.sort((a,b) => a.cf_last_resolved > b.cf_last_resolved);
    sessionStorage.setItem(version, JSON.stringify(buglist.bugs));
    LOG(`Generate buglist for ${version} from fetching`);
    buglist = buglist.bugs;
  }
  return buglist;
}

/**
 * Priority Section
 */
 async function getBugListForPriority(priority) {
  // TODO : verify priority
  let buglist;
  if (sessionStorage.getItem(priority)) {
    buglist = JSON.parse(sessionStorage.getItem(priority));
    LOG(`Generate buglist for ${priority} from session storage`);
  } else {
    const response = await fetch(getBugListRestfulForPriority(priority));
    buglist = await response.json();
    sessionStorage.setItem(priority, JSON.stringify(buglist.bugs));
    LOG(`Generate buglist for ${priority} from fetching`);
    buglist = buglist.bugs;
  }
  return buglist;
}

export async function getBugCountForPriority(priority) {
  // TODO : verify priority
  const response = await fetch(
      getBugListRestfulForPriority(priority, true /* countOnly */));
  let rv = await response.json();
  return rv.bug_count;
}

export async function fecthAndParse(url) {
  const response = await fetch(url, { mode: 'cors'});
  let rv = await response.json();
  return rv;
}

/**
 * Catergory rule
 */
function isBugBelongToCategory(bug, category) {
  // By component
  if (category.component && bug.component === category.component) {
    LOGV(`'${bug.summary}' matches '${category.name}' due to component match`);
    return true;
  }

  // By blockers
  if ((bug.depends_on || bug.blocks) && category.blockers) {
    for (let blocker of category.blockers) {
      if (bug.depends_on.includes(blocker) || bug.blocks.includes(blocker)) {
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

  return false;
}

async function getTriagingCategories() {
  const itemName = "bug_categories";
  if (CATEGORIES === undefined) {
    if (sessionStorage.getItem(itemName)) {
      CATEGORIES = JSON.parse(sessionStorage.getItem(itemName));
      LOG(`Get bug categories from session storage`);
    } else {
      CATEGORIES = await fecthAndParse("./resources/bug_categories.json");
      sessionStorage.setItem(itemName, JSON.stringify(CATEGORIES));
      LOG(`Get bug categories from fetch`);
    }
  }
  return CATEGORIES;
}

async function getCategoryForBug(bug) {
  const categories = await getTriagingCategories();
  for (let category of categories) {
    if (isBugBelongToCategory(bug, category)) {
      return category.name;
    }
  }
  LOGV(`'${bug.summary}' doesn't find any match`);
  return categories[categories.length - 1].name;
}

export async function getCategoriesDistributionFromBugList(buglist) {
  let map = new Map();
  for (let bug of buglist) {
    let category = await getCategoryForBug(bug);
    if (map.has(category)) {
      map.set(category, map.get(category) + 1);
    } else {
      map.set(category, 1);
    }
  };
  // return map in descending order in value (bug amount)
  return new Map([...map.entries()].sort((a, b) => b[1] - a[1]));
}
