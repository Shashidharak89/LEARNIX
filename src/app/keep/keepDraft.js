// History belongs to one open editor. File snapshots share File objects rather than copying bytes.
const HISTORY_LIMIT = 100;

export function initialDraft({ item, kind }) {
  return {
    past: [], future: [],
    present: {
      type: item?.type || kind, title: item?.title || "", content: item?.content || "",
      url: item?.url || "", file: null,
    },
  };
}

export function editDraft(state, action) {
  const { past, present, future } = state;
  if (action.type === "undo") {
    if (!past.length) return state;
    return { past: past.slice(0, -1), present: past.at(-1), future: [present, ...future] };
  }
  if (action.type === "redo") {
    if (!future.length) return state;
    return { past: [...past, present], present: future[0], future: future.slice(1) };
  }
  if (present[action.field] === action.value) return state;
  return {
    past: [...past.slice(1 - HISTORY_LIMIT), present],
    present: { ...present, [action.field]: action.value },
    future: [],
  };
}
