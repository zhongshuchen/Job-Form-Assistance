// Background service worker for Job Application Assistant

// Track sidebar state per tab
const sidebarState = new Map();

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Job Application Assistant installed');

  // Initialize default storage structure
  chrome.storage.local.get(['materials', 'groups', 'settings'], (result) => {
    if (!result.materials) {
      chrome.storage.local.set({ materials: [] });
    }
    if (!result.groups) {
      chrome.storage.local.set({ groups: [] });
    }
    if (!result.settings) {
      chrome.storage.local.set({
        settings: {
          dateFormat: 'YYYY-MM-DD' // or 'YYYY-MM'
        }
      });
    }
  });
});

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  const tabId = tab.id;
  const isOpen = sidebarState.get(tabId) || false;

  // Toggle sidebar
  try {
    await chrome.tabs.sendMessage(tabId, {
      action: isOpen ? 'closeSidebar' : 'openSidebar'
    });
    sidebarState.set(tabId, !isOpen);
  } catch (error) {
    // Content script may not be loaded, inject it
    console.log('Content script not loaded, injecting...');
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });
      // Now try to open the sidebar
      await chrome.tabs.sendMessage(tabId, {
        action: 'openSidebar'
      });
      sidebarState.set(tabId, true);
    } catch (injectError) {
      console.error('Could not inject content script:', injectError);
    }
  }
});

// Listen for messages from content script or sidebar
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'sidebarClosed':
      if (sender.tab) {
        sidebarState.set(sender.tab.id, false);
      }
      break;

    case 'sidebarOpened':
      if (sender.tab) {
        sidebarState.set(sender.tab.id, true);
      }
      break;

    case 'getMaterials':
      chrome.storage.local.get(['materials', 'groups'], (result) => {
        sendResponse(result);
      });
      return true; // Keep channel open for async response

    case 'saveMaterials':
      chrome.storage.local.set({
        materials: request.materials,
        groups: request.groups
      }, () => {
        sendResponse({ success: true });
      });
      return true;

    case 'getSettings':
      chrome.storage.local.get(['settings'], (result) => {
        sendResponse(result.settings);
      });
      return true;

    case 'saveSettings':
      chrome.storage.local.set({ settings: request.settings }, () => {
        sendResponse({ success: true });
      });
      return true;

  }
});

// Clean up state when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  sidebarState.delete(tabId);
});
