// Base URLs for reports (loaded on-demand from a Mode defintion), to update an url to a report, please update the Mode defintion instead of this file
let URLS = {};

function buildMatchingScienceReportUrls() {
  var map = {};
  const ds = readQuery("matching_science_reports_urls");
  if (ds && Array.isArray(ds.content) && ds.content.length > 0) {
    map = ds.content[0];
  }
  return map;
}

function getLinkBaseUrl(key) {
  const k = String(key);
  const upper = k.toUpperCase();

  if (!URLS || Object.keys(URLS).length === 0) {
    URLS = buildMatchingScienceReportUrls();
  }

  return URLS[k] || URLS[upper] || "";
}

// Dataset keys for base URLs
const LINK_KEYS = {
  DRIVER_VIEWER: "DRIVER_VIEWER",
  RIDE_VIEWER: "RIDE_VIEWER",
  PLAN_GEN_INFO: "PLAN_GEN_INFO",
  MATCH_CYCLE_INFO: "MATCH_CYCLE_INFO",
  ASSIGNMENT_GROUP_VIEWER: "ASSIGNMENT_GROUP_VIEWER",
  PLAN_VIEWER: "PLAN_VIEWER",
  PLAN_VIEWER_V2: "PLAN_VIEWER_V2",
  SCORE_TREE: "SCORE_TREE",
  SCORE_DIFF: "SCORE_DIFF",
  ROW_VIEWER: "ROW_VIEWER",
  AIRPORT_QUEUE_VIEWER: "AIRPORT_QUEUE_VIEWER",
  RIDER_SESSION_VIEWER: "RIDER_SESSION_VIEWER",
  TOM_SCHEDULED_RIDE: "TOM_SCHEDULED_RIDE",
  TOM_REPLAY_RIDE: "TOM_REPLAY_RIDE",
  TOM_REPLAY_CYCLE: "TOM_REPLAY_CYCLE",
  TOM_USER: "TOM_USER",
  TOM_REPLAY: "TOM_REPLAY",
};

// Default link text labels
const LINK_TEXT = {
  DRIVER_VIEWER: "DriverViewer",
  RIDE_VIEWER: "RideViewer",
  PLAN_GEN_INFO: "PlanGenInfo+",
  MATCH_CYCLE_INFO: "MatchCycleInfo",
  ASSIGNMENT_GROUP_VIEWER: "ASGViewer",
  PLAN_VIEWER: "PlanViewer",
  PLAN_VIEWER_V2: "PlanViewerV2",
  SCORE_TREE: "ScoreTree",
  SCORE_DIFF: "ScoreDiff",
  ROW_VIEWER: "RowViewer",
  AIRPORT_QUEUE_VIEWER: "AirportQueueViewer",
  RIDER_SESSION_VIEWER: "RiderSessionViewer",
  TOM_SCHEDULED_RIDE: "details",
  TOM_REPLAY: "Replay",
  TOM_LINK: "TOM",
};

function buildLinkTag(url, linkText) {
  return `<a href="${url}" rel="noopener noreferrer" target="_blank">${linkText}</a>`;
}

// Returns clickable Google Maps link for coordinates
function getGoogleMapLink(lat, lng) {
  const url = `https://www.google.com/maps/place/${lat},${lng}`;
  return buildLinkTag(url, `${lat}, ${lng}`);
}

// Returns query status list: { queryName, statusMessage, statusClass, succeeded }
function _getQueryResultStatuses(requiredQueryNames) {
  return datasets
    .slice()
    .sort(function (queryA, queryB) {
      return queryA.queryName.localeCompare(queryB.queryName);
    })
    .map(function (queryDataset) {
      let statusMessage = "Succeeded",
        statusClass = "query_succeeded",
        succeeded = true;

      if ("succeeded" !== queryDataset.state) {
        succeeded = false;
        statusMessage = "Failed";
        statusClass = "query_failed";
      } else if (
        requiredQueryNames.includes(queryDataset.queryName) &&
        0 === queryDataset.count
      ) {
        succeeded = false;
        statusMessage = "Succeeded but returned no row";
        statusClass = "query_empty";
      }

      return {
        queryName: queryDataset.queryName,
        statusMessage: statusMessage,
        statusClass: statusClass,
        succeeded: succeeded,
      };
    });
}

