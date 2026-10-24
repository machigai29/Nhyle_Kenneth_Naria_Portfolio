const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const navigationAnchors = [...document.querySelectorAll('.nav-links a[href^="#"]')];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const heroSection = document.querySelector("#top");
const flowerFrame = document.querySelector(".flower-backdrop__frame");
const ticker = document.querySelector(".ticker");
const flowerBackdrop = document.querySelector("#flower-backdrop");
const flowerLayers = [...flowerBackdrop.querySelectorAll("[data-bloom-layer]")];
const bloomStages = Array.from(
  { length: 12 },
  (_, index) => `assets/bloom-stage-${String(index + 1).padStart(2, "0")}.webp`,
);
const ambientTones = [
  [16, 16, 15],
  [25, 23, 20],
  [23, 30, 23],
  [25, 23, 20],
  [16, 16, 15],
];
let bloomReady = false;
let bloomStagesLoaded = false;
let bloomLoadPromise = null;
let scrollUpdateFrame = null;

function ambientToneAt(progress) {
  const position = progress * (ambientTones.length - 1);
  const startIndex = Math.floor(position);
  const endIndex = Math.min(startIndex + 1, ambientTones.length - 1);
  const blend = position - startIndex;
  const channels = ambientTones[startIndex].map((channel, index) =>
    Math.round(channel + (ambientTones[endIndex][index] - channel) * blend),
  );
  return `rgb(${channels.join(" ")})`;
}

function clampProgress(value) {
  return Math.max(0, Math.min(1, value));
}

function pointOnBezier(progress, start, control1, control2, end) {
  const inverse = 1 - progress;
  const startWeight = inverse ** 3;
  const control1Weight = 3 * inverse ** 2 * progress;
  const control2Weight = 3 * inverse * progress ** 2;
  const endWeight = progress ** 3;
  return {
    x: start.x * startWeight + control1.x * control1Weight + control2.x * control2Weight + end.x * endWeight,
    y: start.y * startWeight + control1.y * control1Weight + control2.y * control2Weight + end.y * endWeight,
  };
}

function updateFlowerTravel(progress) {
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight;
  const frame = flowerFrame.getBoundingClientRect();
  const isMobile = viewportWidth <= 760;
  const headerHeight = document.querySelector(".site-header").getBoundingClientRect().height;
  const startArtworkCenterY = Math.max(headerHeight + 100, viewportHeight * 0.24);
  const start = {
    x: viewportWidth * 0.28,
    y: startArtworkCenterY - frame.height * 0.07,
  };
  const end = {
    x: Math.min(
      viewportWidth * (isMobile ? 0.56 : 0.88),
      viewportWidth - frame.width / 2 - 12,
    ),
    y: viewportHeight - frame.height / 2 - 20,
  };
  const verticalDistance = Math.max(1, end.y - start.y);
  const point = pointOnBezier(progress, start, {
    x: viewportWidth * (isMobile ? 0.82 : 0.88),
    y: start.y + verticalDistance * 0.25,
  }, {
    x: viewportWidth * (isMobile ? 0.18 : 0.12),
    y: start.y + verticalDistance * 0.75,
  }, end);

  flowerFrame.style.transform = `translate3d(${point.x - frame.width / 2}px, ${point.y - frame.height / 2}px, 0)`;
}

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Open navigation menu" : "Close navigation menu");
  navLinks.classList.toggle("is-open", !isOpen);
});

function closeNavigation() {
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
  navLinks.classList.remove("is-open");
}

navigationAnchors.forEach((anchor) => anchor.addEventListener("click", closeNavigation));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeNavigation();
});

const sections = [...document.querySelectorAll("main section[id]")];
if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navigationAnchors.forEach((anchor) => {
        if (anchor.getAttribute("href") === `#${entry.target.id}`) {
          anchor.setAttribute("aria-current", "location");
        } else {
          anchor.removeAttribute("aria-current");
        }
      });
    });
  }, { rootMargin: "-35% 0px -55% 0px" });
  sections.forEach((section) => sectionObserver.observe(section));
  const tickerObserver = new IntersectionObserver(([entry]) => {
    ticker.classList.toggle("is-visible", entry.isIntersecting);
  });
  tickerObserver.observe(ticker);
} else {
  ticker.classList.add("is-visible");
}

document.addEventListener("visibilitychange", () => {
  ticker.classList.toggle("is-paused", document.hidden);
});

function prepareBloomSequence() {
  if (bloomLoadPromise) return bloomLoadPromise;

  bloomLoadPromise = Promise.all(bloomStages.map((src) => new Promise((resolve, reject) => {
    const frame = new Image();
    frame.onload = () => resolve(frame);
    frame.onerror = () => reject(new Error(`Unable to load flower bloom frame: ${src}`));
    frame.src = src;
  }))).then(() => {
    bloomStagesLoaded = true;
    if (reducedMotion.matches) {
      showFullBloom();
      return;
    }
    bloomReady = true;
    scheduleBloomUpdate();
  }).catch((error) => {
    console.error("Flower bloom sequence could not be loaded; keeping the full-bloom image.", error);
    showFullBloom();
  });
  return bloomLoadPromise;
}

