import path from "path";

export function getUploadRoot() {
  const configuredRoot = process.env.UPLOAD_DIR;

  if (process.env.VERCEL) {
    if (!configuredRoot) return "/tmp/viola-uploads";
    if (path.isAbsolute(configuredRoot)) return configuredRoot;

    const safeRelativeRoot = configuredRoot.replace(/^\.?[\\/]/, "");
    return path.join("/tmp", safeRelativeRoot || "viola-uploads");
  }

  if (configuredRoot) {
    return path.isAbsolute(configuredRoot)
      ? configuredRoot
      : path.resolve(process.cwd(), configuredRoot);
  }

  if (process.env.VERCEL) {
    return "/tmp/viola-uploads";
  }

  return path.resolve(process.cwd(), "./storage/uploads");
}
