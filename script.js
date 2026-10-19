const examples = {
  parcel: "SINGPOST: Your parcel is on hold due to an unpaid delivery fee of $1.99. Pay now to avoid return: http://singpost-track.help/sg",
  singpass: "SINGPASS: Your account will be suspended in 2 hours. Verify your identity now to keep access: http://singpass-secure-login.com",
  ordinary: "Hey! Are we still on for lunch at 12.30 tomorrow? I can meet you at the cafe near the MRT. Let me know!"
};

const patterns = [
  {
    expression: /\b(?:otp|one[- ]time password|verification code|password|pin|singpass details|banking details)\b/i,
    points: 30,
    message: "Asks for a password, PIN, one-time password, or other sensitive account details."
  },
  {
    expression: /\b(?:urgent(?:ly)?|immediately|act now|within \d+ hours?|final notice|last warning|expires? today|suspended|will be blocked|account.{0,20}(?:locked|closed|suspended))\b/i,
    points: 18,
    message: "Uses urgency or a threat of account suspension to pressure you into acting quickly."
  },
  {
    expression: /\b(?:pay|payment|transfer|fee|fine|refund|claim|prize|reward|credited|delivery fee)\b/i,
    points: 12,
    message: "Mentions a payment, transfer, fee, refund, prize, or unexpected reward."
  },
  {
    expression: /\b(?:verify|validate|confirm|update)\b.{0,55}\b(?:account|identity|details|information|payment|card)\b|\b(?:account|identity|details|information|payment|card)\b.{0,55}\b(?:verify|validate|confirm|update)\b/i,
    points: 15,
    message: "Asks you to verify or update account, identity, or payment information."
  }
];

const governmentTerms = /\b(?:singpass|gov\.sg|iras|cpf board|hdb|lta|moh|mom|ica|police|government|govt)\b/i;
const shortenerHosts = new Set(["bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "rb.gy", "shorturl.at"]);
const singaporeGovernmentHosts = new Set(["gov.sg"]);
const singpostHosts = ["singpost.com", "singpost.com.sg"];

const form = document.querySelector("#analyzer-form");
const input = document.querySelector("#message-input");
const count = document.querySelector("#character-count");
const results = document.querySelector("#results");

input.addEventListener("input", () => {
  count.textContent = `${input.value.length.toLocaleString()} / 5,000`;
});

document.querySelectorAll(".example-button").forEach((button) => {
  button.addEventListener("click", () => {
    input.value = examples[button.dataset.example];
    input.dispatchEvent(new Event("input"));
    input.focus();
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = input.value.trim();
  if (!message) {
    input.focus();
    return;
  }
  showResults(analyzeMessage(message));
});

function analyzeMessage(message) {
  const signals = [];
  let score = 0;

  for (const pattern of patterns) {
    if (pattern.expression.test(message)) {
      score += pattern.points;
      signals.push(pattern.message);
    }
  }

  const urls = message.match(/(?:https?:\/\/|www\.)[^\s<>"']+/gi) ?? [];
  const hosts = urls.map(getHostname).filter(Boolean);

  if (urls.length > 0 && governmentTerms.test(message) && hosts.some((host) => !isSingaporeGovernmentHost(host))) {
    score += 28;
    signals.push("Mentions a Singapore government service but links to a domain outside the official gov.sg domain.");
  }

  if (hosts.some((host) => shortenerHosts.has(host))) {
    score += 18;
    signals.push("Uses a link shortener, which hides the website address you would visit.");
  }

  if (/\bsingpost\b/i.test(message) && hosts.length > 0 &&
      hosts.some((host) => !singpostHosts.some((officialHost) => host === officialHost || host.endsWith(`.${officialHost}`)))) {
    score += 28;
    signals.push("Mentions SingPost but links to a domain outside its recognized website domains.");
  }

  if (hosts.some((host) => singaporeGovernmentHosts.has(host) || host.endsWith(".gov.sg")) &&
      hosts.some((host) => !isSingaporeGovernmentHost(host))) {
    score += 24;
    signals.push("Mixes an official-looking gov.sg address with a different website.");
  }

  if (urls.some((url) => /^http:\/\//i.test(url))) {
    score += 10;
    signals.push("Contains a link that does not use HTTPS.");
  }

  if (hosts.some((host) => /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host))) {
    score += 20;
    signals.push("Links directly to a numeric IP address instead of a recognizable domain.");
  }

  score = Math.min(score, 100);
  return { score, signals };
}

function getHostname(value) {
  const cleaned = value.replace(/[),.!?;:]+$/, "");
  try {
    return new URL(cleaned.startsWith("www.") ? `https://${cleaned}` : cleaned).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function isSingaporeGovernmentHost(host) {
  return singaporeGovernmentHosts.has(host) || host.endsWith(".gov.sg");
}

function showResults({ score, signals }) {
  const level = score >= 55 ? "high" : score >= 20 ? "medium" : "low";
  const levels = {
    high: {
      icon: "!",
      kicker: "HIGH RISK · TAKE CARE",
      title: "This message looks suspicious.",
      summary: "Several warning signs showed up. Don’t click the links, reply, or share personal information. Verify the request through an official channel you find independently.",
      advice: "If you already shared details, contact the affected organisation using its official website or app."
    },
    medium: {
      icon: "!",
      kicker: "SOME WARNING SIGNS",
      title: "Pause and verify first.",
      summary: "We spotted signals worth checking. The message could be legitimate, but don’t use its links or contact details until you verify them independently.",
      advice: "Open the organisation’s official app or type its known website address yourself."
    },
    low: {
      icon: "✓",
      kicker: "FEW SIGNALS DETECTED",
      title: "No strong warning signs found.",
      summary: "This message didn’t match many patterns we check for. Scams can still look convincing, so stay alert—especially before clicking links or sharing information.",
      advice: "When in doubt, confirm through a separate, trusted channel."
    }
  };
  const copy = levels[level];

  results.dataset.level = level;
  document.querySelector("#result-icon").textContent = copy.icon;
  document.querySelector("#result-kicker").textContent = copy.kicker;
  document.querySelector("#result-title").textContent = copy.title;
  document.querySelector("#result-summary").textContent = copy.summary;
  document.querySelector("#result-advice").textContent = copy.advice;
  document.querySelector("#risk-score").textContent = score;
  document.querySelector("#score-bar").style.width = `${score}%`;

  const signalsWrap = document.querySelector("#signals-wrap");
  const signalsList = document.querySelector("#signals-list");
  signalsList.replaceChildren();
  for (const signal of signals) {
    const item = document.createElement("li");
    item.textContent = signal;
    signalsList.append(item);
  }
  signalsWrap.hidden = signals.length === 0;
  results.hidden = false;
  results.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