function showFullBloom() {
  const [primaryLayer, secondaryLayer] = flowerLayers;
  primaryLayer.src = "assets/flower-bloom.webp";
  primaryLayer.dataset.stage = "full";
  primaryLayer.classList.add("is-current");
  primaryLayer.style.opacity = "";
  secondaryLayer.removeAttribute("src");
  secondaryLayer.removeAttribute("data-stage");
  secondaryLayer.classList.remove("is-current");
  secondaryLayer.style.opacity = "0";
  bloomReady = false;
}

function setLayerStage(layer, stageIndex) {
  layer.src = bloomStages[stageIndex];
  layer.dataset.stage = String(stageIndex);
  layer.classList.remove("is-current");
}

function renderBloomAtScroll() {
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const heroBottom = heroSection.getBoundingClientRect().bottom + window.scrollY;
  const bloomStart = Math.min(heroBottom, maxScroll);
  const distanceAfterHero = Math.max(0, window.scrollY - bloomStart);
  const bloomRange = Math.max(0, maxScroll - bloomStart);
  const progress = bloomRange === 0 ? 0 : Math.min(1, distanceAfterHero / bloomRange);
  const travelProgress = reducedMotion.matches || maxScroll === 0
    ? 0
    : clampProgress(window.scrollY / maxScroll);
  const ambientProgress = reducedMotion.matches ? 0 : progress;
  document.documentElement.style.setProperty("--ambient-tone", ambientToneAt(ambientProgress));
  flowerBackdrop.style.opacity = String(reducedMotion.matches ? 0.42 : 0.52 - progress * 0.1);
  flowerBackdrop.style.filter = `brightness(${reducedMotion.matches ? 2.1 : 2.8 - progress * 0.7})`;
  updateFlowerTravel(travelProgress);

  if (!bloomReady || reducedMotion.matches) return;

  const stagePosition = progress * (bloomStages.length - 1);
  const currentStage = Math.min(Math.floor(stagePosition), bloomStages.length - 1);
  const nextStage = Math.min(currentStage + 1, bloomStages.length - 1);
  const blend = currentStage === nextStage ? 0 : stagePosition - currentStage;

  let currentLayer = flowerLayers.find((layer) => Number(layer.dataset.stage) === currentStage);
  let nextLayer = flowerLayers.find((layer) => Number(layer.dataset.stage) === nextStage);

  if (!currentLayer && !nextLayer) {
    setLayerStage(flowerLayers[0], currentStage);
    if (nextStage !== currentStage) setLayerStage(flowerLayers[1], nextStage);
  } else {
    if (!currentLayer) {
      currentLayer = flowerLayers.find((layer) => layer !== nextLayer);
      setLayerStage(currentLayer, currentStage);
    }
    if (nextStage !== currentStage && !nextLayer) {
      nextLayer = flowerLayers.find((layer) => layer !== currentLayer);
      setLayerStage(nextLayer, nextStage);
    }
  }

  flowerLayers.forEach((layer) => {
    const layerStage = Number(layer.dataset.stage);
    if (layerStage === currentStage) {
      layer.style.opacity = currentStage === nextStage ? "1" : String(1 - blend);
    } else {
      layer.style.opacity = layerStage === nextStage ? String(blend) : "0";
    }
  });
}

function scheduleBloomUpdate() {
  if (scrollUpdateFrame !== null) return;
  scrollUpdateFrame = window.requestAnimationFrame(() => {
    scrollUpdateFrame = null;
    renderBloomAtScroll();
  });
}

function handleMotionPreferenceChange(event) {
  if (event.matches) {
    showFullBloom();
    scheduleBloomUpdate();
    return;
  }
  prepareBloomSequence().then(() => {
    if (!reducedMotion.matches && bloomStagesLoaded) {
      bloomReady = true;
      scheduleBloomUpdate();
    }
  });
}

window.addEventListener("scroll", scheduleBloomUpdate, { passive: true });
window.addEventListener("resize", scheduleBloomUpdate);
window.addEventListener("load", scheduleBloomUpdate, { once: true });
window.addEventListener("pageshow", scheduleBloomUpdate);
reducedMotion.addEventListener("change", handleMotionPreferenceChange);
scheduleBloomUpdate();
if (reducedMotion.matches) showFullBloom();
else prepareBloomSequence();

const toolStories = {
  Claude: "Claude: AI-assisted research, planning, and prototyping.",
  GPT: "GPT: a copilot for exploring ideas and building useful work.",
  Codex: "Codex: an AI coding partner for working prototypes.",
  DeepSeek: "DeepSeek: another model in a practical, multi-model workflow.",
  n8n: "n8n: visual workflows that connect everyday tools.",
  Zapier: "Zapier: no-code automations for repetitive tasks.",
  "Apps Script": "Apps Script: custom automation in Google Workspace.",
  Python: "Python: a flexible tool for data handling and scripts.",
  ESP32: "ESP32: the board used in an aquaculture-monitoring project.",
  MATLAB: "MATLAB: engineering analysis and technical problem-solving.",
};

const toolCaption = document.querySelector("#tool-caption");
const toolBadges = [...document.querySelectorAll(".tool-badge")];
toolBadges.forEach((button) => {
  button.addEventListener("click", () => {
    toolBadges.forEach((badge) => badge.setAttribute("aria-pressed", String(badge === button)));
    toolCaption.textContent = toolStories[button.dataset.tool];
    toolCaption.classList.add("is-selected");
  });
});

