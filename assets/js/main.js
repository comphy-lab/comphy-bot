/* ===================================================================
 * Main JS
 * ------------------------------------------------------------------- */

(function () {
  "use strict";

  // Store global references for cleanup
  let blueSkyObserver = null;

  /* Preloader
   * -------------------------------------------------- */
  const preloader = document.querySelector("#preloader");
  if (preloader) {
    window.addEventListener("load", function () {
      document.querySelector("body").classList.remove("ss-preload");
      document.querySelector("body").classList.add("ss-loaded");
      preloader.style.display = "none";
    });
  }

  /* Load About Content - Only on main page
   * -------------------------------------------------- */
  const loadAboutContent = async () => {
    // Only load about.md on the main page, and only when the placeholder exists.
    const baseurl = window.SITE_BASEURL || "";
    if (
      window.location.pathname === baseurl + "/" ||
      window.location.pathname === baseurl + "/index.html"
    ) {
      const aboutContent = document.getElementById("about-content");
      if (!aboutContent) {
        return;
      }

      try {
        const response = await fetch((window.SITE_BASEURL || "") + "/about.md");
        const text = await response.text();

        // Sanitize HTML output from marked.parse() with DOMPurify before inserting into DOM
        const parsedHtml = marked.parse(text);
        // Check if DOMPurify is loaded before using it
        if (typeof DOMPurify !== "undefined") {
          const sanitizedHtml = DOMPurify.sanitize(parsedHtml);
          aboutContent.innerHTML = sanitizedHtml;
        } else {
          // Fallback: insert without sanitization if DOMPurify failed to load
          console.warn("DOMPurify not loaded, inserting content without sanitization");
          aboutContent.innerHTML = parsedHtml;
        }

        // Re-setup copy buttons for dynamically loaded content
        setupCopyButtons();
      } catch (error) {
        console.error("Error loading about content:", error);
      }
    }
  };


  /* Handle Bluesky embed error
   * -------------------------------------------------- */
  window.handleBskyEmbedError = function() {
    const bskyEmbed = document.querySelector("bsky-embed");
    const bskyError = document.getElementById("bsky-error");
    
    if (bskyEmbed && bskyError) {
      bskyEmbed.style.display = "none";
      bskyError.style.display = "block";
    }
  };

  /* Match Bluesky embed height to About section
   * -------------------------------------------------- */
  const matchBlueSkyHeight = () => {
    const aboutLeft = document.querySelector(".s-about__left");
    const aboutSocial = document.querySelector(".s-about__social");
    const bskyEmbed = document.querySelector("bsky-embed");
    const bskyError = document.getElementById("bsky-error");
    const bskyContainer = document.getElementById("bluesky-embed-container");
    
    if (aboutLeft && aboutSocial && (bskyEmbed || bskyError)) {
      // Check window width for responsive behavior
      const windowWidth = window.innerWidth;
      const isMobile = windowWidth < 768;
      const isStacked = windowWidth <= 1400; // When layout switches to column
      
      // Get the active element (either bsky-embed or error container)
      const activeElement = bskyEmbed && bskyEmbed.style.display !== "none" ? bskyEmbed : bskyError;
      
      if (isMobile) {
        // On mobile, use fixed height
        aboutSocial.style.height = "500px";
        if (activeElement) {
          activeElement.style.maxHeight = "calc(100% - 60px)";
        }
      } else if (isStacked) {
        // When stacked but not mobile, don't set height - let CSS handle it
        aboutSocial.style.height = "auto";
        aboutSocial.style.minHeight = "400px";
        if (activeElement) {
          activeElement.style.maxHeight = "600px";
        }
      } else {
        // On desktop with side-by-side layout, match the about content height
        const aboutHeight = aboutLeft.offsetHeight;
        
        // Set the social container to match
        aboutSocial.style.height = aboutHeight + "px";
        
        // Calculate available height for content (subtract header height)
        const header = aboutSocial.querySelector(".s-about__social-header");
        const headerHeight = header ? header.offsetHeight : 0;
        const availableHeight = aboutHeight - headerHeight - 20; // 20px for padding
        
        // Set max-height on active element for scrolling
        if (activeElement) {
          activeElement.style.maxHeight = availableHeight + "px";
        }
        
        // Set container height if needed
        if (bskyContainer) {
          bskyContainer.style.maxHeight = availableHeight + "px";
        }
      }
      
      // Always ensure overflow is set on active element
      if (activeElement) {
        activeElement.style.overflow = "auto";
      }
    }
  };

  // Run height matching after content loads and on resize
  const setupHeightMatching = () => {
    // Add a small delay to ensure content is rendered in production
    setTimeout(() => {
      matchBlueSkyHeight();
    }, 300);
    
    // Wait for bsky-embed to load
    let embedCheckCount = 0;
    const maxChecks = 50; // 5 seconds maximum wait
    
    const waitForBskyEmbed = () => {
      const bskyEmbed = document.querySelector("bsky-embed");
      const bskyError = document.getElementById("bsky-error");
      
      embedCheckCount++;
      
      if (bskyEmbed && bskyEmbed.shadowRoot) {
        // Component is loaded successfully, apply height matching
        matchBlueSkyHeight();
        
        // Also run after a delay to ensure content is rendered
        setTimeout(matchBlueSkyHeight, 500);
        setTimeout(matchBlueSkyHeight, 1000);
      } else if (bskyError && bskyError.style.display === "block") {
        // Error state is shown, apply height matching
        matchBlueSkyHeight();
      } else if (embedCheckCount < maxChecks) {
        // Try again in 100ms
        setTimeout(waitForBskyEmbed, 100);
      } else {
        // Timeout - show error state
        console.warn("Bluesky embed failed to load after 5 seconds");
        window.handleBskyEmbedError();
        matchBlueSkyHeight();
      }
    };
    
    waitForBskyEmbed();
    
    // Match on window resize
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(matchBlueSkyHeight, 250);
    });
    
    // Watch for content changes
    blueSkyObserver = new MutationObserver(() => {
      setTimeout(matchBlueSkyHeight, 100);
    });
    
    const aboutContentElement = document.getElementById("about-content");
    if (aboutContentElement) {
      blueSkyObserver.observe(aboutContentElement, { childList: true, subtree: true });
    }
  };

  // Load about content when page loads
  window.addEventListener("load", () => {
    loadAboutContent();
    setupHeightMatching();
  });

  /* Mobile Menu
   * -------------------------------------------------- */
  const ssMobileMenu = () => {
    const menuToggle = document.querySelector(".s-header__menu-toggle");
    const nav = document.querySelector(".s-header__nav");
    const closeBtn = document.querySelector(".s-header__nav-close-btn");
    const menuLinks = document.querySelectorAll(".s-header__nav-list a");

    // Handle click outside
    document.addEventListener("click", function (e) {
      if (nav && nav.classList.contains("is-active")) {
        // Check if click is outside nav and not on menu toggle
        if (!nav.contains(e.target) && !menuToggle.contains(e.target)) {
          nav.classList.remove("is-active");
        }
      }
    });

    if (menuToggle) {
      menuToggle.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation(); // Prevent document click from immediately closing
        nav.classList.add("is-active");
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", function (e) {
        e.preventDefault();
        nav.classList.remove("is-active");
      });
    }

    menuLinks.forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-active");
      });
    });
  };
  
  // Initialize mobile menu
  ssMobileMenu();

  /* Smooth Scrolling
   * -------------------------------------------------- */
  const setupSmoothScrolling = () => {
    // Handle all smooth scroll links
    const baseurl = window.SITE_BASEURL || "";
    document.querySelectorAll("a.smoothscroll, a[href^=\"#\"], a[href^=\"" + baseurl + "/#\"]").forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        const href = this.getAttribute("href");
        
        // Handle links with /#section format
        const baseurl = window.SITE_BASEURL || "";
        if (href.startsWith(baseurl + "/#")) {
          e.preventDefault();
          const targetId = href.substring(baseurl.length + 2); // Remove baseurl/#
          const target = document.getElementById(targetId);
          
          if (target) {
            // Calculate offset for header
            const headerHeight = document.querySelector(".s-header").offsetHeight;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
            
            // Smooth scroll with custom duration
            window.scrollTo({
              top: targetPosition,
              behavior: "smooth"
            });
            
            // Update URL without jumping
            history.pushState(null, null, href);
          }
        } 
        // Handle regular #section links
        else if (href.startsWith("#") && href !== "#" && href !== "#0") {
          e.preventDefault();
          const target = document.querySelector(href);
          
          if (target) {
            const headerHeight = document.querySelector(".s-header").offsetHeight;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
            
            window.scrollTo({
              top: targetPosition,
              behavior: "smooth"
            });
          }
        }
      });
    });
  };
  
  // Initialize smooth scrolling
  setupSmoothScrolling();

  /* Back to Top
   * -------------------------------------------------- */
  const ssBackToTop = () => {
    const goTop = document.querySelector(".ss-go-top");

    if (goTop) {
      window.addEventListener("scroll", function () {
        if (window.pageYOffset > 800) {
          goTop.classList.add("link-is-visible");
        } else {
          goTop.classList.remove("link-is-visible");
        }
      });
    }
  };
  
  // Initialize back to top
  ssBackToTop();

  /* Copy Email Functionality Setup
   * -------------------------------------------------- */
  const setupCopyButtons = () => {
    const copyButtons = document.querySelectorAll(".copy-btn");
    
    copyButtons.forEach((button) => {
      // Remove any existing event listeners to prevent duplicates
      button.removeEventListener("click", handleCopyClick);
      
      // Add new click event listener
      button.addEventListener("click", handleCopyClick);
      
      // Set up accessibility attributes
      const emailText = button.getAttribute("data-text") || button.getAttribute("data-clipboard-text");
      if (!button.hasAttribute("aria-label") && emailText) {
        button.setAttribute("aria-label", `Copy email address ${emailText}`);
      }
    });
  };

  const handleCopyClick = async (event) => {
    const button = event.target.closest(".copy-btn");
    if (!button) return;
    
    const text = button.getAttribute("data-text") || button.getAttribute("data-clipboard-text");
    
    if (!text) {
      console.error("No text to copy");
      return;
    }

    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        showCopyFeedback(button);
      } else {
        // Fallback to execCommand
        fallbackCopy(text, button);
      }
    } catch (err) {
      console.warn("Clipboard API failed, trying fallback:", err);
      fallbackCopy(text, button);
    }
  };

  const fallbackCopy = (text, button) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    
    try {
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      
      const successful = document.execCommand("copy");
      if (successful) {
        showCopyFeedback(button);
      } else {
        console.error("Copy command failed");
      }
    } catch (err) {
      console.error("Fallback copy failed:", err);
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const showCopyFeedback = (button) => {
    const icon = button.querySelector("i");
    button.classList.add("copied");
    
    if (icon) {
      icon.classList.remove("fa-copy");
      icon.classList.add("fa-check");
    }
    
    setTimeout(() => {
      button.classList.remove("copied");
      if (icon) {
        icon.classList.remove("fa-check");
        icon.classList.add("fa-copy");
      }
    }, 2000);
  };

  document.addEventListener("DOMContentLoaded", function () {
    const images = document.querySelectorAll(
      ".member-image img[loading=\"lazy\"]",
    );

    images.forEach((img) => {
      if (img.complete) {
        img.parentElement.classList.add("loaded");
      } else {
        img.addEventListener("load", function () {
          img.parentElement.classList.add("loaded");
        });
      }
    });

    // Set up copy buttons for static content
    setupCopyButtons();
  });

  // Keep backwards compatibility
  window.copyEmail = handleCopyClick;

  // Cleanup function for when page unloads
  window.addEventListener("beforeunload", function() {
    // Disconnect MutationObserver to prevent memory leak
    if (blueSkyObserver) {
      blueSkyObserver.disconnect();
      blueSkyObserver = null;
    }
  });

})(document.documentElement);
