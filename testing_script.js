// Plain URL bases and default link texts
// TODO: replace these constants with reading values from the shared Mode dataset

const URLS = {
  DRIVER_VIEWER: "https://app.mode.com/lyft/reports/b504c0f33d20",
  RIDE_VIEWER: "https://app.mode.com/lyft/reports/7324be106ba6",
  PLAN_GEN_INFO: "https://app.mode.com/lyft/reports/9ab5afd393d9",
  MATCH_CYCLE_INFO: "https://app.mode.com/lyft/reports/2e037237701c",
  ASSIGNMENT_GROUP_VIEWER: "https://app.mode.com/lyft/reports/805293112700",
  PLAN_VIEWER: "https://app.mode.com/lyft/reports/55b64d4f5292/embed?max_age=999999999",
  PLAN_VIEWER_V2: "https://app.mode.com/lyft/reports/e376ae8855db/embed?max_age=999999999",
  SCORE_TREE: "https://app.mode.com/lyft/reports/b9322ad7c7aa?",
  SCORE_DIFF: "https://app.mode.com/lyft/reports/a05a4797647d?",
  ROW_VIEWER: "https://app.mode.com/lyft/reports/cee187d0547b",
  AIRPORT_QUEUE_VIEWER: "https://app.mode.com/lyft/reports/8a67e9183d07",
  RIDER_SESSION_VIEWER: "https://app.mode.com/lyft/reports/72c161b42d37",
  TOM_SCHEDULED_RIDE: "https://tom.lyft.net/scheduled-rides/",
  TOM_REPLAY_RIDE: "https://tom.lyft.net/replay/ride/",
  TOM_REPLAY_CYCLE: "https://tom.lyft.net/replay/cycle/",
  TOM_USER: "https://tom.lyft.net/users/",
};

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

// Generates a clickable link to Google Maps for a specific location
// lat: Latitude coordinate
// lng: Longitude coordinate
// Returns: HTML anchor tag with link to Google Maps showing the coordinates
function getGoogleMapLink(lat, lng) {
  const url = `https://www.google.com/maps/place/${lat},${lng}`;
  return buildLinkTag(url, `${lat}, ${lng}`);
}

// Validates that all required queries executed successfully
// requiredQueryNames: Array of query names that must have data (e.g., ["Query 1", "Query 2"])
// Returns: List of status objects { queryName, statusMessage, statusClass, succeeded }
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

// Updates the loadingdiv element to show query status
// statusList: List of status objects returned by _getQueryResultStatuses
// Returns: true if all queries succeeded, false otherwise
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

// Validates that all required queries executed successfully before showing the report
// requiredQueryNames: Array of query names that must have data (e.g., ["Query 1", "Query 2"])
// Returns: true if all queries succeeded AND required queries have data, false otherwise
// Also updates the loadingdiv element to show query status (succeeded/failed/empty)
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

// Finds and returns a query result from the datasets array by name
// queryName: The name of the query to find (e.g., "Query 1", "Query 2 Id")
// Returns: The query dataset object, or null if not found/empty
// Logs an error if the query exists but has no content
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

// Creates a DOM element with text content and CSS classes
// tagName: HTML tag name (e.g., "div", "span", "th")
// innerHTML: The text/content to put inside the element
// cssClasses: Array of CSS class names to add (e.g., ["queryState", "m_golden_path"])
// Returns: The created DOM element
function getElem(tagName, innerHTML, cssClasses) {
  var element = document.createElement(tagName);
  return ((element.innerHTML = innerHTML), element.classList.add(...cssClasses), element);
}

// Generates a clickable link to the DriverViewer report
// driverId: The driver's Lyft ID
// dateStart: Start date filter (YYYY-MM-DD format)
// timeStart: Start time filter (HH:mm format, optional)
// dateEnd: End date filter (YYYY-MM-DD format, optional)
// timeEnd: End time filter (HH:mm format, optional)
// experiment: Experiment ID filter (optional)
// linkText: Text to display in the link (defaults to "DriverViewer" if not provided)
// isEmbeddedLink: If true, generates an embedded link with max_age parameter (defaults to false)
// embedId: Max age for embed cache (defaults to 999999999, only used if isEmbeddedLink is true)
// Returns: HTML anchor tag with link to DriverViewer report
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
  let url = isEmbeddedLink
    ? `${URLS.DRIVER_VIEWER}/embed?max_age=${maxAge}&`
    : `${URLS.DRIVER_VIEWER}?`;
  url += `param_driver_id=${driverId}`;
  url += `&param_date_start=${dateStart}`;
  url += `&param_time_start=${timeStart || ""}`;
  url += `&param_date_end=${dateEnd || ""}`;
  url += `&param_time_end=${timeEnd || ""}`;
  url += `&param_experiment=${experiment || ""}`;

  return buildLinkTag(url, linkText || LINK_TEXT.DRIVER_VIEWER);
}