document.querySelectorAll(".filter-button").forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    document.querySelectorAll(".filter-button").forEach((item) => {
      const selected = item === button;
      item.classList.toggle("is-active", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    document.querySelectorAll(".project-card").forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.category !== filter;
    });
    scheduleBloomUpdate();
  });
});

const workflowSuite = document.querySelector(".workflow-suite-legacy");
if (workflowSuite) {
  const workflowTabButtons = [...workflowSuite.querySelectorAll(".workflow-tab")];
  const workflowNodes = workflowSuite.querySelector("#workflow-nodes");
  const workflowTimeline = workflowSuite.querySelector("#workflow-timeline");
  const workflowInteraction = workflowSuite.querySelector("#workflow-interaction");
  const workflowSampleContent = workflowSuite.querySelector("#workflow-sample-content");
  const workflowStatus = workflowSuite.querySelector("#workflow-status");
  const workflowCurrentStep = workflowSuite.querySelector("#workflow-current-step");
  const workflowInspectorHeading = workflowSuite.querySelector("#workflow-inspector-heading");
  const workflowInspectorDescription = workflowSuite.querySelector("#workflow-inspector-description");
  const workflowInspectorInput = workflowSuite.querySelector("#workflow-inspector-input");
  const workflowInspectorOutput = workflowSuite.querySelector("#workflow-inspector-output");
  const workflowInspectorResult = workflowSuite.querySelector("#workflow-inspector-result");
  const workflowPlay = workflowSuite.querySelector("#workflow-play");
  const workflowPause = workflowSuite.querySelector("#workflow-pause");
  const workflowResume = workflowSuite.querySelector("#workflow-resume");
  const workflowStep = workflowSuite.querySelector("#workflow-step");
  const workflowReset = workflowSuite.querySelector("#workflow-reset");
  const watchdogScenarios = {
    missing: {
      workflow: "Inventory Sync Sample",
      node: "Normalize Input",
      error: "Required field `item_id` was not present.",
      explanation: "The sample event reached the workflow without an item identifier.",
      cause: "An upstream form or webhook may have sent an incomplete payload.",
      suggestions: "Check the source payload, then add or verify a required-field validation step.",
    },
    timeout: {
      workflow: "Catalog Refresh Sample",
      node: "Request Product API",
      error: "The example request exceeded its configured time limit.",
      explanation: "The sample API request did not return before its timeout.",
      cause: "The endpoint may be slow, unavailable, or waiting on a network response.",
      suggestions: "Check endpoint availability and timeout settings; retry only if the operation is safe to repeat.",
    },
    auth: {
      workflow: "Daily Metrics Sample",
      node: "Fetch Report",
      error: "The example service rejected the supplied credentials.",
      explanation: "The sample service did not accept the workflow's authentication.",
      cause: "Credentials may be expired, incomplete, or missing required access.",
      suggestions: "Verify the credential reference and permissions in the service configuration. Do not paste secrets into this demo.",
    },
    database: {
      workflow: "Form Archive Sample",
      node: "Insert Record",
      error: "The example record did not match the expected table shape.",
      explanation: "The sample database step rejected a record with an unexpected structure.",
      cause: "A field name, data type, or required value may differ from the destination schema.",
      suggestions: "Compare the normalized record with the destination schema and validate required fields before insertion.",
    },
  };
  const workflowDefinitions = {
    support: {
      label: "Support auto-responder",
      description: "A fictional support ticket is classified and drafted for a person to review before either branch is simulated.",
      steps: [
        { name: "Support Ticket Webhook", detail: "Receives the fictional support-ticket sample.", input: "Subject, message, and alex@example.com as sample customer email.", output: "A sample ticket event.", result: "Sample event received; no webhook was contacted." },
        { name: "Normalize Ticket", detail: "Puts the supplied ticket fields into a consistent shape.", input: "Subject and message from the sample ticket.", output: "Trimmed subject, message, and sample email fields.", result: "Sample fields normalized in memory." },
        { name: "Classify and Draft Reply with Gemini", detail: "Shows a fixed example classification and cautious reply. No model is called.", input: "The sample account-access question.", output: "Category: account access. Draft: “I’m sorry you’re having trouble signing in. Please use your service’s official account-recovery process. If you still need help, reply with more detail, but do not send your password.”", result: "Prewritten example shown; no AI service was contacted." },
        { name: "Parse AI Draft", detail: "Represents the draft fields that would be passed to a review step.", input: "Fixed example draft text.", output: "A sample category and reply body.", result: "Example response fields prepared." },
        { name: "Send Draft to Telegram for Human Approval", detail: "Pauses for a visitor to choose a simulated approval branch.", input: "Sample category and draft response.", output: "Approve or reject decision controls.", result: "Waiting for your choice. No Telegram message was sent.", approval: true },
        { name: "Evaluate Approval Decision", detail: "Selects exactly one branch based on your choice.", input: "Your approval or rejection selection.", output: "One branch continues; the other is skipped.", result: "Decision evaluated in the local simulation." },
        { name: "Approved: Send Email to Customer", detail: "Represents the approved email action without sending anything.", input: "Approved sample reply and alex@example.com.", output: "Simulated email delivery result.", result: "Email delivery simulated; no email was sent.", branch: "approved" },
        { name: "Approved: Log Ticket as Sent", detail: "Represents a sent-status log in the demo only.", input: "Sample ticket and simulated delivery status.", output: "A sample “sent” log entry.", result: "Log represented in the interface; no database was modified.", branch: "approved" },
        { name: "Rejected: Log Ticket as Rejected", detail: "Represents a rejection record in the demo only.", input: "Sample ticket and your rejection decision.", output: "A sample “rejected” log entry.", result: "Rejection represented in the interface; no database was modified.", branch: "rejected" },
      ],
    },
    video: {
      label: "Video generator",
      description: "An example brief becomes a storyboard plan for human review. Rendering and publishing are not part of this simulation.",
      steps: [
        { name: "Receive Input", detail: "Accepts an editable sample brief or a selected input-type placeholder.", input: "Sample description entered below.", output: "Brief and selected input type.", result: "Sample input received locally." },
        { name: "Normalize and Validate Input", detail: "Checks the sample brief for usable text before planning.", input: "Current sample description.", output: "A normalized planning brief.", result: "Sample brief validated." },
        { name: "Analyze the Input with Gemini", detail: "Represents a planning analysis with fixed example data.", input: "Normalized sample brief.", output: "Audience, tone, and key message suggestions.", result: "Example analysis shown; no AI service was contacted." },
        { name: "Generate Script and Storyboard", detail: "Displays a fixed storyboard, optionally annotated with your revision note.", input: "Sample brief and optional revision feedback.", output: "Three example scenes with durations, direction, narration, and transitions.", result: "Storyboard plan generated locally; no video was rendered." },
        { name: "Validate Storyboard Structure", detail: "Checks that the sample storyboard has ordered scenes and durations.", input: "Three example storyboard scenes.", output: "A structurally complete sample storyboard.", result: "Example storyboard structure validated." },
        { name: "Request Human Approval", detail: "Pauses for approval or a revision request.", input: "Sample storyboard plan.", output: "Approve or request revision controls.", result: "Waiting for your review. No generation task was created.", approval: true },
        { name: "Approved: Create Mock Generation Tasks", detail: "Creates display-only task examples, not actual render jobs.", input: "Approved sample storyboard.", output: "Mock scene-task statuses.", result: "Mock tasks displayed; image generation and video rendering are unavailable.", branch: "approved" },
        { name: "Record Project and Approval Status", detail: "Represents project, scenes, and approval status in local sample data.", input: "Approved sample plan and mock task statuses.", output: "A sample project record.", result: "Record shown in the demo only; no database was modified.", branch: "approved" },
        { name: "Display Project Summary", detail: "Summarizes the approved planning prototype.", input: "Sample project record.", output: "Approved planning summary and mock task status.", result: "Planning summary displayed. No complete video was rendered or published.", branch: "approved" },
      ],
    },
    watchdog: {
      label: "Workflow watchdog",
      description: "A selected fictional failure is explained using fixed sample text and troubleshooting suggestions.",
      steps: [
        { name: "Simulated Workflow Failure Event", detail: "Starts from a selected fictional failure example.", input: "Selected failure scenario below.", output: "Fictional workflow name, node, and example error.", result: "Sample failure event created locally.", failed: true },
        { name: "Normalize Error Details", detail: "Puts the sample error fields into a consistent shape.", input: "Fictional error event.", output: "Normalized workflow, node, and error fields.", result: "Sample details normalized." },
        { name: "Extract Workflow and Node Information", detail: "Separates the reported workflow and node names from the sample event.", input: "Normalized sample error.", output: "Fictional workflow and node identifiers.", result: "Example identifiers extracted." },
        { name: "Ask Gemini to Explain the Error", detail: "Shows fixed explanatory text. No AI service is called.", input: "Sample error details.", output: "A plain-English explanation and possible cause.", result: "Prewritten example shown; possible causes are suggestions, not confirmed facts." },
        { name: "Build Structured Alert Message", detail: "Formats the sample error and suggested next steps as an alert.", input: "Error facts and clearly labeled possible cause.", output: "A sample alert message.", result: "Alert message prepared locally." },
        { name: "Simulate Telegram Notification", detail: "Represents a notification status without contacting Telegram.", input: "Sample alert message.", output: "Simulated notification status.", result: "Notification delivery simulated; no Telegram message was sent." },
        { name: "Display Troubleshooting Summary", detail: "Separates the reported sample error from possible causes and suggestions.", input: "Sample alert and scenario-specific suggestions.", output: "Fictional workflow, failure summary, possible cause, and troubleshooting steps.", result: "Summary displayed. No real n8n instance was monitored." },
      ],
    },
  };
  const workflowStates = {
    support: { status: "idle", currentStep: -1, completed: new Set(), selectedNode: 0, decision: null },
    video: {
      status: "idle",
      currentStep: -1,
      completed: new Set(),
      selectedNode: 0,
      decision: null,
      inputType: "Text description",
      description: "A small-batch coffee brand introduces its new roast with a warm, documentary-style product story.",
      revisionFeedback: "",
      revisionCount: 0,
    },
    watchdog: { status: "idle", currentStep: -1, completed: new Set(), selectedNode: 0, decision: null, scenario: "missing" },
  };
  const storyboardScenes = [
    { duration: "4 sec", direction: "Morning light crosses a quiet kitchen counter.", narration: "A good morning starts with a little care.", transition: "Slow dissolve" },
    { duration: "5 sec", direction: "A close view of coffee being poured into a ceramic cup.", narration: "Meet the new small-batch roast.", transition: "Gentle cut" },
    { duration: "4 sec", direction: "The cup rests beside the unopened sample package.", narration: "Made for the moments you make your own.", transition: "Fade to dark" },
  ];
  let activeWorkflow = "support";
  let playbackTimer = null;

  function currentWorkflowState() {
    return workflowStates[activeWorkflow];
  }

  function clearWorkflowTimer() {
    if (playbackTimer !== null) {
      window.clearInterval(playbackTimer);
      playbackTimer = null;
    }
  }

  function nodeStateAt(index, definition, state) {
    const step = definition.steps[index];
    if (step.branch && state.decision && step.branch !== state.decision) return "skipped";
    if (activeWorkflow === "support" && index === 8 && state.completed.has(index)) return "rejected";
    if (activeWorkflow === "watchdog" && index === 0 && state.completed.has(index)) return "failed";
    if (state.status === "waiting" && state.currentStep === index) return "waiting";
    if (state.status === "running" && state.currentStep === index) return "running";
    if (state.completed.has(index)) return "completed";
    return "idle";
  }

  function detailsFor(index, definition, state) {
    const step = definition.steps[index];
    if (!step) return null;
    let input = step.input;
    let output = step.output;
    let result = state.completed.has(index) ? step.result : "Waiting for this step.";

    if (activeWorkflow === "video" && index === 0) {
      input = `${state.inputType}: ${state.description}`;
    }
    if (activeWorkflow === "video" && index === 3 && state.revisionFeedback) {
      output = `Revised sample storyboard incorporating: “${state.revisionFeedback}”`;
    }
    if (activeWorkflow === "support" && index === 5 && state.decision) {
      output = `Decision: ${state.decision === "approved" ? "approved branch only" : "rejected branch only"}.`;
    }
    if (activeWorkflow === "watchdog") {
      const scenario = watchdogScenarios[state.scenario];
      if (index === 0) {
        input = `${scenario.workflow} · ${scenario.node} · ${scenario.error}`;
        output = "Fictional failure event captured for this browser-only demo.";
      }
      if (index === 3) output = `${scenario.explanation} Possible cause: ${scenario.cause}`;
      if (index === 6) output = `${scenario.explanation} Possible cause: ${scenario.cause} Suggested checks: ${scenario.suggestions}`;
    }
    return { step, input, output, result };
  }

  function appendText(parent, tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = text;
    parent.append(element);
    return element;
  }

  function renderWorkflowInteraction(state) {
    workflowInteraction.replaceChildren();
    if (activeWorkflow === "video") {
      const inputTypeLabel = appendText(workflowInteraction, "label", "workflow-field", "Sample input type");
      const inputTypeSelect = document.createElement("select");
      inputTypeSelect.id = "workflow-video-input-type";
      inputTypeSelect.className = "workflow-select";
      inputTypeSelect.setAttribute("aria-label", "Sample input type");
      ["Text description", "Product image placeholder", "Reference link", "Voice-note transcript"].forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        option.selected = state.inputType === value;
        inputTypeSelect.append(option);
      });
      inputTypeLabel.append(inputTypeSelect);

      const descriptionLabel = appendText(workflowInteraction, "label", "workflow-field", "Editable sample description");
      const description = document.createElement("textarea");
      description.id = "workflow-video-description";
      description.className = "workflow-textarea";
      description.rows = 3;
      description.value = state.description;
      descriptionLabel.append(description);
    }
    if (activeWorkflow === "watchdog") {
      const scenarioLabel = appendText(workflowInteraction, "label", "workflow-field", "Sample failure scenario");
      const scenarioSelect = document.createElement("select");
      scenarioSelect.id = "workflow-watchdog-scenario";
      scenarioSelect.className = "workflow-select";
      scenarioSelect.setAttribute("aria-label", "Sample failure scenario");
      [
        ["missing", "Missing required input"],
        ["timeout", "API request timeout"],
        ["auth", "Invalid authentication"],
        ["database", "Database insert failure"],
      ].forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        option.selected = state.scenario === value;
        scenarioSelect.append(option);
      });
      scenarioLabel.append(scenarioSelect);
      const trigger = appendText(workflowInteraction, "button", "workflow-control workflow-trigger", "Simulate another failure");
      trigger.type = "button";
      trigger.dataset.workflowAction = "watchdog-trigger";
    }
    if (state.status === "waiting" && activeWorkflow === "support") {
      const prompt = appendText(workflowInteraction, "p", "workflow-approval-prompt", "Review the sample reply. Choose one branch to continue.");
      prompt.id = "workflow-approval-prompt";
      const actions = appendText(workflowInteraction, "div", "workflow-approval-actions", "");
      const approve = appendText(actions, "button", "workflow-control workflow-control--approve", "Approve sample reply");
      approve.type = "button";
      approve.dataset.workflowAction = "approve";
      const reject = appendText(actions, "button", "workflow-control workflow-control--reject", "Reject sample reply");
      reject.type = "button";
      reject.dataset.workflowAction = "reject";
    }
    if (state.status === "waiting" && activeWorkflow === "video") {
      appendText(workflowInteraction, "p", "workflow-approval-prompt", "Review the sample storyboard. Approve it or request a revision.");
      const feedbackLabel = appendText(workflowInteraction, "label", "workflow-field", "Revision feedback");
      const feedback = document.createElement("textarea");
      feedback.id = "workflow-video-feedback";
      feedback.className = "workflow-textarea";
      feedback.rows = 2;
      feedback.placeholder = "For example: Make the opening more cinematic.";
      feedback.value = state.revisionFeedback;
      feedbackLabel.append(feedback);
      const actions = appendText(workflowInteraction, "div", "workflow-approval-actions", "");
      const approve = appendText(actions, "button", "workflow-control workflow-control--approve", "Approve storyboard");
      approve.type = "button";
      approve.dataset.workflowAction = "approve";
      const revise = appendText(actions, "button", "workflow-control", "Request revision");
      revise.type = "button";
      revise.dataset.workflowAction = "revise";
    }
  }

  function renderSample(state) {
    workflowSampleContent.replaceChildren();
    const definition = workflowDefinitions[activeWorkflow];
    if (activeWorkflow === "support") {
      const inputBlock = appendText(workflowSampleContent, "div", "workflow-sample-block", "");
      appendText(inputBlock, "h6", "", "Sample ticket");
      appendText(inputBlock, "p", "", "Subject: Unable to access my account");
      appendText(inputBlock, "p", "", "Message: I cannot sign in to my account. Could someone help me regain access?");
      appendText(inputBlock, "p", "", "Customer email: alex@example.com (fictional sample)");
      const outputBlock = appendText(workflowSampleContent, "div", "workflow-sample-block", "");
      appendText(outputBlock, "h6", "", "Example draft");
      appendText(outputBlock, "p", "", "I’m sorry you’re having trouble signing in. Please use your service’s official account-recovery process. If you still need help, reply with more detail, but do not send your password.");
    } else if (activeWorkflow === "video") {
      const inputBlock = appendText(workflowSampleContent, "div", "workflow-sample-block", "");
      appendText(inputBlock, "h6", "", "Planning brief");
      appendText(inputBlock, "p", "", `${state.inputType}: ${state.description}`);
      if (state.revisionFeedback) appendText(inputBlock, "p", "", `Revision requested: ${state.revisionFeedback}`);
      const board = appendText(workflowSampleContent, "div", "workflow-storyboard", "");
      appendText(board, "h6", "", "Sample storyboard");
      const sceneList = appendText(board, "ol", "workflow-scenes", "");
      storyboardScenes.forEach((scene, index) => {
        const sceneItem = appendText(sceneList, "li", "", "");
        appendText(sceneItem, "strong", "", `Scene ${index + 1} · ${scene.duration}`);
        appendText(sceneItem, "span", "", `Visual: ${scene.direction}`);
        appendText(sceneItem, "span", "", `Narration: ${scene.narration}`);
        appendText(sceneItem, "span", "", `Transition: ${scene.transition}`);
      });
      const availability = appendText(workflowSampleContent, "p", "workflow-unavailable", "");
      availability.textContent = "Image generation, video rendering, and publishing are unavailable in this prototype.";
    } else {
      const scenario = watchdogScenarios[state.scenario];
      const inputBlock = appendText(workflowSampleContent, "div", "workflow-sample-block", "");
      appendText(inputBlock, "h6", "", "Reported sample details");
      appendText(inputBlock, "p", "", `Fictional workflow: ${scenario.workflow}`);
      appendText(inputBlock, "p", "", `Fictional failed node: ${scenario.node}`);
      appendText(inputBlock, "p", "", `Example error: ${scenario.error}`);
      const outputBlock = appendText(workflowSampleContent, "div", "workflow-sample-block", "");
      appendText(outputBlock, "h6", "", "Explanation and recovery suggestions");
      appendText(outputBlock, "p", "", `Explanation: ${scenario.explanation}`);
      appendText(outputBlock, "p", "", `Possible cause (unconfirmed): ${scenario.cause}`);
      appendText(outputBlock, "p", "", `Suggested checks: ${scenario.suggestions}`);
      appendText(outputBlock, "p", "", state.completed.has(5) ? "Telegram alert delivery: simulated only." : "No alert has been simulated yet.");
    }
    const current = state.currentStep >= 0 ? definition.steps[state.currentStep] : null;
    workflowCurrentStep.textContent = current
      ? `${state.status === "waiting" ? "Waiting for your decision" : `Current step: ${current.name}`}`
      : "The simulation has not started.";
  }

  function renderWorkflow() {
    const definition = workflowDefinitions[activeWorkflow];
    const state = currentWorkflowState();
    const tabId = `workflow-tab-${activeWorkflow}`;
    workflowSuite.querySelector("#workflow-panel").setAttribute("aria-labelledby", tabId);
    workflowTabButtons.forEach((button) => {
      const selected = button.dataset.workflow === activeWorkflow;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    workflowNodes.replaceChildren();
    workflowTimeline.replaceChildren();
    definition.steps.forEach((step, index) => {
      const status = nodeStateAt(index, definition, state);
      const nodeItem = document.createElement("li");
      nodeItem.className = `workflow-node-item is-${status}`;
      const nodeButton = document.createElement("button");
      nodeButton.type = "button";
      nodeButton.className = "workflow-node";
      nodeButton.dataset.nodeIndex = String(index);
      nodeButton.setAttribute("aria-pressed", String(state.selectedNode === index));
      nodeButton.setAttribute("aria-label", `${step.name}, ${status.replace("-", " ")}`);
      appendText(nodeButton, "span", "workflow-node__index", String(index + 1).padStart(2, "0"));
      const nodeCopy = appendText(nodeButton, "span", "workflow-node__copy", "");
      appendText(nodeCopy, "strong", "", step.name);
      appendText(nodeCopy, "span", "workflow-node__detail", step.detail);
      appendText(nodeButton, "span", "workflow-node__state", status.replace("-", " "));
      nodeItem.append(nodeButton);
      workflowNodes.append(nodeItem);

      const timelineItem = document.createElement("li");
      timelineItem.className = `workflow-timeline__item is-${status}`;
      appendText(timelineItem, "span", "workflow-timeline__state", status.replace("-", " "));
      appendText(timelineItem, "span", "workflow-timeline__name", step.name);
      workflowTimeline.append(timelineItem);
    });
    const selected = detailsFor(state.selectedNode, definition, state);
    workflowInspectorHeading.textContent = selected ? selected.step.name : "Select a node";
    workflowInspectorDescription.textContent = selected ? selected.step.detail : "Choose a workflow node to inspect its purpose and example data.";
    workflowInspectorInput.textContent = selected ? selected.input : "No node selected.";
    workflowInspectorOutput.textContent = selected ? selected.output : "No node selected.";
    workflowInspectorResult.textContent = selected ? selected.result : "Waiting to simulate.";
    const statusLabels = {
      idle: "Idle · Ready to simulate.",
      running: "Running · Advancing through sample steps.",
      paused: "Paused · Resume or step through manually.",
      waiting: "Waiting for approval · Choose one branch to continue.",
      completed: "Complete · Simulation finished.",
      failed: "Stopped · The simulation encountered an interface error. Reset and try again.",
    };
    workflowStatus.textContent = statusLabels[state.status];
    workflowPlay.disabled = state.status !== "idle";
    workflowPause.disabled = state.status !== "running";
    workflowResume.disabled = state.status !== "paused";
    workflowStep.disabled = ["waiting", "completed", "failed"].includes(state.status);
    renderWorkflowInteraction(state);
    renderSample(state);
  }

  function advanceWorkflow() {
    const state = currentWorkflowState();
    const definition = workflowDefinitions[activeWorkflow];
    if (state.status !== "running" && state.status !== "paused") return;
    let nextIndex = state.currentStep + 1;
    while (nextIndex < definition.steps.length) {
      const nextStep = definition.steps[nextIndex];
      if (nextStep.branch && state.decision && nextStep.branch !== state.decision) {
        state.completed.add(nextIndex);
        nextIndex += 1;
        continue;
      }
      if (nextStep.branch && !state.decision) {
        state.status = "failed";
        clearWorkflowTimer();
        renderWorkflow();
        return;
      }
      break;
    }
    if (nextIndex >= definition.steps.length) {
      state.status = "completed";
      clearWorkflowTimer();
      renderWorkflow();
      return;
    }
    state.currentStep = nextIndex;
    state.selectedNode = nextIndex;
    state.completed.add(nextIndex);
    if (definition.steps[nextIndex].approval) {
      state.status = "waiting";
      clearWorkflowTimer();
    }
    renderWorkflow();
  }

  function startWorkflowPlayback(resume = false) {
    const state = currentWorkflowState();
    clearWorkflowTimer();
    if (resume) {
      if (state.status !== "paused") return;
      state.status = "running";
    } else {
      if (state.status !== "idle") return;
      state.status = "running";
      advanceWorkflow();
      if (state.status !== "running") return;
    }
    renderWorkflow();
    playbackTimer = window.setInterval(advanceWorkflow, 850);
  }

  function resetWorkflow(state) {
    clearWorkflowTimer();
    state.status = "idle";
    state.currentStep = -1;
    state.completed.clear();
    state.selectedNode = 0;
    state.decision = null;
  }

  function continueWithDecision(decision) {
    const state = currentWorkflowState();
    if (state.status !== "waiting") return;
    state.decision = decision;
    state.status = "running";
    advanceWorkflow();
    if (state.status === "running") {
      renderWorkflow();
      playbackTimer = window.setInterval(advanceWorkflow, 850);
    }
  }

  workflowTabButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      if (button.dataset.workflow === activeWorkflow) return;
      clearWorkflowTimer();
      activeWorkflow = button.dataset.workflow;
      renderWorkflow();
    });
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let nextIndex = index;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % workflowTabButtons.length;
      if (event.key === "ArrowLeft") nextIndex = (index - 1 + workflowTabButtons.length) % workflowTabButtons.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = workflowTabButtons.length - 1;
      workflowTabButtons[nextIndex].focus();
      workflowTabButtons[nextIndex].click();
    });
  });

  workflowNodes.addEventListener("click", (event) => {
    const node = event.target.closest("[data-node-index]");
    if (!node) return;
    currentWorkflowState().selectedNode = Number(node.dataset.nodeIndex);
    renderWorkflow();
  });
  workflowPlay.addEventListener("click", () => startWorkflowPlayback());
  workflowPause.addEventListener("click", () => {
    const state = currentWorkflowState();
    if (state.status !== "running") return;
    clearWorkflowTimer();
    state.status = "paused";
    renderWorkflow();
  });
  workflowResume.addEventListener("click", () => startWorkflowPlayback(true));
  workflowStep.addEventListener("click", () => {
    const state = currentWorkflowState();
    if (!["idle", "paused"].includes(state.status)) return;
    clearWorkflowTimer();
    if (state.status === "idle") state.status = "paused";
    advanceWorkflow();
    if (state.status === "running") state.status = "paused";
    renderWorkflow();
  });
  workflowReset.addEventListener("click", () => {
    resetWorkflow(currentWorkflowState());
    renderWorkflow();
  });
  workflowInteraction.addEventListener("input", (event) => {
    const state = currentWorkflowState();
    if (event.target.id === "workflow-video-description") state.description = event.target.value;
    if (event.target.id === "workflow-video-feedback") state.revisionFeedback = event.target.value;
  });
  workflowInteraction.addEventListener("change", (event) => {
    if (event.target.id === "workflow-video-input-type") {
      currentWorkflowState().inputType = event.target.value;
      renderWorkflow();
    }
    if (event.target.id === "workflow-watchdog-scenario") {
      const state = currentWorkflowState();
      const scenario = event.target.value;
      resetWorkflow(state);
      state.scenario = scenario;
      renderWorkflow();
    }
  });
  workflowInteraction.addEventListener("click", (event) => {
    const action = event.target.closest("[data-workflow-action]")?.dataset.workflowAction;
    if (!action) return;
    if (action === "approve") {
      continueWithDecision("approved");
      return;
    }
    if (action === "reject") {
      continueWithDecision("rejected");
      return;
    }
    if (action === "revise") {
      const state = currentWorkflowState();
      if (state.status !== "waiting" || !state.revisionFeedback.trim()) {
        workflowStatus.textContent = "Revision feedback · Add a note before requesting a revision.";
        workflowInteraction.querySelector("#workflow-video-feedback")?.focus();
        return;
      }
      clearWorkflowTimer();
      state.revisionCount += 1;
      state.completed = new Set([...state.completed].filter((index) => index < 3));
      state.currentStep = 2;
      state.selectedNode = 3;
      state.decision = null;
      state.status = "running";
      advanceWorkflow();
      if (state.status === "running") playbackTimer = window.setInterval(advanceWorkflow, 850);
      return;
    }
    if (action === "watchdog-trigger") {
      const state = currentWorkflowState();
      resetWorkflow(state);
      startWorkflowPlayback();
    }
  });
  workflowReset.addEventListener("click", () => {
    const state = currentWorkflowState();
    if (activeWorkflow === "video") {
      state.revisionFeedback = "";
      state.revisionCount = 0;
    }
    renderWorkflow();
  }, { once: true });
  renderWorkflow();
}