// Updates loadingdiv with query status HTML. Returns true if all succeeded.
function _addQueryResultsToHtml(statusList) {
  let queryStateHtml = "Query state:<ul>",
    allQueriesSucceeded = true;

  statusList.forEach(function (statusEntry) {
    if (!statusEntry.succeeded) {
      allQueriesSucceeded = false;
    }
    queryStateHtml +=
      "<li>" +
      statusEntry.queryName +
      ": " +
      getElem("span", statusEntry.statusMessage, [statusEntry.statusClass]).outerHTML +
      "</li>";
  });

  queryStateHtml += "</ul>";
  document.getElementById("loadingdiv").innerHTML = getElem("div", queryStateHtml, [
    "queryState",
  ]).outerHTML;

  return allQueriesSucceeded;
}

// Validates required queries have data. Returns true if all pass.
function validateDatasets(requiredQueryNames, showQueryStatusInHTML = true ) {
  var statuses = _getQueryResultStatuses(requiredQueryNames);
  if (showQueryStatusInHTML) {
    _addQueryResultsToHtml(statuses)
  }
  console.log(statuses);
  return statuses.every(function (status) {
    return status.succeeded;
  });
}

// Finds query result by name. Returns dataset or null.
function readQuery(queryName) {
  let queryResult = datasets.find(function (dataset) {
    return dataset.queryName === queryName;
  });

  if (queryResult && queryResult.content.length > 0) {
    return queryResult;
  }

  //todo: have central way to signal errors among all functions
  if (queryResult && queryResult.content.length === 0) {
    console.log("ERROR: Empty data. Query: " + queryName);
  }

  return queryResult; // Returns null if not found, or the empty dataset if found but empty
}

// Creates DOM element with innerHTML and CSS classes
function getElem(tagName, innerHTML, cssClasses) {
  var element = document.createElement(tagName);
  return ((element.innerHTML = innerHTML), element.classList.add(...cssClasses), element);
}

// DriverViewer link
function getDriverViewerLink(
  driverId,
  dateStart,
  timeStart,
  dateEnd,
  timeEnd,
  experiment,
  linkText = LINK_TEXT.DRIVER_VIEWER,
  isEmbeddedLink = false,
  embedId = 999999999
) {
  const maxAge = embedId || 999999999;
  const baseUrl = getLinkBaseUrl(LINK_KEYS.DRIVER_VIEWER);
  let url = isEmbeddedLink
    ? `${baseUrl}/embed?max_age=${maxAge}&`
    : `${baseUrl}?`;
  url += `param_driver_id=${driverId}`;
  url += `&param_date_start=${dateStart}`;
  url += `&param_time_start=${timeStart || ""}`;
  url += `&param_date_end=${dateEnd || ""}`;
  url += `&param_time_end=${timeEnd || ""}`;
  url += `&param_experiment=${experiment || ""}`;

  return buildLinkTag(url, linkText || LINK_TEXT.DRIVER_VIEWER);
}

// RideViewer link
function getRideViewerLink(
  rideId,
  scheduledRideId,
  dateRequested,
  dateScrCreated,
  linkText = LINK_TEXT.RIDE_VIEWER,
  isEmbeddedLink = false,
  embedId = 999999999
) {
  const maxAge = embedId || 999999999;
  const baseUrl = getLinkBaseUrl(LINK_KEYS.RIDE_VIEWER);
  let url = isEmbeddedLink
    ? `${baseUrl}/embed?max_age=${maxAge}&`
    : `${baseUrl}?`;
  url += `param_ride_id=${rideId || ""}`;
  url += `&param_scheduled_ride_id=${scheduledRideId || ""}`;
  url += `&param_date_requested=${dateRequested || ""}`;
  url += `&param_date_scr_created=${dateScrCreated || ""}`;

  return buildLinkTag(url, linkText || LINK_TEXT.RIDE_VIEWER);
}