// Generates a clickable link to the RideViewer report
// rideId: The ride's ID
// scheduledRideId: The scheduled ride ID (if it was pre-scheduled, optional)
// dateRequested: When the ride was requested (YYYY-MM-DD format)
// dateScrCreated: When the scheduled ride was created (YYYY-MM-DD format, optional)
// linkText: Text to display (defaults to "RideViewer")
// isEmbeddedLink: If true, generates an embedded link with max_age parameter (defaults to false)
// embedId: Max age for embed cache (defaults to 999999999, only used if isEmbeddedLink is true)
// Returns: HTML anchor tag linking to RideViewer report
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
  let url = isEmbeddedLink
    ? `${URLS.RIDE_VIEWER}/embed?max_age=${maxAge}&`
    : `${URLS.RIDE_VIEWER}?`;
  url += `param_ride_id=${rideId || ""}`;
  url += `&param_scheduled_ride_id=${scheduledRideId || ""}`;
  url += `&param_date_requested=${dateRequested || ""}`;
  url += `&param_date_scr_created=${dateScrCreated || ""}`;

  return buildLinkTag(url, linkText || LINK_TEXT.RIDE_VIEWER);
}

// Generates a link to the Plan Generation Info viewer
// This shows information about dispatch plan generation for a specific time window
// region: The region code (e.g., "NYC", "CHI")
// eventTime: The event timestamp (moment.js UTC object or ISO string)
// minutesOffset: How many minutes to add/subtract from eventTime to get the cycle time
// windowMinutes: How long the time window is (defaults to 5 if not provided)
// rideId: Optional ride ID filter
// scheduledRideId: Optional scheduled ride ID filter
// jobId2: Optional second job ID (used as param_job_id2)
// linkText: Optional link text (defaults to signature if not provided)
// signature: Optional signature/fallback link text (defaults to "PlanGenInfo+")
// Returns: HTML anchor tag linking to PlanGenInfo+ report
// The URL points to: https://app.mode.com/lyft/reports/9ab5afd393d9
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
  let url = `${URLS.PLAN_GEN_INFO}?`;

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

// Generates a link to the Match Cycle Info viewer
// Shows information about a specific matching cycle (when drivers were matched to rides)
// region: Region code
// eventTime: When the matching cycle occurred
// cycleId: The cycle ID (identifies which matching cycle)
// rideId: Optional ride ID filter
// linkText: Text to display (defaults to "MatchCycleInfo")
// Returns: HTML anchor tag
// The URL points to: https://app.mode.com/lyft/reports/2e037237701c
// The cycleLogPath points to an S3 path with format: match-cycle-log/YYYY/MM/DD/HH/mm/region/cycleId.gz
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

  let url = `${URLS.MATCH_CYCLE_INFO}?param_region=${region}`;
  url += `&param_cycle_log_s3_path=${encodeURIComponent(cycleLogPath)}`;
  url += `&param_job_id1=${safeRideId}`;
  url += `&param_status=All`;
  url += `&param_supply_id=`;
  url += `&param_job_id2=`;

  return buildLinkTag(url, linkText || LINK_TEXT.MATCH_CYCLE_INFO);
}

// Generates a link to the Assignment Group Viewer
// Shows information about a group of driver assignments
// dateString: Date string (YYYY-MM-DD format)
// assignmentGroupId: The assignment group ID
// linkText: Text to display (defaults to "ASGViewer")
// isEmbeddedLink: If true, generates an embedded link with max_age parameter (defaults to false)
// embedId: Max age for embed cache (defaults to 999999999, only used if isEmbeddedLink is true)
// Returns: HTML anchor tag
function getAssignmentGroupViewerLink(
  dateString,
  assignmentGroupId,
  linkText = LINK_TEXT.ASSIGNMENT_GROUP_VIEWER,
  isEmbeddedLink = false,
  embedId = 999999999
) {
  const maxAge = embedId || 999999999;
  let url = isEmbeddedLink
    ? `${URLS.ASSIGNMENT_GROUP_VIEWER}/embed?max_age=${maxAge}&`
    : `${URLS.ASSIGNMENT_GROUP_VIEWER}?`;
  url += `param_ds=${dateString}`;
  url += `&param_assignment_group_id=${assignmentGroupId}`;

  return buildLinkTag(url, linkText || LINK_TEXT.ASSIGNMENT_GROUP_VIEWER);
}

