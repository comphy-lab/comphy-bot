"use strict";

/**
 * Determines whether the user"s platform is macOS.
 *
 * @returns {boolean} True if the current platform is macOS; otherwise, false.
 */
function isMacPlatform() {
  // First try modern User-Agent Client Hints API
  if (navigator.userAgentData?.platform?.toLowerCase() === "macos") {
    return true;
  }
  
  // Fallback to parsing userAgent string
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.includes("mac") && !userAgent.includes("iemac") && !userAgent.includes("windows");
}

/**
 * Updates UI elements to reflect the user"s platform.
 *
 * Elements with the class `.mac-theme-text` are shown and `.default-theme-text` are hidden on Mac platforms; the reverse occurs on non-Mac platforms.
 */
function updatePlatformSpecificElements() {
  const isMac = isMacPlatform();

  // Update all platform-specific text elements
  document.querySelectorAll(".default-theme-text").forEach((element) => {
    element.style.display = isMac ? "none" : "inline";
  });

  document.querySelectorAll(".mac-theme-text").forEach((element) => {
    element.style.display = isMac ? "inline" : "none";
  });
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", updatePlatformSpecificElements);

// Export functions for use in other scripts
window.isMacPlatform = isMacPlatform;
window.updatePlatformSpecificElements = updatePlatformSpecificElements;
