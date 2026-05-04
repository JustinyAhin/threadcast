const isHeadlessEnvironment = (): boolean => {
  if (process.platform !== "linux") return false;
  return !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY;
};

export { isHeadlessEnvironment };
