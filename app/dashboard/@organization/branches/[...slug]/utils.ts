export const actions = ["view", "new", "edit"];
export const Actions = [...actions] as const;
export type Action = typeof Actions[number];