document.querySelector("#contact-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const subject = encodeURIComponent(String(data.get("subject")).trim());
  const body = encodeURIComponent(
    `Name: ${String(data.get("name")).trim()}\nEmail: ${String(data.get("email")).trim()}\n\n${String(data.get("message")).trim()}`,
  );
  window.location.href = `mailto:narianhylekenneth@gmail.com?subject=${subject}&body=${body}`;
});

const localTime = document.querySelector("#local-time");
function updateLocalTime() {
  const time = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
  localTime.textContent = `BULACAN, PH · ${time} PHT`;
}
updateLocalTime();
window.setInterval(updateLocalTime, 60_000);

const isparkVideo = document.querySelector("#ispark-video");
const isparkVideoPlay = document.querySelector("#ispark-video-play");
const isparkVideoStatus = document.querySelector("#ispark-video-status");

isparkVideoPlay.addEventListener("click", () => {
  isparkVideoPlay.disabled = true;
  isparkVideoStatus.textContent = "Loading the prototype video.";
  if (!isparkVideo.getAttribute("src")) {
    isparkVideo.src = isparkVideo.dataset.src;
    isparkVideo.load();
  }
  isparkVideo.play().catch((error) => {
    console.error("The iSPARK prototype video could not be played.", error);
    isparkVideoStatus.textContent = "Playback could not start. Use the player controls to try again.";
    isparkVideoPlay.disabled = false;
  });
});