// PlanGenInfo+ link (dispatch plan generation for a time window)
function getPlanGenInfoLink(
  region,
  eventTime,
  minutesOffset,
  windowMinutes,
  rideId,
  scheduledRideId,
  jobId2,
  linkText,
  signature = LINK_TEXT.PLAN_GEN_INFO
) {
  const baseUrl = `${getLinkBaseUrl(LINK_KEYS.PLAN_GEN_INFO)}?`;
  let url = `${baseUrl}`;

  const cycleTime = moment.utc(eventTime).add(minutesOffset, "minutes");
  const cycleDate = cycleTime.format("YYYY-MM-DD");
  const cycleHourMin = cycleTime.format("HH:mm");
  windowMinutes || (windowMinutes = 5);

  url += `param_region=${region}`;
  url += `&param_cycle_date=${cycleDate}`;
  url += `&param_hourmin=${cycleHourMin}`;
  url += `&param_minute_length=${windowMinutes}`;
  url += `&param_supply_id=${rideId || ""}`;
  url += `&param_job_id1=${scheduledRideId || ""}`;
  url += `&param_job_id2=${jobId2 || ""}`;

  return buildLinkTag(url, linkText || signature || LINK_TEXT.PLAN_GEN_INFO);
}

// MatchCycleInfo link (S3 path: match-cycle-log/YYYY/MM/DD/HH/mm/region/cycleId.gz)
function getMatchCycleInfoLink(
  region,
  eventTime,
  cycleId,
  rideId,
  linkText = LINK_TEXT.MATCH_CYCLE_INFO
) {
  const safeRegion = region || '';
  const safeCycleId = cycleId || '';
  const safeRideId = rideId || '';
  const hasEventTime = Boolean(eventTime);
  const hasRegion = Boolean(safeRegion);
  const hasCycleId = Boolean(safeCycleId);

  if (!hasEventTime || !hasRegion || !hasCycleId) {
    return linkText || LINK_TEXT.MATCH_CYCLE_INFO;
  }

  // Normalize cycleId (handle values like "84415049096465 MATCHING")
  const normalizedCycleId = String(safeCycleId).trim().split(' ')[0].replace(/[^0-9]/g, '');

  const cycleLogPath = `match-cycle-log/${moment
    .utc(eventTime)
    .format("YYYY/MM/DD/HH/mm")}/${safeRegion}/${normalizedCycleId}.gz`;

  const baseUrl = `${getLinkBaseUrl(LINK_KEYS.MATCH_CYCLE_INFO)}?`;
  let url = `${baseUrl}param_region=${region}`;
  url += `&param_cycle_log_s3_path=${encodeURIComponent(cycleLogPath)}`;
  url += `&param_job_id1=${safeRideId}`;
  url += `&param_status=All`;
  url += `&param_supply_id=`;
  url += `&param_job_id2=`;

  return buildLinkTag(url, linkText || LINK_TEXT.MATCH_CYCLE_INFO);
}

// AssignmentGroupViewer link
function getAssignmentGroupViewerLink(
  dateString,
  assignmentGroupId,
  linkText = LINK_TEXT.ASSIGNMENT_GROUP_VIEWER,
  isEmbeddedLink = false,
  embedId = 999999999
) {
  const maxAge = embedId || 999999999;
  const baseUrl = getLinkBaseUrl(LINK_KEYS.ASSIGNMENT_GROUP_VIEWER);
  let url = isEmbeddedLink
    ? `${baseUrl}/embed?max_age=${maxAge}&`
    : `${baseUrl}?`;
  url += `param_ds=${dateString}`;
  url += `&param_assignment_group_id=${assignmentGroupId}`;

  return buildLinkTag(url, linkText || LINK_TEXT.ASSIGNMENT_GROUP_VIEWER);
}

