"use strict";

// Command data for website command palette
/* global Fuse, sortCoursesByDate */
(function () {
  // Initialize command data

  // Define constants
  const RECENT_COMMANDS_KEY = "recentCommands";
  
  // Define the command data (using COMMANDS as expected by tests)
  const COMMANDS = window.commandData = [
    // Navigation commands
    {
      id: "home",
      title: "Go to Home",
      handler: () => {
        window.location.href = (window.SITE_BASEURL || "") + "/";
      },
      section: "Navigation",
      icon: "<i class=\"fa-solid fa-home\"></i>",
    },
    {
      id: "team",
      title: "Go to Team Page",
      handler: () => {
        window.location.href = "https://comphy-lab.org/team/";
      },
      section: "Navigation",
      icon: "<i class=\"fa-solid fa-users\"></i>",
    },
    {
      id: "research",
      title: "Go to Research Page",
      handler: () => {
        window.location.href = "https://comphy-lab.org/research/";
      },
      section: "Navigation",
      icon: "<i class=\"fa-solid fa-flask\"></i>",
    },
    {
      id: "teaching",
      title: "Go to Teaching Page",
      handler: () => {
        window.location.href = "https://comphy-lab.org/teaching/";
      },
      section: "Navigation",
      icon: "<i class=\"fa-solid fa-chalkboard-teacher\"></i>",
    },
    {
      id: "join",
      title: "Go to Join Us Page",
      handler: () => {
        window.location.href = "https://comphy-lab.org/join";
      },
      section: "Navigation",
      icon: "<i class=\"fa-solid fa-handshake\"></i>",
    },
    {
      id: "blog",
      title: "Go to Blog",
      handler: () => {
        window.location.href = "https://blogs.comphy-lab.org/";
      },

      section: "Navigation",
      icon: "<i class=\"fa-solid fa-rss\"></i>",
    },
    {
      id: "back",
      title: "Go Back",
      handler: () => {
        window.history.back();
      },
      section: "Navigation",
      icon: "<i class=\"fa-solid fa-arrow-left\"></i>",
    },
    {
      id: "forward",
      title: "Go Forward",
      handler: () => {
        window.history.forward();
      },
      section: "Navigation",
      icon: "<i class=\"fa-solid fa-arrow-right\"></i>",
    },

    // External links
    {
      id: "github",
      title: "Visit GitHub",
      handler: () => {
        window.open("https://github.com/comphy-lab", "_blank", "noopener,noreferrer");
      },

      section: "External Links",
      icon: "<i class=\"fa-brands fa-github\"></i>",
    },
    {
      id: "scholar",
      title: "Visit Google Scholar",
      handler: () => {
        window.open(
          "https://scholar.google.com/citations?user=tHb_qZoAAAAJ&hl=en",
          "_blank",
          "noopener,noreferrer"
        );
      },

      section: "External Links",
      icon: "<i class=\"ai ai-google-scholar\"></i>",
    },
    {
      id: "youtube",
      title: "Visit YouTube Channel",
      handler: () => {
        window.open("https://www.youtube.com/@CoMPhyLab", "_blank", "noopener,noreferrer");
      },

      section: "External Links",
      icon: "<i class=\"fa-brands fa-youtube\"></i>",
    },
    {
      id: "bluesky",
      title: "Visit Bluesky",
      handler: () => {
        window.open("https://bsky.app/profile/comphy-lab.org", "_blank", "noopener,noreferrer");
      },

      section: "External Links",
      icon: "<i class=\"fa-brands fa-bluesky\"></i>",
    },

    // Tools
    {
      id: "top",
      title: "Scroll to Top",
      handler: () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      section: "Tools",
      icon: "<i class=\"fa-solid fa-arrow-up\"></i>",
    },
    {
      id: "bottom",
      title: "Scroll to Bottom",
      handler: () => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      },

      section: "Tools",
      icon: "<i class=\"fa-solid fa-arrow-down\"></i>",
    },

    // Help commands
    {
      id: "repository",
      title: "View Website Repository",
      handler: () => {
        window.open(
          "https://github.com/comphy-lab/comphy-lab.github.io",
          "_blank",
          "noopener,noreferrer"
        );
      },

      section: "Help",
      icon: "<i class=\"fa-brands fa-github\"></i>",
    },
  ];

  // Command data loaded successfully

  // Helper function to create modals with proper cleanup
  function createModal(contentHTML, modalStyles = {}, contentStyles = {}) {
    const modal = document.createElement("div");
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.backgroundColor = modalStyles.backgroundColor || "rgba(0, 0, 0, 0.7)";
    modal.style.zIndex = modalStyles.zIndex || "2000";
    modal.style.display = "flex";
    modal.style.justifyContent = "center";
    modal.style.alignItems = "center";

    const content = document.createElement("div");
    content.style.backgroundColor = contentStyles.backgroundColor || "white";
    content.style.borderRadius = contentStyles.borderRadius || "8px";
    content.style.padding = contentStyles.padding || "20px";
    content.style.maxWidth = contentStyles.maxWidth || "600px";
    content.style.maxHeight = contentStyles.maxHeight || "80vh";
    content.style.overflow = contentStyles.overflow || "auto";
    content.style.boxShadow = contentStyles.boxShadow || "0 4px 20px rgba(0, 0, 0, 0.3)";

    // Media query for dark mode
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      content.style.backgroundColor = "#333";
      content.style.color = "#fff";
    }

    content.innerHTML = contentHTML;
    modal.appendChild(content);

    // Function to close modal and cleanup
    const closeModal = () => {
      // Remove event listeners before removing the modal
      modal.removeEventListener("click", modalClickHandler);
      if (content.keydownHandler) {
        content.removeEventListener("keydown", content.keydownHandler);
      }
      document.body.removeChild(modal);
    };

    // Click outside to close handler
    const modalClickHandler = (e) => {
      if (e.target === modal) {
        closeModal();
      }
    };
    modal.addEventListener("click", modalClickHandler);

    // Store closeModal function on the modal element for external access
    modal.closeModal = closeModal;

    return { modal, content, closeModal };
  }

  // Define the displayShortcutsHelp function globally
  window.displayShortcutsHelp = function () {
    // Group commands by section
    const sections = {};
    window.commandData.forEach((command) => {
      if (!sections[command.section]) {
        sections[command.section] = [];
      }
      sections[command.section].push(command);
    });

    let html = "<h2 style=\"margin-top: 0;\">Commands</h2>";
    html += "<p>Press Ctrl+K (⌘K on Mac) to open the command palette</p>";

    // Add each section and its commands
    Object.keys(sections).forEach((section) => {
      html += `<h3>${section}</h3>`;
      html += "<table style=\"width: 100%; border-collapse: collapse;\">";
      html +=
        "<tr><th style=\"text-align: left; padding: 8px; border-bottom: 1px solid #ddd;\">Command</th></tr>";

      sections[section].forEach((command) => {
        html += `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${command.icon} ${command.title}</td>
        </tr>`;
      });

      html += "</table>";
    });

    // Add close button
    html +=
      "<div style=\"text-align: center; margin-top: 20px;\"><button id=\"close-shortcuts-help\" style=\"padding: 8px 16px; background-color: #5b79a8; color: white; border: none; border-radius: 4px; cursor: pointer;\">Close</button></div>";

    // Create modal using the helper function
    const { modal, closeModal } = createModal(html);
    document.body.appendChild(modal);

    // Add event listener to close button
    document
      .getElementById("close-shortcuts-help")
      .addEventListener("click", closeModal);
  };

  // Search database integration
  window.searchDatabaseForCommandPalette = async function (query) {
    // Only perform search if query is at least 3 characters long
    if (!query || query.length < 3) {
      return [];
    }

    // Perform search on database with query

    try {
      // Check if we have a searchIndex already loaded in window
      if (!window.searchFuse && window.searchData) {
        // If we already have search data but no Fuse object
        try {
          window.searchFuse = new Fuse(window.searchData, {
            keys: [
              { name: "title", weight: 0.7 },
              { name: "content", weight: 0.2 },
              { name: "tags", weight: 0.1 },
              { name: "categories", weight: 0.1 },
            ],
            includeScore: true,
            threshold: 0.4,
          });
        } catch (e) {
          console.error("Error creating Fuse instance:", e);
          return [];
        }
      } else if (!window.searchFuse) {
        // Try to fetch search database if it doesn"t exist yet
        try {
          const response = await fetch((window.SITE_BASEURL || "") + "/assets/js/search_db.json");
          if (response.ok) {
            try {
              const searchData = await response.json();
              if (!searchData || !Array.isArray(searchData)) {
                console.warn("Search database has invalid format");
                return [];
              }
              window.searchData = searchData;
              window.searchFuse = new Fuse(searchData, {
                keys: [
                  { name: "title", weight: 0.7 },
                  { name: "content", weight: 0.2 },
                  { name: "tags", weight: 0.1 },
                  { name: "categories", weight: 0.1 },
                ],
                includeScore: true,
                threshold: 0.4,
              });
            } catch (e) {
              console.error("Error parsing search database JSON:", e);
              return [];
            }
          } else {
            console.warn(`No search database found (${response.status})`);
            return [];
          }
        } catch (e) {
          console.error("Error loading search database:", e);
          return [];
        }
      }

      // Perform the search
      if (window.searchFuse) {
        try {
          const results = window.searchFuse.search(query);

          // Sort results by priority first, then by Fuse.js score
          // Lower priority number = higher priority (1 is highest, 5 is lowest)
          const sortedResults = results.sort((a, b) => {
            // First compare by priority
            const priorityA = a.item.priority || 5; // Default to lowest priority if not specified
            const priorityB = b.item.priority || 5;

            if (priorityA !== priorityB) {
              return priorityA - priorityB; // Lower priority number comes first
            }

            // If priorities are equal, use Fuse.js score (lower score = better match)
            return a.score - b.score;
          });

          // Return at most 5 results to avoid cluttering the command palette
          return sortedResults.slice(0, 5).map((result) => ({
            id: `search-result-${result.refIndex}`,
            title: result.item.title || "Untitled",
            handler: () => {
              if (result.item.url) {
                window.location.href = result.item.url;
              }
            },
            section: "Search Results",
            icon: "<i class=\"fa-solid fa-file-lines\"></i>",
            excerpt:
              result.item.excerpt ||
              (result.item.content &&
                result.item.content.substring(0, 100) + "...") ||
              "",
          }));
        } catch (e) {
          console.error("Error performing search with Fuse:", e);
          return [];
        }
      }
    } catch (e) {
      console.error("Error searching database:", e);
    }

    return [];
  };

  // Add page-specific command function
  window.addContextCommands = function () {
    // Check if context commands have already been added
    if (window.contextCommandsAdded) {
      return;
    }
    
    // Get the current path
    const currentPath = window.location.pathname;
    const baseurl = window.SITE_BASEURL || "";
    let contextCommands = [];

    // Research page specific commands
    if (currentPath.includes("/research")) {
      contextCommands = [
        {
          id: "filter-research",
          title: "Filter Research by Tag",
          handler: () => {
            // Collect all unique tags from the page
            const tagElements = document.querySelectorAll("tags span");
            const tags = new Set();
            tagElements.forEach((tag) => {
              tags.add(tag.textContent);
            });

            let html = "<h2 style=\"margin-top: 0;\">Filter Research by Tag</h2>";
            html +=
              "<div class=\"tag-filter-container\" style=\"display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0;\">";

            // Add clickable tag buttons
            tags.forEach((tag) => {
              html += `<button class="tag-filter-btn" style="padding: 8px 12px; background-color: #5b79a8; color: white; border: none; border-radius: 4px; cursor: pointer; margin: 5px;">${tag}</button>`;
            });

            html += "</div>";

            // Add keyboard navigation info
            html += `<div style="margin-top: 15px; font-size: 0.9em; text-align: center; color: #888;">
              <span style="margin-right: 15px;"><kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
              <span style="margin-right: 15px;"><kbd>enter</kbd> to select</span>
              <span><kbd>esc</kbd> to close</span>
            </div>`;

            // Add close button
            html +=
              "<div style=\"text-align: center; margin-top: 20px;\"><button id=\"close-tag-filter\" style=\"padding: 8px 16px; background-color: #333; color: white; border: none; border-radius: 4px; cursor: pointer;\">Close</button></div>";

            // Create modal using the helper function
            const { modal, content, closeModal } = createModal(html);
            content.setAttribute("tabindex", "-1"); // Make the content focusable for keyboard events
            document.body.appendChild(modal);

            // Get all tag buttons
            const tagButtons = content.querySelectorAll(".tag-filter-btn");
            let selectedButtonIndex = 0;

            // Function to update the visual selection
            const updateSelectedButton = (newIndex) => {
              // Remove selection from all buttons
              tagButtons.forEach((btn) => {
                btn.style.outline = "none";
                btn.style.boxShadow = "none";
              });

              // Add selection to the current button
              if (tagButtons[newIndex]) {
                tagButtons[newIndex].style.outline = "2px solid white";
                tagButtons[newIndex].style.boxShadow =
                  "0 0 5px rgba(255, 255, 255, 0.5)";

                // Make sure the selected button is visible
                tagButtons[newIndex].scrollIntoView({
                  behavior: "smooth",
                  block: "nearest",
                });
              }
            };

            // Select the first button initially
            if (tagButtons.length > 0) {
              updateSelectedButton(selectedButtonIndex);
            }

            // Add event listeners to tag buttons
            tagButtons.forEach((btn, index) => {
              // Mouse hover should update selection
              btn.addEventListener("mouseenter", () => {
                selectedButtonIndex = index;
                updateSelectedButton(selectedButtonIndex);
              });

              btn.addEventListener("click", () => {
                // Find the actual tag in the document and simulate a click on it
                const tagText = btn.textContent;
                const matchingTag = Array.from(
                  document.querySelectorAll("tags span")
                ).find((tag) => tag.textContent === tagText);

                if (matchingTag) {
                  // Close the modal using cleanup function
                  closeModal();
                  // Then trigger the click
                  matchingTag.click();
                }
              });
            });

            // Add keyboard navigation handler
            const keydownHandler = (e) => {
              const buttonRows = 4; // Approximate number of buttons per row
              const numButtons = tagButtons.length;

              if (e.key === "Escape") {
                closeModal();
              } else if (e.key === "Enter") {
                // Click the selected button
                if (tagButtons[selectedButtonIndex]) {
                  tagButtons[selectedButtonIndex].click();
                }
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                selectedButtonIndex = (selectedButtonIndex + 1) % numButtons;
                updateSelectedButton(selectedButtonIndex);
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                selectedButtonIndex =
                  (selectedButtonIndex - 1 + numButtons) % numButtons;
                updateSelectedButton(selectedButtonIndex);
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                // Move down by approximate number of buttons per row
                selectedButtonIndex = Math.min(
                  selectedButtonIndex + buttonRows,
                  numButtons - 1
                );
                updateSelectedButton(selectedButtonIndex);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                // Move up by approximate number of buttons per row
                selectedButtonIndex = Math.max(
                  selectedButtonIndex - buttonRows,
                  0
                );
                updateSelectedButton(selectedButtonIndex);
              }
            };

            // Store the keydown handler on content so it can be cleaned up
            content.keydownHandler = keydownHandler;
            content.addEventListener("keydown", keydownHandler);

            // Add event listener to close button
            document
              .getElementById("close-tag-filter")
              .addEventListener("click", closeModal);

            // Focus the content element to capture keyboard events
            content.focus();
          },
          section: "Page Actions",
          icon: "<i class=\"fa-solid fa-filter\"></i>",
        },
      ];
    }
    // Team page specific commands
    else if (currentPath.includes("/team")) {
      contextCommands = [
        {
          id: "contact-team",
          title: "Contact Team",
          handler: () => {
            window.location.href = (window.SITE_BASEURL || "") + "/join";
          },
          section: "Page Actions",
          icon: "<i class=\"fa-solid fa-envelope\"></i>",
        },
      ];
    }
    // Teaching page specific commands
    else if (currentPath.includes("/teaching")) {
      contextCommands = [
        {
          id: "sort-courses",
          title: "Sort Courses by Date",
          handler: () => {
            // Trigger sorting function if it exists
            if (typeof sortCoursesByDate === "function") {
              sortCoursesByDate();
            }
          },
          section: "Page Actions",
          icon: "<i class=\"fa-solid fa-sort\"></i>",
        },
      ];
    }

    // Add context commands if there are any
    if (contextCommands.length > 0) {
      // Filter out any existing commands with the same IDs
      const existingIds = new Set(window.commandData.map(cmd => cmd.id));
      const newCommands = contextCommands.filter(cmd => !existingIds.has(cmd.id));
      
      // Combine new context commands with global commands
      if (newCommands.length > 0) {
        window.commandData = [...newCommands, ...window.commandData];
        // Mark that context commands have been added
        window.contextCommandsAdded = true;
      }
    }
  };

  // Call addContextCommands automatically
  document.addEventListener("DOMContentLoaded", function () {
    window.addContextCommands();
  });
})();
