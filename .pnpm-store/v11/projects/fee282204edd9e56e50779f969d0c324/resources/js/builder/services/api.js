import {
    downloadYaml,
    importYaml,
    loadEditorContent,
    loadItems,
    normalizeSlot,
    saveEditorContent,
} from '../../../../standalone/src/editorStorage';

const success = (data = {}) => Promise.resolve({ data: { result: 'success', ...data } });

const apiFunctions = {
    loadEditorContent,
    normalizeSlot,
    fetchItems: async () => ({ data: { items: await loadItems() } }),
    fetchHeads: () => success({ heads: [] }),
    getHeadUrl: (headName) => headName ? `./images/head/${headName}.webp` : '',
    saveEditorState: (content) => success({ content: saveEditorContent(content) }),
    importYaml,
    downloadInventory: ({ inventory, slots, buttonTypes }) => {
        downloadYaml({ inventory, slots, editorButtonTypes: buttonTypes });
    },
    displayToast: (response) => {
        const toast = response?.data?.toast;
        if (toast && window.toast) window.toast(toast.type, toast.title, toast.description, toast.duration);
    },
    fetchFolders: () => success({ folders: [] }),
    deleteFolder: () => success(),
    createFolder: () => success(),
    updateFolder: () => success(),
    createInventory: () => success(),
    updateInventory: () => success(),
    fetchInventories: () => success({ inventories: [] }),
    getDownloadUrl: () => '#',
    renameInventory: () => success(),
    deleteInventory: () => success(),
    copyInventory: () => success(),
    changeInventoryVisibility: () => success(),
};

export default apiFunctions;