// PlanViewer link (dispatch plan/option for a cycle)
function getPlanViewerLink(
  dispatchOptionId,
  dateString,
  cycleId,
  region,
  driverId,
  hour,
  linkText,
  signature = LINK_TEXT.PLAN_VIEWER,
  isEmbeddedLink = false,
  embedId = 999999999
) {
  const base = getLinkBaseUrl(LINK_KEYS.PLAN_VIEWER);
  const baseUrl = isEmbeddedLink
    ? `${base}/embed?max_age=${embedId || 999999999}&`
    : `${base}?`;

  let url = `${baseUrl}param_dispatch_option_id=${dispatchOptionId}`;
  url += `&param_ds=${dateString}`;
  url += `&param_cycle_id=${cycleId}`;
  url += `&param_region=${region}`;
  url += `&param_supply_id=${driverId}`;
  url += `&param_hr=${hour}`;

  return buildLinkTag(url, linkText || signature || LINK_TEXT.PLAN_VIEWER);
}

// PlanViewer V2 link
function getPlanViewerV2Link(
  dispatchOptionId,
  linkText = LINK_TEXT.PLAN_VIEWER_V2,
  isEmbeddedLink = false,
  embedId = 999999999
) {
  const base = getLinkBaseUrl(LINK_KEYS.PLAN_VIEWER_V2);
  const baseUrl = isEmbeddedLink
    ? `${base}/embed?max_age=${embedId || 999999999}&`
    : `${base}?`;
  let url = `${baseUrl}param_dispatch_option_id=${dispatchOptionId}`;
  return buildLinkTag(url, linkText || LINK_TEXT.PLAN_VIEWER_V2);
}

// ScoreTree link (score breakdown for a dispatch option)
function getScoreTreeLink(
  dateString,
  region,
  cycleId,
  dispatchOptionId,
  hour,
  configString,
  linkText,
  signature = LINK_TEXT.SCORE_TREE,
  isEmbeddedLink = false,
  embedId = 999999999
) {
  const base = getLinkBaseUrl(LINK_KEYS.SCORE_TREE);
  const baseUrl = isEmbeddedLink
    ? `${base}/embed?max_age=${embedId || 999999999}&`
    : `${base}?`;

  let url = `${baseUrl}param_ds=${dateString}`;
  url += `&param_region=${region}`;
  url += `&param_cycle_id=${cycleId}`;
  url += `&param_dispatch_option_id=${dispatchOptionId}`;
  if (hour !== undefined && hour !== null) {
    url += `&param_hr=${hour}`;
  }
  if (configString) {
    url += `&param_config=${configString}`;
  }

  return buildLinkTag(url, linkText || signature || LINK_TEXT.SCORE_TREE);
}

// ScoreDiff link (backward compatibility - routes to ScoreTree)
function getScoreDiffLink(
  dateString,
  region,
  cycleId,
  dispatchOptionId,
  hour,
  linkText,
  signature = LINK_TEXT.SCORE_TREE,
  isEmbeddedLink = false,
  embedId = 999999999
) {
  return getScoreTreeLink(
    dateString,
    region,
    cycleId,
    dispatchOptionId,
    hour,
    /*configString=*/ undefined,
    linkText,
    signature,
    isEmbeddedLink,
    embedId
  );
}