// Generates a link to the PlanViewer report (shows dispatch plans)
// Shows the dispatch plan/option that was chosen for a specific cycle
// dispatchOptionId: The dispatch option/plan ID
// dateString: Date string (YYYY-MM-DD format)
// cycleId: The matching cycle ID
// region: Region code
// driverId: Driver ID (optional)
// hour: Hour of the day (0-23)
// linkText: Text to display (defaults to signature if not provided)
// signature: Optional signature/fallback link text (defaults to "PlanViewer")
// Returns: HTML anchor tag
// The URL points to: https://app.mode.com/lyft/reports/55b64d4f5292/embed?max_age=999999999
function getPlanViewerLink(
  dispatchOptionId,
  dateString,
  cycleId,
  region,
  driverId,
  hour,
  linkText,
  signature = LINK_TEXT.PLAN_VIEWER
) {
  let url = `${URLS.PLAN_VIEWER}&param_dispatch_option_id=${dispatchOptionId}`;
  url += `&param_ds=${dateString}`;
  url += `&param_cycle_id=${cycleId}`;
  url += `&param_region=${region}`;
  url += `&param_supply_id=${driverId}`;
  url += `&param_hr=${hour}`;

  return buildLinkTag(url, linkText || signature || LINK_TEXT.PLAN_VIEWER);
}

// Generates a link to PlanViewer V2 (newer version of PlanViewer)
// Similar to getPlanViewerLink but uses a different report ID
// dispatchOptionId: The dispatch option/plan ID
// linkText: Text to display (defaults to "PlanViewerV2")
// Returns: HTML anchor tag
// The URL points to: https://app.mode.com/lyft/reports/e376ae8855db/embed?max_age=999999999
function getPlanViewerV2Link(
  dispatchOptionId,
  linkText = LINK_TEXT.PLAN_VIEWER_V2
) {
  let url = `${URLS.PLAN_VIEWER_V2}&param_dispatch_option_id=${dispatchOptionId}`;
  return buildLinkTag(url, linkText || LINK_TEXT.PLAN_VIEWER_V2);
}

// Generates a link to the Score Tree viewer
// Shows the score_tree breakdown for a dispatch option
// dateString: Date string (YYYY-MM-DD format)
// region: Region code
// cycleId: The matching cycle ID
// dispatchOptionId: The dispatch option ID to compare
// hour: Hour of the day (0-23)
// configString: Optional base64 config string to pre-set view state
// linkText: Text to display (defaults to signature if not provided)
// signature: Optional signature/fallback link text (defaults to "ScoreTree")
// Returns: HTML anchor tag
// The URL points to: https://app.mode.com/lyft/reports/b9322ad7c7aa?
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
  const baseUrl = isEmbeddedLink
    ? `${URLS.SCORE_TREE.replace(/\?$/, "")}/embed?max_age=${embedId || 999999999}&`
    : URLS.SCORE_TREE;

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

// Backward compatibility: keep the old ScoreDiff API but route to ScoreTree
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


// Generates a link to the RowViewer report
// table: fully qualified table name (defaults to rider sessions)
// idColumn: primary id column name (defaults to session_id)
// id: primary id value
// dateString: ds partition
// hour: optional hour partition
// hrColumn: hour column name (defaults to hr)
// linkText: link label (defaults to RowViewer)
// Returns: HTML anchor tag
function getRowViewerLink(
  table = 'core.rider_sessions',
  idColumn = 'session_id',
  id,
  dateString,
  hour,
  hrColumn = 'hr',
  linkText
) {
  let url = `${URLS.ROW_VIEWER}?param_table=${encodeURIComponent(table)}`;
  url += `&param_ds=${dateString || ''}`;
  url += `&param_id_column_name=${idColumn}`;
  url += `&param_id=${id ?? ''}`;
  if (hour !== undefined && hour !== null) {
    url += `&param_id_column_name2=${hrColumn}`;
    url += `&param_id2=${hour}`;
  }

  return buildLinkTag(url, linkText || LINK_TEXT.ROW_VIEWER);
}

// Generates a link to the Airport Queue Viewer report
// Shows information about airport queue management
// region: Region code
// dateString: Date string (YYYY-MM-DD format)
// cycleId: The matching cycle ID
// queueName: Name of the airport queue
// linkText: Text to display (defaults to signature if not provided)
// signature: Optional signature/fallback link text (defaults to "AirportQueueViewer")
// Returns: HTML anchor tag
// The URL points to: https://app.mode.com/lyft/reports/8a67e9183d07
function getAirportQueueViewerLink(
  region,
  dateString,
  cycleId,
  queueName,
  linkText,
  signature = LINK_TEXT.AIRPORT_QUEUE_VIEWER
) {
  let url = `${URLS.AIRPORT_QUEUE_VIEWER}?param_region=${region}`;
  url += `&param_ds=${dateString}`;
  url += `&param_cycle_id=${cycleId}`;
  url += `&param_queue_name=${queueName}`;

  return buildLinkTag(url, linkText || signature || LINK_TEXT.AIRPORT_QUEUE_VIEWER);
}

