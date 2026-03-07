const KEY = "synthcrew_onboarding_done";

export function hasDoneOnboarding() {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(KEY) === "1";
}

export function setOnboardingDone() {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, "1");
}
