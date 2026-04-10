import { IconHeart } from "@tabler/icons-preact";
import { useSignal } from "@preact/signals";

function getKey(): string {
  if (!self.location) {
    // Server env
    return `bk-like-button`;
  }

  const path = location.pathname + location.search;
  return `bk-like-button-${path}`;
}

function wasClicked(): boolean {
  if ("Deno" in self) {
    // Server env
    return false;
  }

  try {
    return localStorage.getItem(getKey()) == "true";
  } catch (_e) {
    // Local storage might be disabled
    return sessionStorage.getItem(getKey()) == "true";
  }
}

function setClicked() {
  try {
    localStorage.setItem(getKey(), "true");
  } catch (_e) {
    // Local storage might be disabled
    sessionStorage.setItem(getKey(), "true");
  }
}

export function LikeButton() {
  const clicked = useSignal(wasClicked());
  // Increments on each mouseenter to force icon remount, restarting the CSS animation.
  const animKey = useSignal(0);
  const hovering = useSignal(false);

  function onMouseEnter() {
    if (clicked.value) return;
    hovering.value = true;
    animKey.value += 1;
  }

  function onMouseLeave() {
    hovering.value = false;
  }

  function onClick() {
    if (clicked.value) {
      return;
    }

    clicked.value = true;
    hovering.value = false;
    setClicked();

    if ("plausible" in self) {
      const plausible = self.plausible as (event: string) => void;
      plausible("like");
    }
  }

  const isHovering = !clicked.value && hovering.value;

  const iconClass = [
    "transition-colors",
    clicked.value ? "fill-rose-400 stroke-rose-400" : "fill-transparent stroke-rose-400",
    isHovering ? "stroke-rose-500 animate-heartbeat" : "",
  ].join(" ");

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={clicked}
      class={"rounded-md bg-white dark:bg-gray-200 px-3.5 py-1.5 text-sm font-semibold" +
        " text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600" +
        " enabled:hover:bg-gray-50 flex gap-2 items-center" +
        " transition-colors enabled:cursor-pointer"}
    >
      <IconHeart key={animKey.value} size={18} class={iconClass} />
      Thank you
    </button>
  );
}
