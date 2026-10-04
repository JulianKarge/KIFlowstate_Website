/* Resource voting uses the site's existing GoatCounter event endpoint.
 * Results: vote-<pollId>-yes / vote-<pollId>-no in the GoatCounter dashboard.
 * One successful vote per browser; this is an interest poll, not a verified ballot.
 */
(() => {
  const states = new Map();
  const prefix = "kif_resource_vote:";
  const text = (de, en) => document.documentElement.lang === "en" ? en : de;

  const stateFor = (id) => {
    if (!states.has(id)) {
      let choice;
      try { choice = localStorage.getItem(prefix + id); } catch { /* Storage may be disabled. */ }
      states.set(id, { choice: ["yes", "no"].includes(choice) ? choice : null, pending: false, failed: false });
    }
    return states.get(id);
  };

  const refresh = () => {
    document.querySelectorAll(".resource-poll").forEach((poll) => {
      const state = stateFor(poll.dataset.pollId);
      poll.setAttribute("aria-busy", String(state.pending));
      poll.querySelectorAll("[data-poll-choice]").forEach((button) => {
        button.disabled = state.pending || !!state.choice;
        button.setAttribute("aria-pressed", String(button.dataset.pollChoice === state.choice));
      });
      const status = poll.querySelector(".resource-poll-status");
      status.textContent = state.pending
        ? text("Deine Stimme wird gesendet …", "Sending your vote …")
        : state.choice
          ? text(`Danke! Deine Stimme (${state.choice === "yes" ? "JA" : "NEIN"}) wurde übermittelt.`, `Thank you! Your vote (${state.choice === "yes" ? "YES" : "NO"}) was submitted.`)
          : state.failed
            ? text("Deine Stimme konnte nicht gesendet werden. Bitte versuche es erneut oder teile dein Interesse in den YouTube-Kommentaren mit.", "Your vote could not be sent. Please try again or share your interest in the YouTube comments.")
            : "";
      status.classList.toggle("is-error", state.failed && !state.choice);
    });
  };

  const sendVote = async (id, choice) => {
    // The async analytics script may still be loading when the visitor clicks.
    for (let attempt = 0; attempt < 40 && !window.goatcounter?.url; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const counter = window.goatcounter;
    if (!counter?.url || counter.filter()) throw new Error("Voting unavailable");
    const url = counter.url({
      path: `vote-${id}-${choice}`,
      title: `Full setup tutorial: ${choice === "yes" ? "YES" : "NO"}`,
      event: true,
      referrer: "",
    });
    if (!url) throw new Error("Missing voting endpoint");
    // GoatCounter supports a tracking pixel. Wait for its response before
    // confirming or remembering the vote; blocked/offline requests must fail.
    await new Promise((resolve, reject) => {
      const pixel = new Image();
      const done = (error) => {
        clearTimeout(timer);
        pixel.onload = pixel.onerror = null;
        error ? reject(error) : resolve();
      };
      const timer = setTimeout(() => done(new Error("Voting timed out")), 10000);
      pixel.onload = () => done();
      pixel.onerror = () => done(new Error("Voting request failed"));
      pixel.referrerPolicy = "no-referrer";
      pixel.src = url;
    });
  };

  document.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-poll-choice]");
    const poll = button?.closest(".resource-poll");
    if (!poll) return;
    const id = poll.dataset.pollId;
    const choice = button.dataset.pollChoice;
    if (!["yes", "no"].includes(choice)) return;
    const state = stateFor(id);
    if (state.pending || state.choice) return;
    state.pending = true;
    state.failed = false;
    refresh();
    try {
      await sendVote(id, choice);
      state.choice = choice;
      try { localStorage.setItem(prefix + id, choice); } catch { /* Keep the choice for this page session. */ }
    } catch {
      state.failed = true;
    } finally {
      state.pending = false;
      refresh();
    }
  });

  window.addEventListener("storage", (event) => {
    if (!event.key?.startsWith(prefix) || !["yes", "no"].includes(event.newValue)) return;
    const state = stateFor(event.key.slice(prefix.length));
    state.choice = event.newValue;
    state.failed = false;
    refresh();
  });

  window.KIResourcePoll = { refresh };
})();
