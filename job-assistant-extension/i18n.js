// i18n translations for Job Application Assistant
const i18n = {
  en: {
    // Header
    appTitle: 'Application Form Assistant',
    close: 'Close',

    // Toolbar
    newGroup: 'New Group',
    dateFormat: 'Pasted Date By:',

    // Empty state
    emptyState: 'No materials yet. Create your first group and material!',

    // Group
    uncategorized: 'Uncategorized',
    editGroup: 'Edit',
    deleteGroup: 'Delete',
    addMaterial: 'Add Material',

    // Material
    editMaterial: 'Edit',
    deleteMaterial: 'Delete',

    // Modal titles
    newMaterial: 'New Material',
    editMaterialTitle: 'Edit Material',
    newGroupTitle: 'New Group',
    editGroupTitle: 'Edit Group',

    // Form labels
    label: 'Label (optional)',
    labelHelp: 'Shown as small text at top-left',
    content: 'Content',
    contentPlaceholder: 'Enter your content here...',
    labelPlaceholder: 'e.g., Work Experience',
    group: 'Group',
    uncategorizedOption: 'Uncategorized',
    detectedType: 'Detected Type',
    groupName: 'Group Name',
    groupNamePlaceholder: 'e.g., Contact Info',

    // Buttons
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',

    // Confirmations
    confirmDeleteMaterial: 'Are you sure you want to delete this material?',
    confirmDeleteGroup: 'Are you sure you want to delete this group? Materials in this group will become uncategorized.',

    // Validation
    contentRequired: 'Content is required',
    groupNameRequired: 'Group name is required',

    // Types
    typeText: 'Text',
    typeDate: 'Date',
    typePhone: 'Phone',
    typeEmail: 'Email',
  },

  zh: {
    // Header
    appTitle: '网申填写助手',
    close: '关闭',

    // Toolbar
    newGroup: '新建分组',
    dateFormat: '日期粘贴为：',

    // Empty state
    emptyState: '暂无材料。创建你的第一个分组和材料吧！',

    // Group
    uncategorized: '未分类',
    editGroup: '编辑',
    deleteGroup: '删除',
    addMaterial: '添加材料',

    // Material
    editMaterial: '编辑',
    deleteMaterial: '删除',

    // Modal titles
    newMaterial: '新建材料',
    editMaterialTitle: '编辑材料',
    newGroupTitle: '新建分组',
    editGroupTitle: '编辑分组',

    // Form labels
    label: '标签（可选）',
    labelHelp: '显示在左上角的简短文字',
    content: '内容',
    contentPlaceholder: '在此输入内容...',
    labelPlaceholder: '例如：工作经历',
    group: '分组',
    uncategorizedOption: '未分类',
    detectedType: '检测类型',
    groupName: '分组名称',
    groupNamePlaceholder: '例如：联系方式',

    // Buttons
    save: '保存',
    cancel: '取消',
    delete: '删除',

    // Confirmations
    confirmDeleteMaterial: '确定要删除这个材料吗？',
    confirmDeleteGroup: '确定要删除这个分组吗？分组中的材料将变为未分类。',

    // Validation
    contentRequired: '内容不能为空',
    groupNameRequired: '分组名称不能为空',

    // Types
    typeText: '文本',
    typeDate: '日期',
    typePhone: '电话',
    typeEmail: '邮箱',
  }
};

// Get browser language or stored preference
function getLanguage() {
  // Check stored preference first
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get(['language'], (result) => {
      if (result.language) {
        return result.language;
      }
    });
  }
  // Default to browser language
  const lang = navigator.language || navigator.userLanguage || 'en';
  return lang.startsWith('zh') ? 'zh' : 'en';
}

// Current language
let currentLang = 'en';

// Initialize language
function initLanguage() {
  const lang = getLanguage();
  currentLang = i18n[lang] ? lang : 'en';
}

// Get translation
function t(key) {
  return i18n[currentLang][key] || i18n.en[key] || key;
}

// Set language
function setLanguage(lang) {
  if (i18n[lang]) {
    currentLang = lang;
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ language: lang });
    }
  }
}

// Export for use in sidebar.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { t, setLanguage, initLanguage, i18n };
}
