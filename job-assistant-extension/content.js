// Content script for Job Application Assistant
// Handles text insertion into form fields and sidebar iframe management

(function() {
  'use strict';

  let sidebarIframe = null;
  let activeElement = null;

  // Track active element (textarea or input)
  function trackActiveElement(e) {
    if (e.target && (
      e.target.tagName === 'TEXTAREA' ||
      (e.target.tagName === 'INPUT' && ['text', 'email', 'search', 'url'].includes(e.target.type))
    )) {
      activeElement = e.target;
    }
  }

  // Listen for focus events to track active input elements
  document.addEventListener('focusin', trackActiveElement, true);
  document.addEventListener('click', trackActiveElement, true);

  // Create and inject sidebar iframe
  function createSidebar() {
    if (sidebarIframe) return;

    sidebarIframe = document.createElement('iframe');
    sidebarIframe.id = 'job-assistant-sidebar';
    sidebarIframe.src = chrome.runtime.getURL('sidebar.html');
    sidebarIframe.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 350px;
      height: 100vh;
      border: none;
      box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);
      z-index: 2147483647;
      transform: translateX(100%);
      transition: transform 0.3s ease-in-out;
    `;

    document.body.appendChild(sidebarIframe);

    // Trigger animation
    requestAnimationFrame(() => {
      sidebarIframe.style.transform = 'translateX(0)';
    });

    // Notify background script
    chrome.runtime.sendMessage({ action: 'sidebarOpened' });
  }

  // Close and remove sidebar
  function closeSidebar() {
    if (!sidebarIframe) return;

    sidebarIframe.style.transform = 'translateX(100%)';

    setTimeout(() => {
      if (sidebarIframe && sidebarIframe.parentNode) {
        sidebarIframe.parentNode.removeChild(sidebarIframe);
      }
      sidebarIframe = null;
    }, 300);

    // Notify background script
    chrome.runtime.sendMessage({ action: 'sidebarClosed' });
  }

  // Insert text into active element
  function insertText(text) {
    // Try to find the currently focused element
    const element = document.activeElement;

    if (element && (
      element.tagName === 'TEXTAREA' ||
      (element.tagName === 'INPUT' && ['text', 'email', 'search', 'url'].includes(element.type))
    )) {
      const start = element.selectionStart || 0;
      const end = element.selectionEnd || 0;
      const value = element.value || '';

      // Insert text at cursor position
      element.value = value.substring(0, start) + text + value.substring(end);

      // Update cursor position
      const newCursorPos = start + text.length;
      element.selectionStart = element.selectionEnd = newCursorPos;

      // Trigger input event for any listeners
      element.dispatchEvent(new Event('input', { bubbles: true }));

      // Focus back on element
      element.focus();

      return true;
    }

    // If no active input, try to use the last tracked active element
    if (activeElement) {
      activeElement.focus();
      return insertText(text);
    }

    return false;
  }

  // Handle drag and drop
  function setupDragAndDrop() {
    // Track drag from sidebar
    let draggedText = null;

    // Listen for drag start from sidebar iframe
    window.addEventListener('message', (event) => {
      if (event.source === sidebarIframe?.contentWindow && event.data) {
        if (event.data.action === 'dragStart') {
          draggedText = event.data.text;
        } else if (event.data.action === 'dragEnd') {
          draggedText = null;
        }
      }
    });

    // Allow dropping on text inputs
    document.addEventListener('dragover', (e) => {
      const target = e.target;
      if (target && (
        target.tagName === 'TEXTAREA' ||
        (target.tagName === 'INPUT' && ['text', 'email', 'search', 'url'].includes(target.type))
      )) {
        // If we have internal drag from sidebar, prevent default and allow drop
        if (draggedText) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }
      }
    }, true);

    document.addEventListener('drop', (e) => {
      const target = e.target;
      if (target && (
        target.tagName === 'TEXTAREA' ||
        (target.tagName === 'INPUT' && ['text', 'email', 'search', 'url'].includes(target.type))
      )) {
        // If this is an internal drag from sidebar, handle it
        if (draggedText) {
          e.preventDefault();
          target.focus();
          const start = target.selectionStart || 0;
          const end = target.selectionEnd || 0;
          const value = target.value || '';

          target.value = value.substring(0, start) + draggedText + value.substring(end);
          target.dispatchEvent(new Event('input', { bubbles: true }));
          target.dispatchEvent(new Event('change', { bubbles: true }));
          draggedText = null;
        }
        // If it's external drag, the browser will handle it normally
      }
    }, true);
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
      case 'openSidebar':
        createSidebar();
        sendResponse({ success: true });
        break;

      case 'closeSidebar':
        closeSidebar();
        sendResponse({ success: true });
        break;

      case 'insertText':
        const success = insertText(request.text);
        sendResponse({ success });
        break;
    }
  });

  // Initialize drag and drop
  setupDragAndDrop();

  // Listen for messages from the sidebar iframe (postMessage)
  window.addEventListener('message', (event) => {
    // Verify the message is from our extension
    if (event.source === sidebarIframe?.contentWindow && event.data) {
      if (event.data.action === 'insertText') {
        insertText(event.data.text);
      } else if (event.data.action === 'closeSidebar') {
        closeSidebar();
      }
    }
  });

  console.log('Job Application Assistant content script loaded');
})();