isparkVideo.addEventListener("playing", () => {
  isparkVideoStatus.textContent = "";
  isparkVideoPlay.hidden = true;
  isparkVideoPlay.disabled = false;
});

isparkVideo.addEventListener("ended", () => {
  isparkVideoPlay.hidden = false;
  isparkVideoPlay.disabled = false;
  isparkVideoPlay.setAttribute("aria-label", "Replay the supplied feeder assembly prototype video");
  isparkVideoPlay.querySelector("span").textContent = "Replay prototype";
});

isparkVideo.addEventListener("error", () => {
  isparkVideoStatus.textContent = "The prototype video could not be loaded. Check the media file and try again.";
  isparkVideoPlay.hidden = false;
  isparkVideoPlay.disabled = false;
});

const isparkImageOpen = document.querySelector("#ispark-image-open");
const isparkLightbox = document.querySelector("#ispark-lightbox");
const isparkLightboxClose = document.querySelector("#ispark-lightbox-close");

isparkImageOpen.addEventListener("click", () => {
  isparkLightbox.showModal();
});

isparkLightboxClose.addEventListener("click", () => {
  isparkLightbox.close();
});

isparkLightbox.addEventListener("click", (event) => {
  if (event.target === isparkLightbox) isparkLightbox.close();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && isparkLightbox.open) {
    isparkLightbox.close();
  }
});
