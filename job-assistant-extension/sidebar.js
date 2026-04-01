// Sidebar logic for Job Application Assistant

(function() {
  'use strict';

  // State
  let materials = [];
  let groups = [];
  let settings = { dateFormat: 'YYYY-MM-DD' };
  let editingMaterialId = null;
  let editingGroupId = null;
  let draggedItem = null;
  let draggedGroup = null; // For group dragging

  // DOM Elements
  const groupsContainer = document.getElementById('groups-container');
  const emptyState = document.getElementById('empty-state');
  const closeSidebarBtn = document.getElementById('close-sidebar');
  const addGroupBtn = document.getElementById('add-group');
  const dateFormatSelect = document.getElementById('date-format');

  // Classification regex patterns
  const patterns = {
    date: /^\d{4}[\-\/]\d{2}[\-\/]\d{2}$|^\d{4}[\-\/]\d{2}$/,
    phone: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  };

  // Initialize
  async function init() {
    await loadData();
    render();
    setupEventListeners();
    // Set initial date format selection
    if (dateFormatSelect) {
      dateFormatSelect.value = settings.dateFormat;
    }
    // Apply translations
    applyTranslations();

    // Listen for storage changes from other tabs/sidebar instances
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local') return;

      let needsRerender = false;

      // Update materials if changed elsewhere
      if (changes.materials) {
        materials = changes.materials.newValue || [];
        needsRerender = true;
      }

      // Update groups if changed elsewhere
      if (changes.groups) {
        groups = changes.groups.newValue || [];
        needsRerender = true;
      }

      // Update settings if changed elsewhere
      if (changes.settings) {
        settings = changes.settings.newValue || { dateFormat: 'YYYY-MM-DD' };
        needsRerender = true;
        // Update date format display
        const dateFormatText = document.getElementById('date-format-text');
        if (dateFormatText) {
          dateFormatText.textContent = settings.dateFormat;
        }
      }

      // If a modal is open, check if the item being edited still exists
      if (editingMaterialId !== null) {
        const materialExists = materials.some(m => m.id === editingMaterialId);
        if (!materialExists) {
          alert(t('materialDeletedElsewhere'));
          closeModals();
          needsRerender = true;
        }
      }

      if (editingGroupId !== null) {
        const groupExists = groups.some(g => g.id === editingGroupId);
        if (!groupExists) {
          alert(t('groupDeletedElsewhere'));
          closeModals();
          needsRerender = true;
        }
      }

      // Re-render if no modal is open, or if we just closed one due to deletion
      if (needsRerender && editingMaterialId === null && editingGroupId === null) {
        render();
      }
    });
  }

  // Load data from storage
  async function loadData() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getMaterials' }, (result) => {
        materials = result.materials || [];
        groups = result.groups || [];
        resolve();
      });

      chrome.runtime.sendMessage({ action: 'getSettings' }, (result) => {
        if (result) {
          settings = result;
        }
      });

      // Load language preference
      chrome.storage.local.get(['language'], (result) => {
        if (result.language) {
          setLanguage(result.language);
        } else {
          // Auto-detect based on browser language
          const browserLang = navigator.language || navigator.userLanguage || 'en';
          const lang = browserLang.startsWith('zh') ? 'zh' : 'en';
          setLanguage(lang);
        }
      });
    });
  }

  // Save data to storage
  function saveData() {
    chrome.runtime.sendMessage({
      action: 'saveMaterials',
      materials,
      groups
    });
  }

  // Save settings
  function saveSettings() {
    chrome.runtime.sendMessage({
      action: 'saveSettings',
      settings
    });
  }

  // Classify content type
  function classifyContent(content) {
    if (patterns.date.test(content)) return 'date';
    if (patterns.email.test(content)) return 'email';
    if (patterns.phone.test(content)) return 'phone';
    return 'text';
  }

  // Format date according to current setting
  function formatDate(content) {
    // Parse the original date components
    const parts = content.match(/^(\d{4})(?:[\-\/](\d{2}))?(?:[\-\/](\d{2}))?$/);

    if (!parts) {
      return content;
    }

    const year = parts[1];
    const month = parts[2] || '01';
    const day = parts[3] || '01';

    // Build the output based on selected format
    switch (settings.dateFormat) {
      case 'YYYY':
        return year;
      case 'YYYY-MM':
        return `${year}-${month}`;
      case 'YYYY-MM-DD':
      default:
        return `${year}-${month}-${day}`;
    }
  }

  // Apply translations to static elements
  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = t(key);
    });
  }

  // Render groups and materials
  function render() {
    if (groups.length === 0 && materials.length === 0) {
      groupsContainer.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    groupsContainer.innerHTML = '';

    // Render each group
    groups.forEach(group => {
      const groupMaterials = materials.filter(m => m.groupId === group.id);
      const groupEl = createGroupElement(group, groupMaterials);
      groupsContainer.appendChild(groupEl);
    });

    // Render uncategorized materials
    const uncategorized = materials.filter(m => !m.groupId);
    if (uncategorized.length > 0) {
      const uncategorizedGroup = {
        id: null,
        name: t('uncategorized'),
        collapsed: false
      };
      const groupEl = createGroupElement(uncategorizedGroup, uncategorized, true);
      groupsContainer.appendChild(groupEl);
    }
  }

  // Create group element
  function createGroupElement(group, groupMaterials, isUncategorized = false) {
    const groupEl = document.createElement('div');
    groupEl.className = 'group';
    groupEl.dataset.groupId = group.id || 'uncategorized';

    const collapsed = group.collapsed ? 'collapsed' : '';
    const toggleClass = group.collapsed ? 'collapsed' : '';

    groupEl.className = 'group';
    groupEl.dataset.groupId = group.id || 'uncategorized';
    groupEl.draggable = !isUncategorized;

    groupEl.innerHTML = `
      <div class="group-header ${collapsed}">
        <span class="group-toggle ${toggleClass}">
          <span class="icon-chevron"></span>
        </span>
        <span class="group-title">${escapeHtml(group.name)}</span>
        <span class="group-count">${groupMaterials.length}</span>
        ${!isUncategorized ? `
          <div class="group-actions">
            <button class="group-action-btn add-material" title="${t('addMaterial')}">
              <span class="icon-plus"></span>
            </button>
            <button class="group-action-btn edit-group" title="${t('editGroup')}">
              <span class="icon-edit"></span>
            </button>
            <button class="group-action-btn delete-group" title="${t('deleteGroup')}">
              <span class="icon-trash"></span>
            </button>
          </div>
        ` : ''}
      </div>
      <div class="materials-list ${group.collapsed ? 'hidden' : ''}">
        ${groupMaterials.map(material => createMaterialHtml(material)).join('')}
        ${!isUncategorized ? `
          <div class="add-material-footer">
            <button class="btn btn-sm btn-primary add-material-btn">+ ${t('addMaterial')}</button>
          </div>
        ` : ''}
      </div>
    `;

    // Event listeners for group
    const header = groupEl.querySelector('.group-header');
    header.addEventListener('click', (e) => {
      if (e.target.closest('.group-actions') || e.target.closest('.group-action-btn')) return;
      toggleGroup(group.id);
    });

    if (!isUncategorized) {
      const editBtn = groupEl.querySelector('.edit-group');
      const deleteBtn = groupEl.querySelector('.delete-group');
      const addMaterialBtn = groupEl.querySelector('.add-material');
      const addMaterialFooterBtn = groupEl.querySelector('.add-material-btn');

      if (addMaterialBtn) {
        addMaterialBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openMaterialModal(null, group.id);
        });
      }

      if (addMaterialFooterBtn) {
        addMaterialFooterBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openMaterialModal(null, group.id);
        });
      }

      editBtn.addEventListener('click', () => openGroupModal(group.id));
      deleteBtn.addEventListener('click', () => deleteGroup(group.id));
    }

    // Event listeners for materials
    const materialsList = groupEl.querySelector('.materials-list');
    const materialItems = materialsList.querySelectorAll('.material-item');

    materialItems.forEach(item => {
      setupMaterialItemEvents(item);
    });

    // Allow dropping on the group itself to move material to this group
    if (!isUncategorized) {
      materialsList.addEventListener('dragover', (e) => {
        // Only allow if dragging a material (not from outside)
        if (draggedItem) {
          e.preventDefault();
          materialsList.classList.add('drag-over');
        }
      });

      materialsList.addEventListener('dragleave', () => {
        materialsList.classList.remove('drag-over');
      });

      materialsList.addEventListener('drop', (e) => {
        e.preventDefault();
        materialsList.classList.remove('drag-over');
        if (draggedItem && draggedItem.groupId !== group.id) {
          // Move material to this group
          draggedItem.groupId = group.id;
          saveData();
          render();
        }
      });
    }

    // Group drag and drop (only for real groups, not uncategorized)
    if (!isUncategorized) {
      groupEl.addEventListener('dragstart', (e) => {
        draggedGroup = group;
        groupEl.classList.add('group-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', group.id);
      });

      groupEl.addEventListener('dragend', () => {
        groupEl.classList.remove('group-dragging');
        draggedGroup = null;
        document.querySelectorAll('.group.group-drag-over').forEach(el => {
          el.classList.remove('group-drag-over');
        });
      });

      groupEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (draggedGroup && draggedGroup.id !== group.id) {
          groupEl.classList.add('group-drag-over');
        }
      });

      groupEl.addEventListener('dragleave', () => {
        groupEl.classList.remove('group-drag-over');
      });

      groupEl.addEventListener('drop', (e) => {
        e.preventDefault();
        groupEl.classList.remove('group-drag-over');
        if (draggedGroup && draggedGroup.id !== group.id) {
          reorderGroups(draggedGroup.id, group.id);
        }
      });
    }

    return groupEl;
  }

  // Translate detected type
  function translateType(type) {
    switch (type) {
      case 'date': return t('typeDate');
      case 'phone': return t('typePhone');
      case 'email': return t('typeEmail');
      default: return t('typeText');
    }
  }

  // Create material HTML
  function createMaterialHtml(material) {
    const type = material.type || classifyContent(material.content);
    // Always display original content in the panel (never format for display)
    const displayContent = material.content;
    const translatedType = translateType(type);

    return `
      <div class="material-item" draggable="true" data-id="${material.id}">
        ${material.label ? `<div class="material-label">${escapeHtml(material.label)}</div>` : ''}
        <div class="material-content">${escapeHtml(displayContent)}</div>
        <span class="material-type ${type}">${translatedType}</span>
        <div class="material-actions">
          <button class="material-action-btn edit-material" title="${t('editMaterial')}">
            <span class="icon-edit"></span>
          </button>
          <button class="material-action-btn delete-material" title="${t('deleteMaterial')}">
            <span class="icon-trash"></span>
          </button>
        </div>
      </div>
    `;
  }

  // Setup material item events
  function setupMaterialItemEvents(item) {
    const id = item.dataset.id;
    const material = materials.find(m => m.id === id);

    if (!material) return;

    // Click to insert
    item.addEventListener('click', (e) => {
      if (e.target.closest('.material-actions') || e.target.closest('.material-action-btn')) return;
      insertMaterial(material);
    });

    // Edit button
    const editBtn = item.querySelector('.edit-material');
    editBtn.addEventListener('click', () => openMaterialModal(id));

    // Delete button
    const deleteBtn = item.querySelector('.delete-material');
    deleteBtn.addEventListener('click', () => deleteMaterial(id));

    // Drag events
    item.addEventListener('dragstart', (e) => {
      draggedItem = material;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'copy';
      // For date materials, apply formatting before drag
      const dragContent = material.type === 'date' ? formatDate(material.content) : material.content;
      e.dataTransfer.setData('text/plain', dragContent);
      // Notify content script that drag started
      window.parent.postMessage({
        action: 'dragStart',
        text: dragContent
      }, '*');
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      draggedItem = null;
      document.querySelectorAll('.material-item.drag-over').forEach(el => {
        el.classList.remove('drag-over');
      });
      // Notify content script that drag ended
      window.parent.postMessage({
        action: 'dragEnd'
      }, '*');
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (draggedItem && draggedItem.id !== id) {
        item.classList.add('drag-over');
      }
    });

    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over');
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.classList.remove('drag-over');
      if (draggedItem && draggedItem.id !== id) {
        reorderMaterials(draggedItem.id, id);
      }
    });
  }

  // Toggle group collapse state
  function toggleGroup(groupId) {
    if (groupId) {
      const group = groups.find(g => g.id === groupId);
      if (group) {
        group.collapsed = !group.collapsed;
        saveData();
        render();
      }
    }
  }

  // Insert material into active field
  function insertMaterial(material) {
    const content = material.type === 'date' ? formatDate(material.content) : material.content;
    // Use postMessage to communicate directly with content script
    window.parent.postMessage({
      action: 'insertText',
      text: content
    }, '*');
  }

  // Reorder materials and change group
  function reorderMaterials(draggedId, targetId) {
    const draggedMaterial = materials.find(m => m.id === draggedId);
    const targetMaterial = materials.find(m => m.id === targetId);

    if (!draggedMaterial || !targetMaterial) return;

    // If different groups, change the dragged material's group
    if (draggedMaterial.groupId !== targetMaterial.groupId) {
      draggedMaterial.groupId = targetMaterial.groupId;
    }

    // Reorder within the array
    const draggedIndex = materials.findIndex(m => m.id === draggedId);
    const targetIndex = materials.findIndex(m => m.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [removed] = materials.splice(draggedIndex, 1);
    materials.splice(targetIndex, 0, removed);

    saveData();
    render();
  }

  // Reorder groups
  function reorderGroups(draggedId, targetId) {
    const draggedIndex = groups.findIndex(g => g.id === draggedId);
    const targetIndex = groups.findIndex(g => g.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [removed] = groups.splice(draggedIndex, 1);
    groups.splice(targetIndex, 0, removed);

    saveData();
    render();
  }

  // Delete material
  function deleteMaterial(id) {
    if (confirm(t('confirmDeleteMaterial'))) {
      materials = materials.filter(m => m.id !== id);
      saveData();
      render();
    }
  }

  // Delete group
  function deleteGroup(id) {
    if (confirm(t('confirmDeleteGroup'))) {
      groups = groups.filter(g => g.id !== id);
      materials.forEach(m => {
        if (m.groupId === id) {
          m.groupId = null;
        }
      });
      saveData();
      render();
    }
  }

  // Open material modal
  function openMaterialModal(materialId = null, defaultGroupId = null) {
    editingMaterialId = materialId;
    const modal = document.getElementById('material-modal');
    const title = document.getElementById('modal-title');
    const labelInput = document.getElementById('material-label');
    const contentInput = document.getElementById('material-content');
    const groupSelect = document.getElementById('material-group');
    const deleteBtn = document.getElementById('delete-material');
    const detectedTypeEl = document.getElementById('detected-type');

    // Populate group select
    groupSelect.innerHTML = `
      <option value="">${t('uncategorizedOption')}</option>
      ${groups.map(g => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join('')}
    `;

    if (materialId) {
      const material = materials.find(m => m.id === materialId);
      title.textContent = t('editMaterialTitle');
      labelInput.value = material.label || '';
      contentInput.value = material.content;
      groupSelect.value = material.groupId || '';
      deleteBtn.classList.remove('hidden');
      detectedTypeEl.textContent = translateType(material.type || classifyContent(material.content));
    } else {
      title.textContent = t('newMaterial');
      labelInput.value = '';
      contentInput.value = '';
      // Set default group if opening from a group
      groupSelect.value = defaultGroupId || '';
      deleteBtn.classList.add('hidden');
      detectedTypeEl.textContent = t('typeText');
    }

    modal.classList.remove('hidden');

    // Auto-detect type on content change
    contentInput.oninput = () => {
      const type = classifyContent(contentInput.value);
      detectedTypeEl.textContent = translateType(type);
    };

    // Keyboard event: Enter to save
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveMaterial();
      }
    };

    contentInput.addEventListener('keydown', handleKeyDown);
    labelInput.addEventListener('keydown', handleKeyDown);

    // Remove listener after modal closes
    const originalCloseModals = closeModals;
    closeModals = () => {
      contentInput.removeEventListener('keydown', handleKeyDown);
      labelInput.removeEventListener('keydown', handleKeyDown);
      originalCloseModals();
      closeModals = originalCloseModals;
    };
  }

  // Save material from modal
  function saveMaterial() {
    const label = document.getElementById('material-label').value.trim();
    const content = document.getElementById('material-content').value;
    const groupId = document.getElementById('material-group').value || null;

    if (!content.trim()) {
      alert(t('contentRequired'));
      return;
    }

    const type = classifyContent(content);

    if (editingMaterialId) {
      const material = materials.find(m => m.id === editingMaterialId);
      material.label = label;
      material.content = content;
      material.groupId = groupId;
      material.type = type;
    } else {
      materials.push({
        id: Date.now().toString(),
        label,
        content,
        groupId,
        type,
        createdAt: Date.now()
      });
    }

    saveData();
    render();
    closeModals();
  }

  // Open group modal
  function openGroupModal(groupId = null) {
    editingGroupId = groupId;
    const modal = document.getElementById('group-modal');
    const title = document.getElementById('group-modal-title');
    const nameInput = document.getElementById('group-name');
    const deleteBtn = document.getElementById('delete-group');

    if (groupId) {
      const group = groups.find(g => g.id === groupId);
      title.textContent = t('editGroupTitle');
      nameInput.value = group.name;
      deleteBtn.classList.remove('hidden');
    } else {
      title.textContent = t('newGroupTitle');
      nameInput.value = '';
      deleteBtn.classList.add('hidden');
    }

    modal.classList.remove('hidden');

    // Keyboard event: Enter to save
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveGroup();
      }
    };

    nameInput.addEventListener('keydown', handleKeyDown);

    // Remove listener after modal closes
    const originalCloseModals = closeModals;
    closeModals = () => {
      nameInput.removeEventListener('keydown', handleKeyDown);
      originalCloseModals();
      closeModals = originalCloseModals;
    };
  }

  // Save group from modal
  function saveGroup() {
    const name = document.getElementById('group-name').value.trim();

    if (!name) {
      alert(t('groupNameRequired'));
      return;
    }

    if (editingGroupId) {
      const group = groups.find(g => g.id === editingGroupId);
      group.name = name;
    } else {
      groups.push({
        id: Date.now().toString(),
        name,
        collapsed: false
      });
    }

    saveData();
    render();
    closeModals();
  }

  // Close all modals
  function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.add('hidden');
    });
    editingMaterialId = null;
    editingGroupId = null;
  }

  // Handle date format change
  function handleDateFormatChange() {
    settings.dateFormat = dateFormatSelect.value;
    saveSettings();
    // Only need to save settings - no need to re-render because
    // requirements state panel should keep showing original content
    // So we don't call render()
  }

  // Escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Setup event listeners
  function setupEventListeners() {
    // Close sidebar - use postMessage directly to content script
    closeSidebarBtn.addEventListener('click', () => {
      window.parent.postMessage({ action: 'closeSidebar' }, '*');
    });

    // Add buttons - global one removed, now handled per group
    addGroupBtn.addEventListener('click', () => openGroupModal());

    // Date format selection
    dateFormatSelect.addEventListener('change', handleDateFormatChange);

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', closeModals);
    });

    // Modal overlays
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', closeModals);
    });

    // Save buttons
    document.getElementById('save-material').addEventListener('click', saveMaterial);
    document.getElementById('save-group').addEventListener('click', saveGroup);

    // Delete buttons
    document.getElementById('delete-material').addEventListener('click', () => {
      if (editingMaterialId) {
        deleteMaterial(editingMaterialId);
        closeModals();
      }
    });

    document.getElementById('delete-group').addEventListener('click', () => {
      if (editingGroupId) {
        deleteGroup(editingGroupId);
        closeModals();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModals();
      }
    });
  }

  // Initialize on load
  init();
})();
