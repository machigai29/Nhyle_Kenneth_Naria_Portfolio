(() => {
  const suite = document.querySelector(".workflow-suite");
  if (!suite) return;

  const graphs = window.workflowGraphs;
  if (!graphs) {
    const status = suite.querySelector("#workflow-status");
    if (status) status.textContent = "Workflow diagrams could not load. Check workflow-data.js and reload the page.";
    const overviewError = document.querySelector("#pipeline-map-error");
    if (overviewError) overviewError.hidden = false;
    document.querySelector(".pipeline-overview")?.classList.add("pipeline-overview--error");
    suite.querySelectorAll("button, select, textarea").forEach((control) => { control.disabled = true; });
    console.error("Workflow diagram data was not loaded.");
    return;
  }

  const byId = (id) => suite.querySelector(`#${id}`);
  const graphRoot = byId("workflow-graph");
  const edgeSvg = byId("workflow-edges");
  const nodeRoot = byId("workflow-nodes");
  const graphScroller = suite.querySelector(".workflow-graph-scroll");
  const graphViewport = byId("workflow-graph-viewport");
  const graphZoomStatus = byId("workflow-map-zoom-status");
  const graphZoomFactors = [0.5, 0.75, 1, 1.5, 2.25, 3.4, 5.1, 7.7, 11.5, 17, 25, 32];
  const graphZoomIndex = { support: 2, video: 2, watchdog: 2 };
  const timeline = byId("workflow-timeline");
  const state = {
    support: createState("support"),
    video: createState("video"),
    watchdog: createState("watchdog"),
  };
  const tabButtons = [...suite.querySelectorAll("[data-workflow]")];
  const overviewTabs = [...document.querySelectorAll("[data-overview-workflow]")];
  const overview = document.querySelector(".pipeline-overview");
  const overviewContent = document.querySelector("#pipeline-map-content");
  const overviewPanel = document.querySelector("#pipeline-map-panel");
  const inspectorDialog = document.querySelector("#pipeline-inspector");
  const interaction = byId("workflow-interaction");
  const speed = byId("workflow-speed");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const overviewZoomLevels = [0.75, 1, 1.5, 2, 3, 4, 5];
  const overviewZoom = { support: 1, video: 1, watchdog: 1 };
  let active = "support";
  let activeOverview = "support";
  let timer = null;
  let lastInspectorTrigger = null;
  let overviewDataValid = true;
  let overviewRendered = false;

  const overviewData = {
    support: {
      title: "Support Auto-Responder (Human Approval)",
      sourceNodes: 13,
      annotationNodes: 1,
      approvals: 1,
      aiCalls: 2,
      aiNote: "Gemini drafting and its connected Ollama model.",
      guide: [
        "Receive a ticket and acknowledge it.",
        "Normalize ticket fields and prepare a reply draft.",
        "Classify the request and send the draft to a human reviewer.",
        "Email the reply only after approval.",
        "Log either the sent or rejected outcome.",
      ],
      nodes: [
        { id: "support-webhook", name: "Support Ticket Webhook", subtitle: "Receives a new support ticket.", type: "normal", position: [20, 44] },
        { id: "support-normalize", name: "Normalize Ticket", subtitle: "Shapes the ticket fields.", type: "normal", position: [200, 44] },
        { id: "support-classify", name: "Classify And Draft Reply", subtitle: "Gemini classifies and drafts.", type: "ai", position: [380, 44] },
        { id: "support-parse", name: "Parse AI Draft", subtitle: "Checks the draft fields.", type: "normal", position: [560, 44] },
        { id: "support-approval", name: "Ask Human To Approve", subtitle: "Requests Telegram review.", type: "approval", position: [740, 44] },
        { id: "support-decision", name: "Was Approved?", subtitle: "Routes the review decision.", type: "normal", position: [920, 44] },
        { id: "support-email", name: "Email Reply To Customer", subtitle: "Sends only approved replies.", type: "normal", position: [1100, 44] },
        { id: "support-sent", name: "Log Ticket As Sent", subtitle: "Records the sent outcome.", type: "normal", position: [1100, 214] },
        { id: "support-rejected", name: "Log Ticket As Rejected", subtitle: "Records rejected or expired.", type: "normal", position: [920, 214] },
        { id: "support-acknowledge", name: "Acknowledge Ticket", subtitle: "Returns a receipt response.", type: "normal", position: [200, 214] },
        { id: "support-tool", name: "AI Agent Tool", subtitle: "Provides an agent tool.", type: "ai", position: [380, 214] },
        { id: "support-ollama", name: "Ollama Chat Model", subtitle: "Connects the Ollama model.", type: "ai", position: [200, 370] },
      ],
      edges: [
        { from: "support-webhook", to: "support-normalize" },
        { from: "support-normalize", to: "support-acknowledge" },
        { from: "support-normalize", to: "support-classify" },
        { from: "support-classify", to: "support-parse" },
        { from: "support-parse", to: "support-approval" },
        { from: "support-approval", to: "support-decision" },
        { from: "support-decision", to: "support-email", label: "Approved" },
        { from: "support-decision", to: "support-rejected", label: "Rejected or expired" },
        { from: "support-email", to: "support-sent" },
        { from: "support-tool", to: "support-classify", type: "ai" },
        { from: "support-ollama", to: "support-tool", type: "ai" },
      ],
    },
    video: {
      title: "Video-Generator",
      sourceNodes: 134,
      annotationNodes: 11,
      approvals: 2,
      aiCalls: 2,
      aiNote: "Gemini planning calls only; image and video generation are off.",
      guide: [
        "Accept a Telegram request and check its format and authorization.",
        "Prepare text, links, images, or a voice transcript as source material.",
        "Gemini analyzes the source and drafts a scene-by-scene storyboard.",
        "Pause for human approval of the storyboard.",
        "After approval, the workflow is designed to generate a clip for each scene.",
        "Prepare voiceover and assemble the video when generation is available.",
        "Request final approval; route failures through the error path.",
      ],
      nodes: [
        {
          id: "video-intake", name: "1 · Telegram intake", subtitle: "Receive and validate the request.", type: "normal", position: [20, 54],
          members: ["Telegram Trigger", "Dedupe Update", "Normalize Telegram Input", "Config", "Authorized?", "Supported Input?", "Reply Unsupported", "Setup Needed?", "Reply Setup Needed", "Is Callback?"],
          keyNodes: [
            { name: "Telegram Trigger", type: "normal", subtitle: "Starts from a message or callback." },
            { name: "Normalize Telegram Input", type: "normal", subtitle: "Shapes the incoming request." },
            { name: "Authorized?", type: "normal", subtitle: "Checks the configured access list." },
          ],
        },
        {
          id: "video-source", name: "2 · Source prep", subtitle: "Handle voice, links, and images.", type: "normal", position: [177, 54],
          members: ["Has Voice?", "Get Voice File", "Encode Voice", "Transcribe Voice", "Merge Transcript", "Transcript OK?", "Reply Voice Failed", "Create Project", "Intake", "Set Planning", "Has Link?", "Fetch Link", "Has Image?", "Fetch Source Image", "Build Source Package", "Source Usable?", "Reply Source Needed"],
          keyNodes: [
            { name: "Transcribe Voice", type: "normal", subtitle: "Adds a voice transcript when provided." },
            { name: "Fetch Link", type: "normal", subtitle: "Reads a supplied reference link." },
            { name: "Build Source Package", type: "normal", subtitle: "Collects the usable source material." },
          ],
        },
        {
          id: "video-plan", name: "3 · AI storyboard", subtitle: "Analyze the brief and draft scenes.", type: "ai", position: [334, 54],
          members: ["Gemini Analyst", "Gemini Analyst Model", "Build Story Prompt", "Gemini Story Agent", "Google Gemini Chat Model", "Parse Scene Plan", "Image Gen Enabled?", "Prepare Storyboard Rows", "Prepare Scene Rows", "Prepare Scene Asset Rows", "Free.ai Image Generation (SDXL)", "Upload Scene Image", "Send Scene Photo", "Record Scene Assets", "Create Scenes", "Create Scene Approval", "Set Awaiting Scene Approval", "Reply Scene Approval"],
          keyNodes: [
            { name: "Gemini Analyst", type: "ai", subtitle: "Summarizes source facts and gaps." },
            { name: "Gemini Story Agent", type: "ai", subtitle: "Drafts the scene plan." },
            { name: "Parse Scene Plan", type: "normal", subtitle: "Checks the generated storyboard." },
          ],
        },
        {
          id: "video-scene-approval", name: "4 · Scene approval", subtitle: "Wait for a human review.", type: "approval", position: [491, 54],
          members: ["Reply Scene Approval", "Answer Callback", "Parse Callback", "Load Approval", "Load Approval Project", "Validate Callback", "Callback Valid?", "Reply Stale", "Decision Plan", "Update Approval", "Update Project Status", "Reply Decision", "Scenes Approved?", "Approve Scenes", "Resume Context"],
          keyNodes: [
            { name: "Reply Scene Approval", type: "approval", subtitle: "Presents the storyboard for review." },
            { name: "Scenes Approved?", type: "approval", subtitle: "Routes the scene decision." },
            { name: "Approve Scenes", type: "normal", subtitle: "Records the approval path." },
          ],
        },
        {
          id: "video-clips", name: "5 · Per-scene clips", subtitle: "Loop over scenes; generation is off.", type: "normal", position: [648, 54],
          members: ["Claim Project", "Claimed?", "Reply Not Eligible", "Reset Failed Tasks", "Load Settings", "Load Approved Scenes", "Load Scene Assets", "Build Job", "Job OK?", "Split Scenes", "Loop Over Scenes", "Build Task Row", "Create Task", "Task Is New?", "Is Mock?", "Mock Clip", "Finalize Clip", "Clip Outcome", "Mark Task Failed", "Sign Scene Image", "Prep Provider Input", "Apply Motion Prompt", "Video Agent", "Gemini Video Agent Model", "Free.ai Video Generation (CogVideoX)", "Free.ai Video Result", "Download Clip", "Upload Clip", "Prepare Asset Row", "Record Clip Asset", "Complete Task", "Collapse To One"],
          keyNodes: [
            { name: "Loop Over Scenes", type: "normal", subtitle: "Processes scene tasks one by one." },
            { name: "Mock Clip", type: "normal", subtitle: "Uses the mock path when configured." },
            { name: "Free.ai Video Generation (CogVideoX)", type: "normal", subtitle: "Video generation is switched off." },
          ],
        },
        {
          id: "video-assembly", name: "6 · Voiceover & assembly", subtitle: "Prepare the voiceover and video plan.", type: "normal", position: [805, 54],
          members: ["Load Script", "Load Clip Assets", "Build Video Plan", "Plan OK?", "Load Latest Video Version", "Needs Voiceover?", "TTS Voiceover", "Upload Voiceover", "Prepare Voiceover Row", "Record Voiceover Asset", "Prepare Video Row", "Create Video Record", "Build Event Row", "Log Event", "Return Result", "Reply Ready"],
          keyNodes: [
            { name: "TTS Voiceover", type: "normal", subtitle: "Requests a voiceover when needed." },
            { name: "Build Video Plan", type: "normal", subtitle: "Combines scene and clip details." },
            { name: "Reply Ready", type: "normal", subtitle: "Returns the prepared result." },
          ],
        },
        {
          id: "video-final-approval", name: "7 · Final approval", subtitle: "Wait for a second human decision.", type: "approval", position: [962, 54],
          members: ["Supersede Old Approvals", "Create Approval", "Update Project Awaiting Approval", "Video Approved?", "Approve Video"],
          keyNodes: [
            { name: "Create Approval", type: "approval", subtitle: "Creates the final review request." },
            { name: "Video Approved?", type: "approval", subtitle: "Routes the final decision." },
            { name: "Approve Video", type: "normal", subtitle: "Records approval; it does not publish." },
          ],
        },
        {
          id: "video-error", name: "8 · Error path", subtitle: "Report failures and mark the project.", type: "normal", position: [1119, 54],
          members: ["Build Pipeline Error", "Reply Pipeline Error", "Log Error Event", "Mark Project Failed", "Failure Info", "Fail Project", "Reply Failure"],
          keyNodes: [
            { name: "Build Pipeline Error", type: "normal", subtitle: "Builds a safe failure summary." },
            { name: "Fail Project", type: "normal", subtitle: "Marks the failed project state." },
            { name: "Reply Pipeline Error", type: "normal", subtitle: "Returns an error message." },
          ],
        },
      ],
      edges: [
        { from: "video-intake", to: "video-source" },
        { from: "video-source", to: "video-plan" },
        { from: "video-plan", to: "video-scene-approval" },
        { from: "video-scene-approval", to: "video-clips" },
        { from: "video-clips", to: "video-assembly" },
        { from: "video-assembly", to: "video-final-approval" },
        { from: "video-plan", to: "video-error", error: true },
        { from: "video-clips", to: "video-error", error: true },
      ],
    },
    watchdog: {
      title: "Workflow Watchdog (AI Error Alerts)",
      sourceNodes: 6,
      annotationNodes: 1,
      approvals: 0,
      aiCalls: 1,
      aiNote: "One Gemini explanation call.",
      guide: [
        "Receive a workflow error event.",
        "Normalize the workflow, failed node, and error details.",
        "Ask Gemini to explain the failure and a likely cause.",
        "Build an alert message from the explanation.",
        "Send the alert through Telegram.",
      ],
      nodes: [
        { id: "watchdog-trigger", name: "Workflow Failed", subtitle: "Receives an error event.", type: "normal", position: [20, 54] },
        { id: "watchdog-normalize", name: "Normalize Error", subtitle: "Shapes the failure details.", type: "normal", position: [210, 54] },
        { id: "watchdog-explain", name: "Explain Error With AI", subtitle: "Gemini explains the failure.", type: "ai", position: [400, 54] },
        { id: "watchdog-build", name: "Build Alert Message", subtitle: "Formats a concise alert.", type: "normal", position: [590, 54] },
        { id: "watchdog-send", name: "Send Telegram Alert", subtitle: "Sends the alert to Telegram.", type: "normal", position: [780, 54] },
      ],
      edges: [
        { from: "watchdog-trigger", to: "watchdog-normalize" },
        { from: "watchdog-normalize", to: "watchdog-explain" },
        { from: "watchdog-explain", to: "watchdog-build" },
        { from: "watchdog-build", to: "watchdog-send" },
      ],
    },
  };

  function verifyPath(key, names) {
    const missing = names.filter((name) => !graphs[key].nodes.some((node) => node.name === name));
    const disconnected = names.slice(1).flatMap((name, index) => {
      const previous = names[index];
      if (graphs[key].edges.some((edge) => edge.from === previous && edge.to === name)) return [];
      return [`${previous} -> ${name}`];
    });
    if (missing.length || disconnected.length) {
      throw new Error(`The ${key} sample path does not match its graph. Missing: ${missing.join(", ") || "none"}. Disconnected: ${disconnected.join(", ") || "none"}.`);
    }
  }

  try {
    verifyPath("support", ["Support Ticket Webhook", "Normalize Ticket", "Classify And Draft Reply", "Parse AI Draft", "Ask Human To Approve", "Was Approved?", "Email Reply To Customer", "Log Ticket As Sent"]);
    verifyPath("support", ["Was Approved?", "Log Ticket As Rejected"]);
    verifyPath("watchdog", ["Workflow Failed", "Normalize Error", "Explain Error With AI", "Build Alert Message", "Send Telegram Alert"]);
    verifyPath("video", ["Telegram Trigger", "Dedupe Update", "Normalize Telegram Input", "Config", "Authorized?", "Supported Input?", "Is Callback?", "Answer Callback", "Parse Callback", "Load Approval", "Load Approval Project", "Validate Callback", "Callback Valid?", "Decision Plan", "Update Approval", "Update Project Status", "Reply Decision", "Scenes Approved?"]);
    verifyPath("video", ["Scenes Approved?", "Approve Scenes", ...videoJobPath().slice(1)]);
    ["Text description", "Product image placeholder", "Reference link", "Voice-note transcript"].forEach((inputType) => {
      const sample = createState("video");
      sample.inputType = inputType;
      verifyPath("video", makePath("video", sample));
    });
  } catch (error) {
    console.error("Workflow sample paths do not match the supplied graphs.", error);
    const status = byId("workflow-status");
    status.textContent = "The workflow sample could not start because its path does not match the supplied graph.";
    const overviewError = document.querySelector("#pipeline-map-error");
    if (overviewError) overviewError.hidden = false;
    overview?.classList.add("pipeline-overview--error");
    suite.querySelectorAll("button, select, textarea").forEach((control) => { control.disabled = true; });
    return;
  }
  try {
    verifyOverviewData();
  } catch (error) {
    overviewDataValid = false;
    const overviewError = document.querySelector("#pipeline-map-error");
    if (overviewError) overviewError.hidden = false;
    console.error("Workflow overview data does not match the supplied exports.", error);
  }

  function createState(key) {
    const current = {
      status: "idle",
      path: [],
      cursor: -1,
      visited: new Set(),
      skipped: new Set(),
      branches: new Map(),
      selected: "",
      decision: "",
      scenario: "missing",
      inputType: "Text description",
      description: "A small neighborhood bakery wants a warm 30-second video introducing its fresh morning bread.",
      revision: "",
    };
    current.path = makePath(key, current);
    current.selected = current.path[0];
    return current;
  }

  function graph(key = active) {
    return graphs[key];
  }

  function findNode(name, key = active) {
    return graph(key).nodes.find((item) => item.name === name);
  }

  function step(name, input, output, result, options = {}) {
    return { name, input, output, result, ...options };
  }

  function videoIntakePath(current) {
    const path = [
      "Telegram Trigger",
      "Dedupe Update",
      "Normalize Telegram Input",
      "Config",
      "Authorized?",
      "Supported Input?",
      "Is Callback?",
      "Has Voice?",
    ];
    if (current.inputType === "Voice-note transcript") {
      path.push("Get Voice File", "Encode Voice", "Transcribe Voice", "Merge Transcript", "Transcript OK?");
    }
    path.push(
      "Create Project",
      "Intake",
      "Set Planning",
      "Has Link?",
    );
    if (current.inputType === "Reference link") path.push("Fetch Link");
    path.push("Has Image?");
    if (current.inputType === "Product image placeholder") path.push("Fetch Source Image");
    path.push(
      "Build Source Package",
      "Source Usable?",
      "Gemini Analyst",
      "Build Story Prompt",
      "Gemini Story Agent",
      "Parse Scene Plan",
      "Image Gen Enabled?",
      "Prepare Storyboard Rows",
      "Create Scenes",
      "Create Scene Approval",
      "Set Awaiting Scene Approval",
      "Reply Scene Approval",
    );
    return path;
  }

  function videoJobPath() {
    return [
      "Approve Scenes",
      "Resume Context",
      "Claim Project",
      "Claimed?",
      "Reset Failed Tasks",
      "Load Settings",
      "Load Approved Scenes",
      "Load Scene Assets",
      "Build Job",
      "Job OK?",
      "Split Scenes",
      "Loop Over Scenes",
      "Build Task Row",
      "Create Task",
      "Task Is New?",
      "Is Mock?",
      "Mock Clip",
      "Finalize Clip",
      "Clip Outcome",
      "Prepare Asset Row",
      "Record Clip Asset",
      "Complete Task",
      "Loop Over Scenes",
      "Collapse To One",
      "Load Script",
      "Load Clip Assets",
      "Build Video Plan",
      "Plan OK?",
      "Load Latest Video Version",
      "Needs Voiceover?",
      "Prepare Video Row",
      "Create Video Record",
      "Supersede Old Approvals",
      "Create Approval",
      "Update Project Awaiting Approval",
      "Build Event Row",
      "Log Event",
      "Return Result",
      "Reply Ready",
    ];
  }

  function makePath(key, current) {
    if (key === "support") {
      return [
        "Support Ticket Webhook",
        "Normalize Ticket",
        "Classify And Draft Reply",
        "Parse AI Draft",
        "Ask Human To Approve",
      ];
    }
    if (key === "video") return videoIntakePath(current);
    return [
      "Workflow Failed",
      "Normalize Error",
      "Explain Error With AI",
      "Build Alert Message",
      "Send Telegram Alert",
    ];
  }

  function scenario() {
    const options = {
      missing: {
        workflow: "Neighborhood Support Intake",
        node: "Normalize Ticket",
        error: "A required ticket message was missing.",
        explanation: "The sample payload is missing text required by a downstream step.",
        cause: "An upstream form may have submitted an empty message.",
        suggestion: "Check the incoming fields and add a non-empty-message validation.",
      },
      timeout: {
        workflow: "Daily Metrics Sample",
        node: "Fetch Report",
        error: "The example request exceeded its configured time limit.",
        explanation: "A sample external request did not return within its allowed time.",
        cause: "The remote service may be slow, unavailable, or waiting on a network response.",
        suggestion: "Check service availability, request duration, and retry policy.",
      },
      auth: {
        workflow: "Video Planning Sample",
        node: "Load Approval",
        error: "The sample service rejected the supplied credentials.",
        explanation: "A sample service did not accept the workflow's authentication.",
        cause: "Credentials may be expired, incomplete, or missing required access.",
        suggestion: "Verify the credential reference and permissions. Never paste secrets into this demo.",
      },
      database: {
        workflow: "Form Archive Sample",
        node: "Create Project",
        error: "The example record did not match the expected table shape.",
        explanation: "A sample database step rejected an unexpected record structure.",
        cause: "A field name, data type, or required value may differ from the destination schema.",
        suggestion: "Compare the normalized sample with the schema and validate required fields.",
      },
    };
    return options[state.watchdog.scenario];
  }

  function infoFor(name, current) {
    const sample = scenario();
    const details = {
      "Support Ticket Webhook": ["A fictional support ticket enters the workflow.", "One sample ticket event.", "Received in memory; no webhook was contacted."],
      "Normalize Ticket": ["The example subject and message.", "A normalized sample ticket.", "Fields normalized in this browser."],
      "Acknowledge Ticket": ["The sample ticket event.", "An acknowledgement response.", "Represented locally; no webhook response was sent."],
      "AI Agent Tool": ["The workflow's configured agent-tool connection.", "An AI tool connected to the draft step.", "Shown for source fidelity; no agent or external tool was called."],
      "Ollama Chat Model": ["The workflow's configured model connection.", "A model connected to the draft step.", "Shown for source fidelity; no model was called."],
      "Classify And Draft Reply": ["A fictional account-access question.", "A fixed example classification and cautious reply.", "Prewritten sample shown; no AI service was contacted."],
      "Parse AI Draft": ["The fixed sample draft.", "Example category and reply fields.", "Parsed as display-only sample data."],
      "Ask Human To Approve": ["The sample reply and category.", "Approve or reject controls.", "Waiting for your choice; no Telegram message was sent.", { wait: true }],
      "Was Approved?": ["Your choice in this demo.", "Exactly one approval or rejection branch.", "The selected local branch is highlighted."],
      "Email Reply To Customer": ["The approved sample reply.", "A simulated email-delivery result.", "No email was sent."],
      "Log Ticket As Sent": ["The sample ticket and simulated delivery result.", "A display-only sent record.", "No database was modified."],
      "Log Ticket As Rejected": ["The rejected sample ticket.", "A display-only rejection record.", "No database was modified."],
      "Workflow Failed": [`${sample.workflow} · ${sample.node} · ${sample.error}`, "A fictional failure event.", "Created locally; no live workflow was monitored."],
      "Normalize Error": ["The fictional failure event.", "Normalized workflow, node, and error fields.", "Sample details normalized in memory."],
      "Explain Error With AI": ["The sample error details.", "A fixed example explanation and possible cause.", "Prewritten explanation shown; no AI service was contacted."],
      "Build Alert Message": ["The sample explanation and recovery suggestion.", "A sample alert message.", "Message formatted locally; no Telegram message was sent."],
      "Send Telegram Alert": ["The sample alert message.", "A simulated delivery status.", "No alert was delivered."],
      "Telegram Trigger": ["A fictional message or callback.", "A sample input event.", "Created in the browser; no Telegram event was received."],
      "Dedupe Update": ["The fictional event.", "A unique sample update.", "Dedupe represented locally; no persistent store was queried."],
      "Normalize Telegram Input": ["The sample message and selected input type.", "A normalized request.", "Prepared locally; no message was received."],
      "Config": ["The workflow export's safe boolean flags.", "Image generation disabled; video generation disabled.", "Copied from the supplied export. Other configuration values are not exposed."],
      "Authorized?": ["A fictional requester.", "A sample authorization decision.", "Demonstration only; no user ID or access list was checked."],
      "Supported Input?": ["The selected sample input type.", "A supported sample input.", "The demo follows the supported branch."],
      "Is Callback?": ["A new sample request.", "The message-input branch.", "Callback parsing is demonstrated after human approval."],
      "Has Voice?": [`Input type: ${current.inputType}.`, "Voice transcription only for the voice-note sample.", "No audio was fetched or transcribed."],
      "Get Voice File": ["A fictional voice-note reference.", "A placeholder audio file.", "No file was downloaded."],
      "Encode Voice": ["The voice-note placeholder.", "A sample encoded-file field.", "No audio was processed."],
      "Transcribe Voice": ["A sample transcript placeholder.", "The provided description as illustrative transcript text.", "No transcription service was called."],
      "Merge Transcript": ["Sample transcript fields.", "A normalized transcript.", "Merged in the browser."],
      "Transcript OK?": ["The sample transcript text.", "A transcript-present branch.", "The valid sample branch is represented."],
      "Create Project": ["A fictional approved request.", "A sample project record.", "No database record was created."],
      "Intake": [current.description, "The example project brief.", "Stored only in browser state."],
      "Set Planning": ["The sample project.", "Planning status.", "Displayed as an example; no record was updated."],
      "Has Link?": [`Input type: ${current.inputType}.`, "Fetch a link only for the reference-link sample.", "No URL was requested."],
      "Fetch Link": ["A placeholder reference link.", "Example link metadata.", "No web request was made."],
      "Has Image?": [`Input type: ${current.inputType}.`, "Fetch an image only for the image-placeholder sample.", "No image was requested."],
      "Fetch Source Image": ["A product-image placeholder.", "An illustrative image reference.", "No image was downloaded or uploaded."],
      "Build Source Package": ["The selected illustrative input.", "A sample source package.", "Assembled locally."],
      "Source Usable?": ["The sample source package.", "A usable-source branch.", "The example continues; no external asset was validated."],
      "Gemini Analyst": [current.description, "A prewritten audience and tone example.", "No Gemini request was made."],
      "Build Story Prompt": ["The sample analysis.", "A display-only storyboard prompt.", "Prepared locally."],
      "Gemini Story Agent": ["The sample brief and fixed planning example.", "Three illustrative storyboard scenes.", "No AI model was called; scenes are a fixed sample."],
      "Parse Scene Plan": ["The fixed storyboard sample.", "Three ordered scene examples.", "Parsed for display only."],
      "Image Gen Enabled?": ["The source export's image_generation_enabled flag is false.", "The no-image-generation branch.", "No image generation was attempted."],
      "Prepare Storyboard Rows": ["The illustrative storyboard scenes.", "Sample scene rows.", "Prepared in browser memory."],
      "Create Scenes": ["Sample scene rows.", "An illustrative scene list.", "No database writes occurred."],
      "Create Scene Approval": ["The sample scene list.", "A human-review checkpoint.", "Approval is simulated below."],
      "Set Awaiting Scene Approval": ["The sample project.", "Awaiting-review status.", "No project record was updated."],
      "Reply Scene Approval": ["The sample storyboard.", "Approval or revision controls.", "Waiting for your choice; nothing was sent.", { wait: true }],
      "Approve Scenes": ["Your sample approval.", "Approved scene status.", "Represented locally; no approval was persisted."],
      "Resume Context": ["The sample project context.", "A resumed sample process.", "No stored project was loaded."],
      "Claim Project": ["The sample project.", "A display-only claim result.", "No concurrent job was claimed."],
      "Claimed?": ["The sample claim result.", "The example continues.", "No database condition was evaluated."],
      "Reset Failed Tasks": ["The sample job.", "A clean mock-task state.", "No tasks were changed."],
      "Load Settings": ["Safe generation flags from the export.", "Both image and video generation are disabled.", "Live generation is unavailable."],
      "Load Approved Scenes": ["The fixed sample storyboard.", "Three illustrative scenes.", "No project database was read."],
      "Load Scene Assets": ["Image-generation flag is false.", "No generated scene assets.", "No asset store was read."],
      "Build Job": ["The sample scene list.", "A display-only mock job.", "No render job was created."],
      "Job OK?": ["The fixed mock-job example.", "The illustrative branch continues.", "No job was submitted."],
      "Split Scenes": ["Three fixed example scenes.", "Three illustrative task items.", "Split in memory."],
      "Loop Over Scenes": ["One illustrative scene at a time.", "A bounded mock scene iteration.", "No render loop was run."],
      "Build Task Row": ["An illustrative scene.", "A mock task example.", "Built locally."],
      "Create Task": ["A mock task example.", "A sample task record.", "No database write occurred."],
      "Task Is New?": ["A fixed sample task.", "The mock-task branch.", "No existing task was queried."],
      "Is Mock?": ["The export has video generation disabled.", "The mock clip branch.", "No video provider was contacted."],
      "Mock Clip": ["The illustrative scene.", "A labeled mock clip status.", "No clip was generated."],
      "Finalize Clip": ["A mock clip status.", "A display-only clip outcome.", "No media was created."],
      "Clip Outcome": ["The mock clip result.", "A sample task outcome.", "No output file exists."],
      "Prepare Asset Row": ["The mock clip status.", "A display-only asset row.", "Not persisted."],
      "Record Clip Asset": ["The display-only asset row.", "An example asset status.", "No asset store was modified."],
      "Complete Task": ["The sample task.", "A simulated completion state.", "No task was updated."],
      "Collapse To One": ["The fixed sample scene list.", "A single planning summary.", "No media was combined."],
      "Load Script": ["The sample storyboard.", "A planning script placeholder.", "No stored script was loaded."],
      "Load Clip Assets": ["No real clips were generated.", "No video assets.", "No asset store was read."],
      "Build Video Plan": ["The illustrative scene list.", "A planning-only video outline.", "No video was rendered."],
      "Plan OK?": ["The illustrative outline.", "The planning branch continues.", "No render plan was submitted."],
      "Load Latest Video Version": ["The sample project.", "No prior video version.", "No database query occurred."],
      "Needs Voiceover?": ["The sample planning outline.", "No voiceover asset is generated.", "No speech synthesis was called."],
      "Prepare Video Row": ["The planning-only outline.", "A display-only project summary.", "No video row was written."],
      "Create Video Record": ["The sample summary.", "A fictional record.", "No database write occurred."],
      "Supersede Old Approvals": ["No stored video approvals.", "No prior approval changed.", "No database operation occurred."],
      "Create Approval": ["The sample planning record.", "A human-review checkpoint.", "No approval record was created."],
      "Update Project Awaiting Approval": ["The sample project.", "Awaiting-review state.", "No project was updated."],
      "Build Event Row": ["The sample planning result.", "An example event entry.", "Prepared in memory."],
      "Log Event": ["The example event entry.", "A display-only log status.", "No log was written."],
      "Return Result": ["The sample planning result.", "A summary for display.", "Returned locally."],
      "Reply Ready": ["The planning-only sample.", "A ready-for-review status.", "No Telegram message was sent."],
      "Answer Callback": ["A human review action.", "A sample callback acknowledgement.", "No Telegram callback was answered."],
      "Parse Callback": ["A fictional approval button action.", "An illustrative approval decision.", "Parsed locally."],
      "Load Approval": ["A fictional sample approval.", "An example approval record.", "No approval store was queried."],
      "Load Approval Project": ["The sample project context.", "Illustrative project details.", "No database query occurred."],
      "Validate Callback": ["The sample callback and approval.", "A valid-example branch.", "No token or callback ID was checked."],
      "Callback Valid?": ["The fixed callback example.", "The valid sample branch.", "The demo continues."],
      "Decision Plan": ["Your sample approval.", "An illustrative decision update.", "No persistent change was made."],
      "Update Approval": ["The local decision.", "A display-only approval status.", "No database write occurred."],
      "Update Project Status": ["The local decision.", "A display-only project status.", "No project was updated."],
      "Reply Decision": ["The sample decision.", "A review response example.", "No Telegram reply was sent."],
      "Scenes Approved?": ["Your review choice.", "Approved-sample branch.", "Only the selected demonstration path is shown."],
    };
    const custom = details[name];
    if (custom) {
      const [input, output, result, options] = custom;
      return step(name, input, output, result, options || {});
    }
    return step(
      name,
      "Source node shown from the supplied workflow export.",
      "No custom simulation output is defined for this node.",
      "Inspect-only node; this prototype does not execute exported workflow code.",
    );
  }

  function updatePathForDecision(current) {
    if (active === "support") {
      current.path.push("Was Approved?");
      if (current.decision === "approved") {
        current.path.push("Email Reply To Customer", "Log Ticket As Sent");
      } else {
        current.path.push("Log Ticket As Rejected");
      }
    } else if (active === "video" && current.decision === "approved") {
      current.path.push(
        "Telegram Trigger",
        "Dedupe Update",
        "Normalize Telegram Input",
        "Config",
        "Authorized?",
        "Supported Input?",
        "Is Callback?",
        "Answer Callback",
        "Parse Callback",
        "Load Approval",
        "Load Approval Project",
        "Validate Callback",
        "Callback Valid?",
        "Decision Plan",
        "Update Approval",
        "Update Project Status",
        "Reply Decision",
        "Scenes Approved?",
        ...videoJobPath(),
      );
    }
  }

  function currentState() {
    return state[active];
  }

  function clearTimer() {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
  }

  function appendText(parent, tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    parent.append(element);
    return element;
  }

  function appendSvgText(parent, x, y, className, value, maxCharacters) {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", String(x));
    text.setAttribute("y", String(y));
    text.setAttribute("class", className);
    const words = value.split(/\s+/);
    const lines = [];
    let line = "";
    words.forEach((word) => {
      const candidate = line ? `${line} ${word}` : word;
      if (line && candidate.length > maxCharacters) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    });
    if (line) lines.push(line);
    lines.forEach((content, index) => {
      const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
      tspan.setAttribute("x", String(x));
      tspan.setAttribute("dy", index === 0 ? "0" : "14");
      tspan.textContent = content;
      text.append(tspan);
    });
    parent.append(text);
    return text;
  }

  function mapNodeKind(type) {
    return type === "approval" ? "HUMAN APPROVAL" : type === "ai" ? "AI STEP" : "STEP";
  }

  function drawOverviewSvg(data, current) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const video = activeOverview === "video";
    const width = video ? 1280 : data.nodes.some((node) => node.id.startsWith("support-")) ? 1280 : 968;
    const height = video ? 220 : activeOverview === "support" ? 500 : 190;
    const nodeWidth = video ? 146 : 160;
    const nodeHeight = 112;
    const nodeById = new Map(data.nodes.map((node) => [node.id, node]));
    const titleId = `pipeline-map-title-${activeOverview}`;
    const descriptionId = `pipeline-map-description-${activeOverview}`;
    svg.setAttribute("class", "pipeline-map");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.setAttribute("role", "group");
    svg.setAttribute("aria-labelledby", `${titleId} ${descriptionId}`);
    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.id = titleId;
    title.textContent = `${data.title} pipeline diagram`;
    const description = document.createElementNS("http://www.w3.org/2000/svg", "desc");
    description.id = descriptionId;
    description.textContent = `${data.sourceNodes} source nodes, ${data.approvals} human approval gates. Select a step to inspect it.`;
    svg.append(title, description);

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", `pipeline-arrow-${activeOverview}`);
    marker.setAttribute("viewBox", "0 0 8 8");
    marker.setAttribute("refX", "7");
    marker.setAttribute("refY", "4");
    marker.setAttribute("markerWidth", "7");
    marker.setAttribute("markerHeight", "7");
    marker.setAttribute("orient", "auto");
    const arrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
    arrow.setAttribute("d", "M 0 0 L 8 4 L 0 8 z");
    arrow.setAttribute("fill", "#BEB5A8");
    marker.append(arrow);
    defs.append(marker);
    svg.append(defs);

    data.edges.forEach((edge, index) => {
      const from = nodeById.get(edge.from);
      const to = nodeById.get(edge.to);
      if (!from || !to) return;
      const sourceCenterX = from.position[0] + nodeWidth / 2;
      const targetCenterX = to.position[0] + nodeWidth / 2;
      const sourceCenterY = from.position[1] + nodeHeight / 2;
      const targetCenterY = to.position[1] + nodeHeight / 2;
      const deltaX = targetCenterX - sourceCenterX;
      const deltaY = targetCenterY - sourceCenterY;
      const borderScale = Math.min(
        nodeWidth / 2 / Math.max(Math.abs(deltaX), 1),
        nodeHeight / 2 / Math.max(Math.abs(deltaY), 1),
      );
      const sourceX = sourceCenterX + deltaX * borderScale;
      const sourceY = sourceCenterY + deltaY * borderScale;
      const targetX = targetCenterX - deltaX * borderScale;
      const targetY = targetCenterY - deltaY * borderScale;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      let pathData;
      if (edge.error) {
        const routeY = 174 + index * 10;
        const sourceBottom = from.position[1] + nodeHeight;
        const targetBottom = to.position[1] + nodeHeight;
        pathData = `M ${sourceCenterX} ${sourceBottom} C ${sourceCenterX} ${routeY}, ${targetCenterX} ${routeY}, ${targetCenterX} ${targetBottom}`;
      } else {
        const controlX = (sourceX + targetX) / 2;
        pathData = `M ${sourceX} ${sourceY} C ${controlX} ${sourceY}, ${controlX} ${targetY}, ${targetX} ${targetY}`;
      }
      path.setAttribute("d", pathData);
      path.setAttribute("class", `pipeline-map-edge${edge.error ? " is-error" : ""}`);
      path.setAttribute("marker-end", `url(#pipeline-arrow-${activeOverview})`);
      path.dataset.edgeIndex = String(index);
      svg.append(path);
      if (edge.label) {
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", String((sourceCenterX + targetCenterX) / 2));
        label.setAttribute("y", String((sourceCenterY + targetCenterY) / 2 - 6));
        label.setAttribute("class", "pipeline-map-node__subtitle");
        label.setAttribute("text-anchor", "middle");
        label.textContent = edge.label;
        svg.append(label);
      }
    });

    data.nodes.forEach((node) => {
      const isStage = video;
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      const selected = !isStage && current.selected === node.name;
      group.setAttribute("class", `pipeline-map-node pipeline-map-node--${node.type}${selected ? " is-current" : ""}`);
      group.setAttribute("transform", `translate(${node.position[0]} ${node.position[1]})`);
      group.setAttribute("tabindex", "0");
      group.setAttribute("role", "button");
      group.setAttribute("aria-label", `${node.name}. ${node.subtitle} ${mapNodeKind(node.type)}.`);
      if (isStage) {
        const expanded = Boolean(overviewContent.querySelector(`[data-stage-details="${node.id}"]`)?.open);
        group.dataset.stageToggle = node.id;
        group.setAttribute("aria-expanded", String(expanded));
      } else {
        group.dataset.overviewNode = node.name;
        group.setAttribute("aria-pressed", String(selected));
      }
      const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      title.textContent = `${node.name}: ${node.subtitle}`;
      group.append(title);
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("width", String(nodeWidth));
      rect.setAttribute("height", String(nodeHeight));
      rect.setAttribute("rx", "3");
      group.append(rect);
      appendSvgText(group, 11, 22, "pipeline-map-node__label", node.name, video ? 18 : 20);
      appendSvgText(group, 11, 62, "pipeline-map-node__subtitle", node.subtitle, video ? 20 : 24);
      const kind = document.createElementNS("http://www.w3.org/2000/svg", "text");
      kind.setAttribute("x", "11");
      kind.setAttribute("y", "101");
      kind.setAttribute("class", "pipeline-map-node__kind");
      kind.textContent = mapNodeKind(node.type);
      group.append(kind);
      svg.append(group);
    });
    return svg;
  }

  function overviewItems(data) {
    const items = [];
    if (activeOverview === "video") {
      data.nodes.forEach((stage) => {
        stage.keyNodes.forEach((node) => items.push({ ...node, stageId: stage.id }));
      });
      return items;
    }
    return data.nodes.map((node) => ({ ...node, stageId: "" }));
  }

  function openOverviewInspector(name, key, trigger) {
    const current = state[key];
    const node = graph(key).nodes.find((item) => item.name === name);
    const overviewNode = overviewItems(overviewData[key]).find((item) => item.name === name);
    if (!node || !overviewNode) return;
    lastInspectorTrigger = trigger;
    current.selected = name;
    render();
    const details = infoFor(name, current);
    const incoming = graph(key).edges.filter((edge) => edge.to === name);
    const outgoing = graph(key).edges.filter((edge) => edge.from === name);
    const neighbors = [
      `Inputs: ${incoming.length ? incoming.map((edge) => `${edge.from} (${edge.label})`).join("; ") : "none"}`,
      `Outputs: ${outgoing.length ? outgoing.map((edge) => `${edge.to} (${edge.label})`).join("; ") : "none"}`,
    ].join(" | ");
    document.querySelector("#pipeline-inspector-heading").textContent = name;
    document.querySelector("#pipeline-inspector-type").textContent = `${mapNodeKind(overviewNode.type)} · ${node.type}`;
    document.querySelector("#pipeline-inspector-description").textContent = overviewNode.subtitle;
    document.querySelector("#pipeline-inspector-input").textContent = details.input;
    document.querySelector("#pipeline-inspector-output").textContent = details.output;
    document.querySelector("#pipeline-inspector-neighbors").textContent = neighbors;
    if (!inspectorDialog.open) inspectorDialog.showModal();
  }

  function syncOverviewSelection() {
    if (!overviewContent) return;
    const data = overviewData[activeOverview];
    const selectedName = state[activeOverview].selected;
    overviewTabs.forEach((button) => {
      const selected = button.dataset.overviewWorkflow === activeOverview;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    overviewPanel.setAttribute("aria-labelledby", `pipeline-tab-${activeOverview}`);
    overviewContent.querySelectorAll("[data-overview-node]").forEach((element) => {
      const selected = element.dataset.overviewNode === selectedName;
      element.classList.toggle("is-current", selected);
      element.setAttribute("aria-pressed", String(selected));
    });
    if (activeOverview === "video") {
      data.nodes.forEach((stage) => {
        const selected = stage.members.includes(selectedName);
        const stageNode = overviewContent.querySelector(`[data-stage-toggle="${stage.id}"]`);
        if (stageNode) stageNode.classList.toggle("is-current", selected);
      });
      overviewContent.querySelectorAll("[data-overview-key-node]").forEach((button) => {
        const selected = button.dataset.overviewKeyNode === selectedName;
        button.classList.toggle("is-current", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
    }
  }

  function syncOverviewZoom() {
    const zoom = overviewZoom[activeOverview];
    const zoomIndex = overviewZoomLevels.indexOf(zoom);
    const map = overviewContent.querySelector(".pipeline-map");
    if (map) map.style.width = `${zoom * 100}%`;
    const zoomOut = overviewContent.querySelector('[data-map-zoom="out"]');
    const zoomIn = overviewContent.querySelector('[data-map-zoom="in"]');
    const fit = overviewContent.querySelector('[data-map-zoom="fit"]');
    if (zoomOut) zoomOut.disabled = zoomIndex === 0;
    if (zoomIn) zoomIn.disabled = zoomIndex === overviewZoomLevels.length - 1;
    if (fit) fit.disabled = zoom === 1;
    const status = overviewContent.querySelector(".pipeline-map-zoom-status");
    if (status) status.textContent = zoom === 1 ? "WHOLE FLOW" : `${Math.round(zoom * 100)}%`;
  }

  function renderOverview() {
    try {
      if (!overviewDataValid) throw new Error("The map data did not pass its source validation.");
      const data = overviewData[activeOverview];
      const current = state[activeOverview];
      overviewContent.replaceChildren();
      const toolbar = appendText(overviewContent, "div", "pipeline-map-toolbar", "");
      [
        ["out", "Zoom out"],
        ["in", "Zoom in"],
        ["fit", "Whole flow"],
      ].forEach(([action, label]) => {
        const button = appendText(toolbar, "button", "pipeline-map-zoom-control", label);
        button.type = "button";
        button.dataset.mapZoom = action;
      });
      const zoomStatus = appendText(toolbar, "span", "pipeline-map-zoom-status", "");
      zoomStatus.setAttribute("aria-live", "polite");
      const mapScroll = appendText(overviewContent, "div", "pipeline-map-scroll", "");
      mapScroll.setAttribute("role", "region");
      mapScroll.setAttribute("tabindex", "0");
      mapScroll.setAttribute("aria-label", `${data.title} map. Scroll horizontally to follow the workflow.`);
      const map = drawOverviewSvg(data, current);
      map.style.width = `${overviewZoom[activeOverview] * 100}%`;
      map.style.height = "auto";
      mapScroll.append(map);
      appendText(overviewContent, "p", "pipeline-map-hint", "Whole flow shown first. Zoom in to read nodes; scroll the map to move around.");

      const legend = appendText(overviewContent, "ul", "pipeline-map-legend", "");
      [
        ["normal", "Normal step"],
        ["ai", "AI step"],
        ["approval", "Human approval gate"],
      ].forEach(([type, label]) => {
        const item = appendText(legend, "li", "", "");
        appendText(item, "span", `pipeline-map-key${type !== "normal" ? ` pipeline-map-key--${type}` : ""}`, "");
        appendText(item, "span", "", label);
      });

      if (activeOverview === "video") {
        const stages = appendText(overviewContent, "div", "pipeline-video-stages", "");
        data.nodes.forEach((stage) => {
          const disclosure = appendText(stages, "details", `pipeline-video-stage${stage.type === "approval" ? " pipeline-video-stage--approval" : ""}`, "");
          disclosure.dataset.stageDetails = stage.id;
          const summary = appendText(disclosure, "summary", "", `${stage.name}: ${stage.subtitle}`);
          const list = appendText(disclosure, "div", "pipeline-video-stage__nodes", "");
          stage.keyNodes.forEach((node) => {
            const button = appendText(list, "button", `pipeline-node-button pipeline-node-button--${node.type}`, node.name);
            button.type = "button";
            button.dataset.overviewKeyNode = node.name;
            button.dataset.stageId = stage.id;
            button.setAttribute("aria-pressed", String(current.selected === node.name));
            button.setAttribute("aria-label", `${node.name}. ${node.subtitle} ${mapNodeKind(node.type)}.`);
          });
          disclosure.addEventListener("toggle", () => {
            const svgNode = overviewContent.querySelector(`[data-stage-toggle="${stage.id}"]`);
            if (svgNode) svgNode.setAttribute("aria-expanded", String(disclosure.open));
          });
        });
      }

      const actions = appendText(overviewContent, "div", "pipeline-overview-actions", "");
      const run = appendText(actions, "button", "pipeline-run", "Run this flow");
      run.type = "button";
      run.dataset.runOverview = activeOverview;
      const guideHeading = appendText(overviewContent, "h5", "workflow-kicker", `FLOW GUIDE · ${data.guide.length} STEPS`);
      guideHeading.id = `pipeline-guide-${activeOverview}`;
      const guide = appendText(overviewContent, "ol", "pipeline-guide", "");
      guide.setAttribute("aria-labelledby", guideHeading.id);
      data.guide.forEach((line) => appendText(guide, "li", "", line));
      const stats = appendText(overviewContent, "div", "pipeline-stats", "");
      [
        ["Source nodes", data.sourceNodes],
        ["Approval gates", data.approvals],
        ["AI calls", data.aiCalls],
      ].forEach(([label, value]) => {
        const stat = appendText(stats, "div", "pipeline-stat", "");
        appendText(stat, "strong", "", String(value));
        appendText(stat, "span", "", label);
      });
      appendText(overviewContent, "p", "pipeline-map-note", `Source total includes ${data.annotationNodes} n8n sticky-note annotation${data.annotationNodes === 1 ? "" : "s"}; the diagram shows executable steps. ${data.aiNote}`);
      syncOverviewZoom();
      const fallback = document.querySelector(".pipeline-fallback");
      if (fallback) fallback.hidden = true;
      overview.classList.add("pipeline-overview--ready");
      overview.classList.remove("pipeline-overview--error");
      overviewRendered = true;
      const error = document.querySelector("#pipeline-map-error");
      if (error) error.hidden = true;
      syncOverviewSelection();
    } catch (error) {
      overviewContent.replaceChildren();
      overview.classList.remove("pipeline-overview--ready");
      overview.classList.add("pipeline-overview--error");
      const fallback = document.querySelector(".pipeline-fallback");
      if (fallback) fallback.hidden = false;
      const alert = document.querySelector("#pipeline-map-error");
      if (alert) alert.hidden = false;
      console.error("The workflow overview could not be rendered.", error);
    }
  }

  function activateWorkflow(key) {
    if (active !== key) {
      if (currentState().status === "running") currentState().status = "paused";
      clearTimer();
      active = key;
    }
    render();
  }

  function runOverviewWorkflow(key) {
    activeOverview = key;
    activateWorkflow(key);
    const current = state[key];
    current.selected = current.path[Math.max(0, current.cursor)] || current.path[0];
    render();
    const target = suite.querySelector(".workflow-panel");
    target.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
    const node = [...nodeRoot.children].find((item) => item.dataset.nodeName === current.selected);
    if (node) node.focus({ preventScroll: true });
  }

  function verifyOverviewData() {
    Object.entries(overviewData).forEach(([key, data]) => {
      const sourceNames = new Set(graphs[key].nodes.map((node) => node.name));
      if (graphs[key].sourceNodeCount !== data.sourceNodes) {
        throw new Error(`${key} overview node count does not match its source export.`);
      }
      if (data.sourceNodes - graphs[key].nodes.length !== data.annotationNodes) {
        throw new Error(`${key} overview annotation count does not match its source export.`);
      }
      if (key === "video" && data.nodes.length !== 8) {
        throw new Error("The video overview must contain eight stages.");
      }
      if (key === "video") {
        data.nodes.forEach((stage) => {
          stage.members.concat(stage.keyNodes.map((node) => node.name)).forEach((name) => {
            if (!sourceNames.has(name)) throw new Error(`The ${key} overview references a missing node: ${name}.`);
          });
        });
        return;
      }
      const mapNames = new Set(data.nodes.map((node) => node.name));
      if (mapNames.size !== graphs[key].nodes.length || graphs[key].nodes.some((node) => !mapNames.has(node.name))) {
        throw new Error(`The ${key} overview does not cover every executable node.`);
      }
      if (data.edges.length !== graphs[key].edges.length || data.edges.some((edge) => {
        const from = data.nodes.find((node) => node.id === edge.from)?.name;
        const to = data.nodes.find((node) => node.id === edge.to)?.name;
        return !graphs[key].edges.some((sourceEdge) => sourceEdge.from === from && sourceEdge.to === to);
      })) {
        throw new Error(`The ${key} overview connections do not match its source export.`);
      }
    });
  }

  function edgesBetween(source, target) {
    return graph().edges.filter((edge) => edge.from === source && edge.to === target);
  }

  function selectBranches(current) {
    current.branches = new Map();
    current.skipped = new Set();
    for (let index = 1; index <= current.cursor; index += 1) {
      const previous = current.path[index - 1];
      const next = current.path[index];
      const matching = edgesBetween(previous, next);
      if (!matching.length) continue;
      const chosen = matching[0];
      current.branches.set(previous, chosen.outputIndex);
      graph().edges
        .filter((edge) => edge.from === previous && edge.type === chosen.type && edge.outputIndex !== chosen.outputIndex)
        .forEach((edge) => current.skipped.add(edge.to));
    }
    if (current.decision === "approved") {
      if (active === "support") current.skipped.add("Log Ticket As Rejected");
      if (active === "video") current.skipped.add("Video Approved?");
    } else if (active === "support" && current.decision === "rejected") {
      current.skipped.add("Email Reply To Customer");
      current.skipped.add("Log Ticket As Sent");
    }
  }

  function nodeStatus(name, current) {
    if (current.visited.has(name)) return "complete";
    if (current.skipped.has(name)) return "skipped";
    if (current.path[current.cursor] === name && current.status === "waiting") return "waiting";
    if (current.path[current.cursor] === name && current.status === "running") return "running";
    return "idle";
  }

  function drawGraph(current) {
    const nodes = graph().nodes;
    const padding = 24;
    const minX = Math.min(...nodes.map((node) => node.position[0]));
    const minY = Math.min(...nodes.map((node) => node.position[1]));
    const maxX = Math.max(...nodes.map((node) => node.position[0])) - minX;
    const maxY = Math.max(...nodes.map((node) => node.position[1])) - minY;
    const width = Math.max(420, maxX + 248);
    const height = Math.max(280, maxY + 118);
    graphRoot.style.width = `${width}px`;
    graphRoot.style.height = `${height}px`;
    graphRoot.dataset.width = String(width);
    graphRoot.dataset.height = String(height);
    edgeSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    edgeSvg.replaceChildren();
    nodeRoot.replaceChildren();

    graph().edges.forEach((edge, index) => {
      const source = findNode(edge.from);
      const target = findNode(edge.to);
      if (!source || !target) return;
      const x1 = source.position[0] - minX + padding + 92;
      const y1 = source.position[1] - minY + padding + 30;
      const x2 = target.position[0] - minX + padding + 92;
      const y2 = target.position[1] - minY + padding + 30;
      const midX = (x1 + x2) / 2;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`);
      path.setAttribute("class", "workflow-edge");
      path.dataset.edgeIndex = String(index);
      const branch = current.branches.get(edge.from);
      if (branch === edge.outputIndex) path.classList.add("is-active");
      else if (branch !== undefined) path.classList.add("is-skipped");
      edgeSvg.append(path);

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", String(midX));
      label.setAttribute("y", String((y1 + y2) / 2 - 4));
      label.setAttribute("class", "workflow-edge-label");
      label.textContent = edge.label;
      edgeSvg.append(label);
    });

    nodes.forEach((node, index) => {
      const status = nodeStatus(node.name, current);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `workflow-node is-${status}`;
      button.dataset.nodeName = node.name;
      button.style.left = `${node.position[0] - minX + padding}px`;
      button.style.top = `${node.position[1] - minY + padding}px`;
      button.setAttribute("aria-pressed", String(current.selected === node.name));
      button.setAttribute("aria-label", `${node.name}, ${status}. ${node.type}.`);
      appendText(button, "span", "workflow-node__name", node.name);
      appendText(button, "span", "workflow-node__state", status);
      if (node.disabled) appendText(button, "span", "workflow-node__disabled", "Disabled in export");
      nodeRoot.append(button);
    });
    syncGraphZoom();
  }

  function syncGraphZoom() {
    const width = Number(graphRoot.dataset.width);
    const height = Number(graphRoot.dataset.height);
    if (!width || !height) return;
    const fitScale = Math.min(
      1,
      Math.max(1, graphScroller.clientWidth - 16) / width,
      Math.max(1, Math.min(window.innerHeight * 0.68, 610) - 16) / height,
    );
    const zoomIndex = graphZoomIndex[active];
    const scale = fitScale * graphZoomFactors[zoomIndex];
    graphRoot.style.transform = `scale(${scale})`;
    graphViewport.style.width = `${width * scale}px`;
    graphViewport.style.height = `${height * scale}px`;
    graphZoomStatus.textContent = `${Math.round(graphZoomFactors[zoomIndex] * 100)}% of fit`;
    suite.querySelector('[data-execution-zoom="out"]').disabled = zoomIndex === 0;
    suite.querySelector('[data-execution-zoom="in"]').disabled = zoomIndex === graphZoomFactors.length - 1;
    suite.querySelector('[data-execution-zoom="fit"]').disabled = zoomIndex === 2;
  }

  function keepSelectedNodeInView(current) {
    const selected = [...nodeRoot.children].find((node) => node.dataset.nodeName === current.selected);
    if (!selected) return;
    const selectedBounds = selected.getBoundingClientRect();
    const scrollerBounds = graphScroller.getBoundingClientRect();
    const margin = 16;
    const left = selectedBounds.left - scrollerBounds.left + graphScroller.scrollLeft;
    const right = selectedBounds.right - scrollerBounds.left + graphScroller.scrollLeft;
    const top = selectedBounds.top - scrollerBounds.top + graphScroller.scrollTop;
    const bottom = selectedBounds.bottom - scrollerBounds.top + graphScroller.scrollTop;
    if (left < graphScroller.scrollLeft || right > graphScroller.scrollLeft + graphScroller.clientWidth) {
      graphScroller.scrollLeft = Math.max(0, left - margin);
    }
    if (top < graphScroller.scrollTop || bottom > graphScroller.scrollTop + graphScroller.clientHeight) {
      graphScroller.scrollTop = Math.max(0, top - margin);
    }
  }

  function renderInspector(current) {
    const node = findNode(current.selected);
    if (!node) return;
    const incoming = graph().edges.filter((edge) => edge.to === node.name);
    const outgoing = graph().edges.filter((edge) => edge.from === node.name);
    byId("workflow-inspector-heading").textContent = node.name;
    byId("workflow-inspector-description").textContent =
      `${nodeStatus(node.name, current)} · ${current.visited.has(node.name) ? "Visited by the browser simulation." : "Source node from the supplied workflow."}`;
    byId("workflow-inspector-type").textContent = node.type;
    byId("workflow-inspector-connections").textContent = [
      `In: ${incoming.length ? incoming.map((edge) => `${edge.from} (${edge.label})`).join("; ") : "none"}`,
      `Out: ${outgoing.length ? outgoing.map((edge) => `${edge.to} (${edge.label})`).join("; ") : "none"}`,
    ].join(" | ");
    const config = [
      node.disabled ? "Disabled in source export." : "",
      node.parameterKeys.length ? `Parameter fields: ${node.parameterKeys.join(", ")}.` : "",
      node.credentialTypes.length ? `Credential types referenced (not verified): ${node.credentialTypes.join(", ")}.` : "",
    ].filter(Boolean);
    byId("workflow-inspector-config").textContent = config.join(" ") || "No safe configuration details exposed.";
    const details = infoFor(node.name, current);
    byId("workflow-inspector-input").textContent = details.input;
    byId("workflow-inspector-output").textContent = details.output;
    byId("workflow-inspector-result").textContent = current.visited.has(node.name)
      ? details.result
      : current.skipped.has(node.name)
        ? "This alternate branch was not selected."
        : "Waiting to simulate.";
  }

  function renderTimeline(current) {
    timeline.replaceChildren();
    current.path.forEach((name, index) => {
      const item = document.createElement("li");
      let status = index < current.cursor ? "complete" : "idle";
      if (index === current.cursor) {
        status = current.status === "waiting" || current.status === "running"
          ? current.status
          : current.status === "complete"
            ? "complete"
            : "paused";
      }
      if (current.skipped.has(name)) status = "skipped";
      item.className = `workflow-timeline__item is-${status}`;
      appendText(item, "span", "workflow-timeline__state", status);
      const button = appendText(item, "button", "workflow-timeline__name", name);
      button.type = "button";
      button.dataset.timelineNode = name;
      timeline.append(item);
    });
    const currentName = current.path[current.cursor];
    byId("workflow-current-step").textContent = currentName
      ? `${current.status === "waiting" ? "Waiting at" : "Current step"}: ${currentName}`
      : "The simulation has not started.";
    const branch = [...current.branches.entries()].pop();
    byId("workflow-active-branch").textContent = branch
      ? `Selected connection: ${branch[0]} → ${current.path[current.path.indexOf(branch[0]) + 1]} (output ${branch[1] + 1}).`
      : "No conditional branch has been selected.";
  }

  function renderSample(current) {
    const container = byId("workflow-sample-content");
    container.replaceChildren();
    const block = (title, lines) => {
      const section = appendText(container, "div", "workflow-sample-block", "");
      appendText(section, "h6", "", title);
      lines.forEach((line) => appendText(section, "p", "", line));
    };
    if (active === "support") {
      block("Sample ticket", [
        "Subject: Trouble accessing my account",
        "Message: I cannot sign in. How can I recover access?",
        "Customer: alex@example.com (fictional)",
      ]);
      block("Fixed draft example", [
        "Category: account access",
        "Reply: I’m sorry you’re having trouble signing in. Please use your service’s official account-recovery process. Do not send your password.",
        "No AI, email, Telegram, or database service was contacted.",
      ]);
      if (current.decision) block("Human decision", [
        `Selected: ${current.decision}.`,
        current.decision === "approved" ? "The email and sent-log branch is shown as simulated only." : "The rejected-log branch is shown as simulated only.",
      ]);
    } else if (active === "video") {
      block("Editable sample input", [
        `Type: ${current.inputType}`,
        `Brief: ${current.description}`,
      ]);
      block("Prewritten storyboard example", [
        "1. 0–8s · Warm morning light across a bakery counter · Ambient room tone.",
        "2. 8–20s · Close-up of fresh bread being placed in a paper bag · “Made fresh for your morning.”",
        "3. 20–30s · Counter-wide shot and a simple neighborhood invitation · Gentle fade.",
        current.revision ? `Revision note: ${current.revision}` : "Scenes are fixed examples, not AI output.",
      ]);
      appendText(container, "p", "workflow-availability", "Image generation and video generation are disabled in the supplied export. This demo creates no media, project record, task, or message.");
    } else {
      const sample = scenario();
      block("Fictional failure details", [
        `Workflow: ${sample.workflow}`,
        `Failed node: ${sample.node}`,
        `Example error: ${sample.error}`,
      ]);
      block("Fixed explanation", [
        sample.explanation,
        `Possible cause (unconfirmed): ${sample.cause}`,
        `Suggested checks: ${sample.suggestion}`,
        current.visited.has("Send Telegram Alert") ? "Alert status: simulated only; no message was delivered." : "No alert has been simulated.",
      ]);
    }
  }

  function renderInteraction(current) {
    interaction.replaceChildren();
    if (active === "video") {
      const inputLabel = appendText(interaction, "label", "workflow-field", "Sample input type");
      const inputSelect = document.createElement("select");
      inputSelect.id = "workflow-video-input-type";
      inputSelect.className = "workflow-select";
      inputSelect.setAttribute("aria-label", "Sample input type");
      inputSelect.disabled = current.status !== "idle";
      ["Text description", "Product image placeholder", "Reference link", "Voice-note transcript"].forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        option.selected = current.inputType === value;
        inputSelect.append(option);
      });
      inputLabel.append(inputSelect);
      const briefLabel = appendText(interaction, "label", "workflow-field", "Editable sample description");
      const brief = document.createElement("textarea");
      brief.id = "workflow-video-description";
      brief.className = "workflow-textarea";
      brief.rows = 3;
      brief.maxLength = 500;
      brief.value = current.description;
      brief.disabled = current.status !== "idle";
      briefLabel.append(brief);
    }
    if (active === "watchdog") {
      const scenarioLabel = appendText(interaction, "label", "workflow-field", "Sample failure scenario");
      const scenarioSelect = document.createElement("select");
      scenarioSelect.id = "workflow-watchdog-scenario";
      scenarioSelect.className = "workflow-select";
      scenarioSelect.disabled = current.status !== "idle";
      [
        ["missing", "Missing required input"],
        ["timeout", "Example request timeout"],
        ["auth", "Example authentication failure"],
        ["database", "Unexpected record shape"],
      ].forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        option.selected = current.scenario === value;
        scenarioSelect.append(option);
      });
      scenarioLabel.append(scenarioSelect);
    }
    if (current.status === "waiting" && active !== "watchdog") {
      appendText(interaction, "p", "workflow-approval-prompt", active === "support"
        ? "Review the fictional support reply, then choose one branch."
        : "Review the fixed storyboard example. Approval continues through a mock-only path. Requesting a revision restarts this sample; the source export has no revision loop.");
      if (active === "video") {
        const feedbackLabel = appendText(interaction, "label", "workflow-field", "Revision feedback (required)");
        const feedback = document.createElement("textarea");
        feedback.id = "workflow-video-feedback";
        feedback.className = "workflow-textarea";
        feedback.rows = 2;
        feedback.maxLength = 300;
        feedback.value = current.revision;
        feedbackLabel.append(feedback);
      }
      const actions = appendText(interaction, "div", "workflow-approval-actions", "");
      const accept = appendText(actions, "button", "workflow-control workflow-control--approve", active === "support" ? "Approve sample reply" : "Approve sample storyboard");
      accept.type = "button";
      accept.dataset.workflowAction = "approve";
      const secondary = appendText(actions, "button", "workflow-control workflow-control--reject", active === "support" ? "Reject sample reply" : "Request revision");
      secondary.type = "button";
      secondary.dataset.workflowAction = active === "support" ? "reject" : "revise";
    }
  }

  function render() {
    const current = currentState();
    tabButtons.forEach((button) => {
      const selected = button.dataset.workflow === active;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    syncOverviewSelection();
    byId("workflow-panel").setAttribute("aria-labelledby", `workflow-tab-${active}`);
    byId("workflow-source-state").textContent = active === "video"
      ? "SAVED · STOPS AT APPROVED STORYBOARD · MEDIA GENERATION OFF"
      : "SAVED IN N8N · NOT YET ACTIVE";
    drawGraph(current);
    keepSelectedNodeInView(current);
    renderInspector(current);
    renderTimeline(current);
    renderSample(current);
    renderInteraction(current);
    const labels = {
      idle: "Idle · Ready to simulate.",
      running: "Running · Advancing through fixed sample steps.",
      paused: "Paused · Resume or step through manually.",
      waiting: "Waiting for a human choice in this simulation.",
      complete: "Complete · Sample path finished; no live operation occurred.",
    };
    byId("workflow-status").textContent = labels[current.status];
    byId("workflow-play").disabled = current.status !== "idle";
    byId("workflow-pause").disabled = current.status !== "running";
    byId("workflow-resume").disabled = current.status !== "paused";
    byId("workflow-previous").disabled = current.cursor <= 0;
    byId("workflow-step").disabled = ["waiting", "complete"].includes(current.status);
  }

  function advance() {
    const current = currentState();
    if (!["running", "paused"].includes(current.status)) return;
    const nextIndex = current.cursor + 1;
    if (nextIndex >= current.path.length) {
      current.status = "complete";
      clearTimer();
      render();
      return;
    }
    current.cursor = nextIndex;
    const name = current.path[current.cursor];
    current.selected = name;
    current.visited.add(name);
    if (active === "support" && name === "Normalize Ticket") {
      current.visited.add("Acknowledge Ticket");
    }
    if (active === "support" && name === "Classify And Draft Reply") {
      current.visited.add("AI Agent Tool");
      current.visited.add("Ollama Chat Model");
    }
    selectBranches(current);
    const info = infoFor(name, current);
    if (info.wait) {
      current.status = "waiting";
      clearTimer();
    } else if (current.cursor === current.path.length - 1) {
      current.status = "complete";
      clearTimer();
    }
    render();
  }

  function startPlayback(resume = false) {
    const current = currentState();
    clearTimer();
    if (resume) {
      if (current.status !== "paused") return;
      current.status = "running";
    } else {
      if (current.status !== "idle") return;
      current.status = "running";
      advance();
      if (current.status !== "running") return;
    }
    render();
    const delay = reducedMotion.matches ? Math.max(100, Number(speed.value)) : Number(speed.value);
    timer = window.setInterval(advance, delay);
  }

  function decide(decision) {
    const current = currentState();
    if (current.status !== "waiting") return;
    current.decision = decision;
    updatePathForDecision(current);
    current.status = "running";
    advance();
    if (current.status === "running") {
      render();
      timer = window.setInterval(advance, reducedMotion.matches ? Math.max(100, Number(speed.value)) : Number(speed.value));
    }
  }

  function previous() {
    const current = currentState();
    if (current.cursor <= 0) return;
    clearTimer();
    const target = current.path[current.cursor - 1];
    if (target === "Was Approved?" || target === "Scenes Approved?") {
      const checkpoint = active === "support" ? "Ask Human To Approve" : "Reply Scene Approval";
      current.cursor = current.path.lastIndexOf(checkpoint);
      current.path = current.path.slice(0, current.cursor + 1);
      current.status = "waiting";
    } else {
      current.cursor -= 1;
      current.status = "paused";
    }
    current.selected = current.path[current.cursor];
    current.visited = new Set(current.path.slice(0, current.cursor + 1));
    current.decision = "";
    if (current.selected === "Ask Human To Approve" || current.selected === "Reply Scene Approval") {
      current.path = current.path.slice(0, current.cursor + 1);
      current.status = "waiting";
    }
    selectBranches(current);
    render();
  }

  function resetCurrent() {
    clearTimer();
    state[active] = createState(active);
    render();
  }

  overviewTabs.forEach((button, index) => {
    button.addEventListener("click", () => {
      activeOverview = button.dataset.overviewWorkflow;
      activateWorkflow(activeOverview);
      renderOverview();
    });
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === "ArrowRight") next = (index + 1) % overviewTabs.length;
      if (event.key === "ArrowLeft") next = (index - 1 + overviewTabs.length) % overviewTabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = overviewTabs.length - 1;
      overviewTabs[next].focus();
      overviewTabs[next].click();
    });
  });

  overviewContent.addEventListener("click", (event) => {
    const zoomButton = event.target.closest("[data-map-zoom]");
    if (zoomButton) {
      const currentZoom = overviewZoom[activeOverview];
      const currentIndex = overviewZoomLevels.indexOf(currentZoom);
      const nextZoom = zoomButton.dataset.mapZoom === "fit"
        ? 1
        : overviewZoomLevels[Math.max(0, Math.min(
          overviewZoomLevels.length - 1,
          currentIndex + (zoomButton.dataset.mapZoom === "in" ? 1 : -1),
        ))];
      overviewZoom[activeOverview] = nextZoom;
      syncOverviewZoom();
      if (zoomButton.dataset.mapZoom === "fit") {
        overviewContent.querySelector(".pipeline-map-scroll").scrollTo(0, 0);
      }
      return;
    }
    const runButton = event.target.closest("[data-run-overview]");
    if (runButton) {
      runOverviewWorkflow(runButton.dataset.runOverview);
      return;
    }
    const stageNode = event.target.closest("[data-stage-toggle]");
    if (stageNode) {
      const stage = overviewContent.querySelector(`[data-stage-details="${stageNode.dataset.stageToggle}"]`);
      if (stage) {
        stage.open = !stage.open;
        stageNode.setAttribute("aria-expanded", String(stage.open));
      }
      return;
    }
    const selectedNode = event.target.closest("[data-overview-node], [data-overview-key-node]");
    if (selectedNode) {
      openOverviewInspector(
        selectedNode.dataset.overviewNode || selectedNode.dataset.overviewKeyNode,
        activeOverview,
        selectedNode,
      );
    }
  });
  suite.querySelector(".workflow-map-tools").addEventListener("click", (event) => {
    const button = event.target.closest("[data-execution-zoom]");
    if (!button || button.disabled) return;
    const scrollCenterX = graphScroller.scrollLeft + graphScroller.clientWidth / 2;
    const scrollCenterY = graphScroller.scrollTop + graphScroller.clientHeight / 2;
    const previousFactor = graphZoomFactors[graphZoomIndex[active]];
    if (button.dataset.executionZoom === "fit") graphZoomIndex[active] = 2;
    else graphZoomIndex[active] += button.dataset.executionZoom === "in" ? 1 : -1;
    const nextFactor = graphZoomFactors[graphZoomIndex[active]];
    syncGraphZoom();
    if (button.dataset.executionZoom === "fit") {
      graphScroller.scrollTo(0, 0);
    } else {
      const ratio = nextFactor / previousFactor;
      graphScroller.scrollLeft = Math.max(0, scrollCenterX * ratio - graphScroller.clientWidth / 2);
      graphScroller.scrollTop = Math.max(0, scrollCenterY * ratio - graphScroller.clientHeight / 2);
    }
  });
  window.addEventListener("resize", syncGraphZoom);
  overviewContent.addEventListener("keydown", (event) => {
    const control = event.target.closest("[data-stage-toggle], [data-overview-node]");
    if (!control || !["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    control.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  inspectorDialog.querySelector("[data-overview-close]").addEventListener("click", () => inspectorDialog.close());
  inspectorDialog.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    inspectorDialog.close();
  });
  inspectorDialog.addEventListener("close", () => {
    if (lastInspectorTrigger?.isConnected) lastInspectorTrigger.focus();
    lastInspectorTrigger = null;
  });

  tabButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      if (button.dataset.workflow === active) return;
      activeOverview = button.dataset.workflow;
      activateWorkflow(activeOverview);
      renderOverview();
    });
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === "ArrowRight") next = (index + 1) % tabButtons.length;
      if (event.key === "ArrowLeft") next = (index - 1 + tabButtons.length) % tabButtons.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabButtons.length - 1;
      tabButtons[next].focus();
      tabButtons[next].click();
    });
  });

  nodeRoot.addEventListener("click", (event) => {
    const button = event.target.closest("[data-node-name]");
    if (!button) return;
    currentState().selected = button.dataset.nodeName;
    render();
  });
  timeline.addEventListener("click", (event) => {
    const button = event.target.closest("[data-timeline-node]");
    if (!button) return;
    currentState().selected = button.dataset.timelineNode;
    render();
  });
  byId("workflow-play").addEventListener("click", () => startPlayback());
  byId("workflow-pause").addEventListener("click", () => {
    const current = currentState();
    if (current.status !== "running") return;
    clearTimer();
    current.status = "paused";
    render();
  });
  byId("workflow-resume").addEventListener("click", () => startPlayback(true));
  byId("workflow-previous").addEventListener("click", previous);
  byId("workflow-step").addEventListener("click", () => {
    const current = currentState();
    if (!["idle", "paused"].includes(current.status)) return;
    clearTimer();
    if (current.status === "idle") current.status = "paused";
    advance();
    if (current.status === "running") current.status = "paused";
    render();
  });
  byId("workflow-reset").addEventListener("click", resetCurrent);
  interaction.addEventListener("input", (event) => {
    const current = currentState();
    if (event.target.id === "workflow-video-description") current.description = event.target.value;
    if (event.target.id === "workflow-video-feedback") current.revision = event.target.value;
    if (event.target.id === "workflow-video-description" || event.target.id === "workflow-video-feedback") {
      renderSample(current);
    }
  });
  interaction.addEventListener("change", (event) => {
    const current = currentState();
    if (event.target.id === "workflow-video-input-type") {
      current.inputType = event.target.value;
      current.path = makePath("video", current);
      current.selected = current.path[0];
    }
    if (event.target.id === "workflow-watchdog-scenario") current.scenario = event.target.value;
    if (event.target.id === "workflow-video-input-type" || event.target.id === "workflow-watchdog-scenario") {
      const keep = event.target;
      render();
      suite.querySelector(`#${keep.id}`)?.focus();
    }
  });
  interaction.addEventListener("click", (event) => {
    const action = event.target.closest("[data-workflow-action]")?.dataset.workflowAction;
    if (!action) return;
    if (action === "approve") {
      decide("approved");
      return;
    }
    if (action === "reject") {
      decide("rejected");
      return;
    }
    if (action === "revise") {
      const current = currentState();
      if (current.status !== "waiting") return;
      if (!current.revision.trim()) {
        byId("workflow-status").textContent = "Add revision feedback before requesting a revision.";
        interaction.querySelector("#workflow-video-feedback")?.focus();
        return;
      }
      current.path = videoIntakePath(current);
      current.cursor = -1;
      current.visited.clear();
      current.skipped.clear();
      current.branches.clear();
      current.selected = current.path[0];
      current.decision = "";
      current.status = "running";
      advance();
      if (current.status === "running") timer = window.setInterval(advance, reducedMotion.matches ? Math.max(100, Number(speed.value)) : Number(speed.value));
    }
  });
  speed.addEventListener("change", () => {
    const current = currentState();
    if (current.status !== "running") return;
    clearTimer();
    timer = window.setInterval(advance, reducedMotion.matches ? Math.max(100, Number(speed.value)) : Number(speed.value));
  });

  if ("IntersectionObserver" in window) {
    const overviewObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      overviewObserver.disconnect();
      if (!overviewRendered) renderOverview();
    }, { rootMargin: "120px" });
    overviewObserver.observe(overview);
  } else {
    renderOverview();
  }
  render();
})();
