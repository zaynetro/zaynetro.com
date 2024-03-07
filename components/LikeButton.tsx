import IconHeart from "@tabler/icons-preact/dist/esm/icons/IconHeart.js";
import { useSignal } from "@preact/signals";

function getKey() {
  if (!self.location) {
    // Server env
    return `bk-like-button`;
  }

  const path = location.pathname + location.search;
  return `bk-like-button-${path}`;
}

function wasClicked() {
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

  function onClick() {
    if (clicked.value) {
      return;
    }

    clicked.value = true;
    setClicked();

    if ("plausible" in self) {
      const plausible = self.plausible as (event: string) => void;
      plausible("like");
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={clicked}
      class={"group rounded-md bg-white dark:bg-gray-200 px-3.5 py-1.5 text-sm font-semibold" +
        " text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600" +
        " enabled:hover:bg-gray-50 flex gap-2 items-center" +
        " transition-colors enabled:cursor-pointer"}
    >
      <IconHeart
        size={18}
        class={"stroke-rose-400 group-enabled:group-hover:stroke-rose-500" +
          " group-enabled:fill-transparent group-disabled:fill-rose-400 transition-colors" +
          " group-enabled:group-hover:animate-heartbeat"}
      />
      Thank you
    </button>
  );
}