// RowViewer link (generic table row viewer)
function getRowViewerLink(
  table = 'core.rider_sessions',
  idColumn = 'session_id',
  id,
  dateString,
  hour,
  hrColumn = 'hr',
  linkText
) {
  const baseUrl = `${getLinkBaseUrl(LINK_KEYS.ROW_VIEWER)}?`;
  let url = `${baseUrl}param_table=${encodeURIComponent(table)}`;
  url += `&param_ds=${dateString || ''}`;
  url += `&param_id_column_name=${idColumn}`;
  url += `&param_id=${id ?? ''}`;
  if (hour !== undefined && hour !== null) {
    url += `&param_id_column_name2=${hrColumn}`;
    url += `&param_id2=${hour}`;
  }

  return buildLinkTag(url, linkText || LINK_TEXT.ROW_VIEWER);
}

// AirportQueueViewer link
function getAirportQueueViewerLink(
  region,
  dateString,
  cycleId,
  queueName,
  linkText,
  signature = LINK_TEXT.AIRPORT_QUEUE_VIEWER
) {
  const baseUrl = `${getLinkBaseUrl(LINK_KEYS.AIRPORT_QUEUE_VIEWER)}?`;
  let url = `${baseUrl}param_region=${region}`;
  url += `&param_ds=${dateString}`;
  url += `&param_cycle_id=${cycleId}`;
  url += `&param_queue_name=${queueName}`;

  return buildLinkTag(url, linkText || signature || LINK_TEXT.AIRPORT_QUEUE_VIEWER);
}

// RiderSessionViewer link
function getRiderSessionViewerLink(
  sessionId,
  dateString,
  linkText,
  signature = LINK_TEXT.RIDER_SESSION_VIEWER
) {
  const baseUrl = `${getLinkBaseUrl(LINK_KEYS.RIDER_SESSION_VIEWER)}?`;
  let url = `${baseUrl}param_session_id=${sessionId}`;
  url += `&param_ds=${dateString}`;

  return buildLinkTag(url, linkText || signature || LINK_TEXT.RIDER_SESSION_VIEWER);
}

// TOM scheduled ride link
function getScheduledRideLink(
  scheduledRideId,
  linkText = LINK_TEXT.TOM_SCHEDULED_RIDE
) {
  const baseUrl = getLinkBaseUrl(LINK_KEYS.TOM_SCHEDULED_RIDE);
  const url = `${baseUrl}${scheduledRideId}`;
  return buildLinkTag(url, linkText || LINK_TEXT.TOM_SCHEDULED_RIDE);
}

// TOM replay link for ride
function getReplayForRideLink(
  rideId,
  linkText = LINK_TEXT.TOM_REPLAY
) {
  const baseUrl = getLinkBaseUrl(LINK_KEYS.TOM_REPLAY_RIDE);
  const url = `${baseUrl}${rideId}`;
  return buildLinkTag(url, linkText || LINK_TEXT.TOM_REPLAY);
}

// TOM replay link for assignment group
function getReplayForAssignmentGroupLink(
  assignmentGroupId,
  dateString,
  linkText,
  signature = LINK_TEXT.TOM_REPLAY
) {
  const baseUrl = getLinkBaseUrl(LINK_KEYS.TOM_REPLAY_CYCLE);
  let url = `${baseUrl}${assignmentGroupId}`;
  url += `/assignmentGroup/${dateString}`;
  url += `?activeTab=Details`;

  return buildLinkTag(url, linkText || signature || LINK_TEXT.TOM_REPLAY);
}

// TOM replay link for cycle
function getReplayForCycleLink(
  cycleId,
  linkText = LINK_TEXT.TOM_REPLAY
) {
  const baseUrl = getLinkBaseUrl(LINK_KEYS.TOM_REPLAY_CYCLE);
  const url = `${baseUrl}${cycleId}`;
  return buildLinkTag(url, linkText || LINK_TEXT.TOM_REPLAY);
}

// TOM user link
function getTomUserLink(
  userId,
  linkText = LINK_TEXT.TOM_LINK
) {
  const baseUrl = getLinkBaseUrl(LINK_KEYS.TOM_USER);
  const url = `${baseUrl}${userId}`;
  return buildLinkTag(url, linkText || LINK_TEXT.TOM_LINK);
}
