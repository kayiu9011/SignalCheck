# SignalCheck

SignalCheck is a small, privacy-first web app that helps people learn to spot common phishing warning signs in text messages and emails. It is designed as a Singapore-focused student portfolio project.

## Run it

Open `index.html` in a modern web browser. No build step, server, account, or third-party JavaScript dependency is required.

## How it works

Paste a message or choose one of the examples. SignalCheck checks the text in your browser for patterns such as requests for passwords or one-time passwords, urgency, payment requests, shortened links, and suspicious links accompanying references to Singapore government services or SingPost. It displays the matching signals and an explainable risk score.

The checker does not upload or store messages, contact a security service, or use an AI model. Its rules are educational heuristics, not a definitive scam detector: a low score does not mean a message is safe. Always verify unexpected requests through official channels. In Singapore, visit [ScamShield](https://www.scamshield.gov.sg/) or call the ScamShield Helpline at 1799 for advice.

## Project files

- `index.html` - accessible page structure and example messages
- `styles.css` - responsive visual design
- `script.js` - client-side message analysis and results

## Ideas to extend

- Add a small test suite with benign and suspicious message examples.
- Support pasted email sender addresses and explain domain mismatches.
- Add a feedback-driven evaluation set and measure false-positive and false-negative rates.
- Explore a carefully evaluated machine-learning classifier while keeping message processing local.