// Generates a link to the Rider Session Viewer report
// Shows information about a rider's session (their app usage)
// sessionId: The rider session ID
// dateString: Date string (YYYY-MM-DD format) - note: this is often offset by +100 days from event time
// linkText: Text to display (defaults to signature if not provided)
// signature: Optional signature/fallback link text (defaults to "RiderSessionViewer")
// Returns: HTML anchor tag
// The URL points to: https://app.mode.com/lyft/reports/72c161b42d37
function getRiderSessionViewerLink(
  sessionId,
  dateString,
  linkText,
  signature = LINK_TEXT.RIDER_SESSION_VIEWER
) {
  let url = `${URLS.RIDER_SESSION_VIEWER}?param_session_id=${sessionId}`;
  url += `&param_ds=${dateString}`;

  return buildLinkTag(url, linkText || signature || LINK_TEXT.RIDER_SESSION_VIEWER);
}

// Generates a link to TOM (Tool for Operations Management) scheduled ride viewer
// This links to an external tool (tom.lyft.net), not a Mode report
// scheduledRideId: The scheduled ride ID
// linkText: Text to display (defaults to "details")
// Returns: HTML anchor tag
// The URL points to: https://tom.lyft.net/scheduled-rides/{scheduledRideId}
function getScheduledRideLink(
  scheduledRideId,
  linkText = LINK_TEXT.TOM_SCHEDULED_RIDE
) {
  const url = `${URLS.TOM_SCHEDULED_RIDE}${scheduledRideId}`;
  return buildLinkTag(url, linkText || LINK_TEXT.TOM_SCHEDULED_RIDE);
}

// Generates a link to TOM replay viewer for a ride
// Shows a replay/visualization of what happened during a ride
// rideId: The ride ID
// linkText: Text to display (defaults to "Replay")
// Returns: HTML anchor tag
// The URL points to: https://tom.lyft.net/replay/ride/{rideId}
function getReplayForRideLink(
  rideId,
  linkText = LINK_TEXT.TOM_REPLAY
) {
  const url = `${URLS.TOM_REPLAY_RIDE}${rideId}`;
  return buildLinkTag(url, linkText || LINK_TEXT.TOM_REPLAY);
}

// Generates a link to TOM replay viewer for an assignment group
// Shows a replay of what happened during a matching cycle/assignment group
// assignmentGroupId: The assignment group ID
// dateString: Date string (YYYY-MM-DD format)
// linkText: Text to display (defaults to signature if not provided)
// signature: Optional signature/fallback link text (defaults to "Replay")
// Returns: HTML anchor tag
// The URL points to: https://tom.lyft.net/replay/cycle/assignmentGroup/{assignmentGroupId}?activeTab=Details
function getReplayForAssignmentGroupLink(
  assignmentGroupId,
  dateString,
  linkText,
  signature = LINK_TEXT.TOM_REPLAY
) {
  let url = `${URLS.TOM_REPLAY_CYCLE}${assignmentGroupId}`;
  url += `/assignmentGroup/${dateString}`;
  url += `?activeTab=Details`;

  return buildLinkTag(url, linkText || signature || LINK_TEXT.TOM_REPLAY);
}

// Generates a link to TOM replay viewer for a cycle id
// cycleId: The cycle ID
// linkText: Text to display (defaults to "Replay")
// Returns: HTML anchor tag
// The URL points to: https://tom.lyft.net/replay/cycle/{cycleId}
function getReplayForCycleLink(
  cycleId,
  linkText = LINK_TEXT.TOM_REPLAY
) {
  const url = `${URLS.TOM_REPLAY_CYCLE}${cycleId}`;
  return buildLinkTag(url, linkText || LINK_TEXT.TOM_REPLAY);
}

// Generates a link to TOM user viewer
// Shows information about a user (rider or driver) in TOM
// userId: The user ID
// linkText: Text to display (defaults to "TOM")
// Returns: HTML anchor tag
// The URL points to: https://tom.lyft.net/users/{userId}
function getTomUserLink(
  userId,
  linkText = LINK_TEXT.TOM_LINK
) {
  const url = `${URLS.TOM_USER}${userId}`;
  return buildLinkTag(url, linkText || LINK_TEXT.TOM_LINK);
}
