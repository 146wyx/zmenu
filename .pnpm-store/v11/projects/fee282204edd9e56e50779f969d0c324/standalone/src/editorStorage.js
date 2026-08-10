import { parse, stringify } from 'yaml';
import minecraftItemClasses from 'virtual:minecraft-item-classes';

const STORAGE_KEY = 'zmenu-standalone-editor-v1';
const ITEMS_PER_PAGE = 54;
const MAX_PAGES = 10;
const MAX_SLOTS = ITEMS_PER_PAGE * MAX_PAGES;

const versions = [
    { minecraft_version: '', version: '全部版本' },
    { minecraft_version: 1.20, version: '1.20+' },
    { minecraft_version: 1.19, version: '1.19+' },
    { minecraft_version: 1.18, version: '1.18+' },
    { minecraft_version: 1.17, version: '1.17+' },
    { minecraft_version: 1.16, version: '1.16+' },
    { minecraft_version: 1.13, version: '1.13+' },
];

const buttonTypes = [
    { id: 1, name: 'NONE', description: '默认 zMenu 按钮，不附带任何特殊跳转行为。', documentation_url: 'https://docs.groupez.dev/zmenu/configurations/buttons/types/none', contents: [] },
    { id: 2, name: 'COMMAND', description: '点击后以玩家身份执行按钮绑定的命令（传统模式）。', documentation_url: 'https://docs.groupez.dev/zmenu/configurations/buttons#commands', contents: [] },
    { id: 3, name: 'CONSOLE_COMMAND', description: '点击后以控制台身份执行按钮绑定的命令（传统模式）。', documentation_url: 'https://docs.groupez.dev/zmenu/configurations/buttons#consolecommands', contents: [] },
    { id: 4, name: 'INVENTORY', description: '点击后打开另一个 zMenu 菜单。', documentation_url: 'https://docs.groupez.dev/zmenu/configurations/buttons/types/inventory', contents: [{ key: 'inventory', data_type: 'string', description: '目标菜单的文件名（不含 .yml）。', documentation_url: 'https://docs.groupez.dev/zmenu/configurations/buttons/types/inventory' }, { key: 'plugin', data_type: 'string', description: '跨插件打开时指定插件名称。', documentation_url: 'https://docs.groupez.dev/zmenu/configurations/buttons/types/inventory' }, { key: 'arguments', data_type: 'textarea', description: '传给目标菜单的参数占位符列表，每行一个。', documentation_url: 'https://docs.groupez.dev/zmenu/configurations/buttons/types/inventory' }, { key: 'to_page', data_type: 'integer', description: '直接打开到目标菜单的某一页。', documentation_url: 'https://docs.groupez.dev/zmenu/configurations/buttons/types/inventory' }] },
    { id: 5, name: 'BACK', description: '返回到上一次打开的菜单。', documentation_url: 'https://docs.groupez.dev/zmenu/configurations/buttons/types/back', contents: [] },
    { id: 6, name: 'HOME', description: '直接返回到第一个打开的主菜单（mainMenu 配置）。', documentation_url: 'https://docs.groupez.dev/zmenu/configurations/buttons/types/home', contents: [] },
    { id: 7, name: 'NEXT', description: '在分页菜单中前往下一页。', documentation_url: 'https://docs.groupez.dev/zmenu/configurations/buttons/types/next', contents: [] },
    { id: 8, name: 'PREVIOUS', description: '在分页菜单中返回上一页。', documentation_url: 'https://docs.groupez.dev/zmenu/configurations/buttons/types/previous', contents: [] },
    { id: 9, name: 'MAINMENU', description: '跳转到配置的主菜单（MAIN_MENU 别名）。', documentation_url: 'https://docs.groupez.dev/zmenu/configurations/buttons/types/mainmenu', contents: [] },
    { id: 10, name: 'JUMP', description: '跳转到当前菜单指定的页码。', documentation_url: 'https://docs.groupez.dev/zmenu/configurations/buttons/types/jump', contents: [{ key: 'to_page', data_type: 'integer', description: '要跳转的目标页码。', documentation_url: 'https://docs.groupez.dev/zmenu/configurations/buttons/types/jump' }] },
    { id: 11, name: 'SWITCH', description: '根据占位符结果切换显示不同按钮状态。', documentation_url: 'https://docs.groupez.dev/zmenu/configurations/buttons/types/switch', contents: [{ key: 'cases', data_type: 'textarea', description: '分支映射 JSON：{"占位符值":{"material":"","name":""},...}。', documentation_url: 'https://docs.groupez.dev/zmenu/configurations/buttons/types/switch' }, { key: 'placeholder', data_type: 'string', description: '用于判断的占位符表达式。', documentation_url: 'https://docs.groupez.dev/zmenu/configurations/buttons/types/switch' }] },
];

const sounds = [
    'BLOCK_NOTE_BLOCK_PLING',
    'ENTITY_PLAYER_LEVELUP',
    'ENTITY_EXPERIENCE_ORB_PICKUP',
    'BLOCK_CHEST_OPEN',
    'BLOCK_CHEST_CLOSE',
    'UI_BUTTON_CLICK',
    'ENTITY_ITEM_PICKUP',
    'ENTITY_VILLAGER_YES',
    'ENTITY_VILLAGER_NO',
];

let itemsCache = null;
let itemsPromise = null;

const numberValue = (value, fallback) => {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

const booleanValue = (value) => value === true || value === 'true' || value === 1 || value === '1';

const textLines = (value) => {
    if (Array.isArray(value)) return value.map(String).join('\n');
    return typeof value === 'string' ? value : '';
};

const arrayValue = (value) => {
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === 'string' && value.length > 0) return value.split('\n');
    return [];
};

const materialFromCss = (css) => {
    const rawName = css.replace('icon-minecraft-', '');
    if (rawName.startsWith('spawn-egg-')) {
        return `${rawName.replace('spawn-egg-', '').replaceAll('-', '_').toUpperCase()}_SPAWN_EGG`;
    }
    return rawName.replaceAll('-', '_').toUpperCase();
};

const itemNameFromCss = (css) => css
    .replace('icon-minecraft-', '')
    .split('-')
    .map((word) => word.length <= 3 ? word.toUpperCase() : `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');

const fallbackMaterials = [
    'STONE', 'DIRT', 'GRASS_BLOCK', 'OAK_LOG', 'CHEST', 'PAPER', 'BOOK', 'COMPASS',
    'BARRIER', 'DIAMOND', 'DIAMOND_SWORD', 'EMERALD', 'NETHER_STAR', 'PLAYER_HEAD',
];

const createItem = (css, index) => ({
    id: index + 1,
    css,
    name: itemNameFromCss(css),
    material: materialFromCss(css),
    old_material: null,
    minecraft_id: null,
    data: 0,
    max_stack_size: 64,
    version: { minecraft_version: 1.20, version: '1.20+' },
});

export const loadItems = async () => {
    if (itemsCache) return itemsCache;
    if (itemsPromise) return itemsPromise;

    itemsPromise = Promise.resolve().then(() => {
        const resolvedClassNames = minecraftItemClasses.length > 0
            ? minecraftItemClasses
            : fallbackMaterials.map((material) => `icon-minecraft-${material.toLowerCase().replaceAll('_', '-')}`);
        itemsCache = resolvedClassNames.map(createItem);
        return itemsCache;
    });

    return itemsPromise;
};

const defaultButton = (index) => ({
    slot: index % ITEMS_PER_PAGE,
    page: Math.floor(index / ITEMS_PER_PAGE) + 1,
    model_id: 0,
    amount: 1,
    display_name: null,
    lore: null,
    messages: null,
    commands: null,
    console_commands: null,
    name: `btn-${index}`,
    volume: 1,
    pitch: 1,
    sound: '',
    glow: false,
    is_permanent: false,
    close_inventory: false,
    refresh_on_click: false,
    update_on_click: false,
    update: false,
    button_data: '',
    head_id: null,
    head_url: null,
    type_id: 1,
    actions: [],
});

export const normalizeSlot = (storedSlot, index) => {
    const storedButton = storedSlot?.button || {};
    const defaultValues = defaultButton(index);
    return {
        id: index,
        content: storedSlot?.content ? { ...storedSlot.content } : null,
        button: {
            ...defaultValues,
            ...storedButton,
            slot: numberValue(storedButton.slot, defaultValues.slot),
            page: numberValue(storedButton.page, defaultValues.page),
        },
    };
};

const defaultInventory = () => ({
    id: 'local',
    name: '&8zMenu 菜单',
    size: 54,
    file_name: 'menu',
    updateInterval: 0,
    clearInventory: false,
    buttons: [],
});

const validSize = (size) => [9, 18, 27, 36, 45, 54].includes(Number(size)) ? Number(size) : 54;

export const normalizeContent = (source = {}) => {
    const inventory = {
        ...defaultInventory(),
        ...(source.inventory || {}),
    };
    inventory.size = validSize(inventory.size);
    inventory.updateInterval = numberValue(inventory.updateInterval ?? inventory.update_interval, 0);
    inventory.clearInventory = booleanValue(inventory.clearInventory ?? inventory.clear_inventory);

    const storedSlots = Array.isArray(source.slots) ? source.slots : [];
    return {
        inventory,
        slots: Array.from({ length: MAX_SLOTS }, (_, index) => normalizeSlot(storedSlots[index], index)),
        versions,
        buttonTypes,
        sounds,
    };
};

export const loadEditorContent = () => {
    try {
        const storedContent = window.localStorage.getItem(STORAGE_KEY);
        return normalizeContent(storedContent ? JSON.parse(storedContent) : {});
    } catch {
        return normalizeContent();
    }
};

export const saveEditorContent = ({ inventory, slots }) => {
    const content = normalizeContent({ inventory, slots });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        inventory: content.inventory,
        slots: content.slots,
    }));
    return content;
};

const typeId = (typeName) => {
    if (!typeName) return 1;
    const normalizedName = String(typeName).trim().toUpperCase();
    return buttonTypes.find((buttonType) => buttonType.name === normalizedName)?.id || 1;
};

const fallbackItem = (material) => ({
    id: `local-${material}`,
    css: `icon-minecraft-${String(material).toLowerCase().replaceAll('_', '-')}`,
    name: String(material).replaceAll('_', ' '),
    material,
    old_material: null,
    minecraft_id: null,
    data: 0,
    max_stack_size: 64,
    version: { minecraft_version: 1.20, version: '1.20+' },
});

const itemFromDefinition = async (definition = {}) => {
    if (definition.url) {
        return {
            ...fallbackItem('PLAYER_HEAD'),
            name: '玩家头颅',
        };
    }

    const material = String(definition.material || 'BARRIER').toUpperCase();
    const items = await loadItems();
    return items.find((item) => item.material === material) || fallbackItem(material);
};

const itemToYaml = (slot) => {
    const button = slot.button || {};
    const item = {};

    if (button.head_url && slot.content?.material === 'PLAYER_HEAD') {
        item.url = button.head_url;
    } else {
        item.material = slot.content?.material || 'BARRIER';
    }

    if (numberValue(button.amount, 1) !== 1) item.amount = numberValue(button.amount, 1);
    if (button.display_name) item.name = button.display_name;
    if (button.lore) item.lore = arrayValue(button.lore);
    if (numberValue(button.model_id, 0) !== 0) item.modelId = numberValue(button.model_id, 0);
    if (booleanValue(button.glow)) item.glow = true;

    return item;
};

export const toYaml = ({ inventory, slots, editorButtonTypes = buttonTypes }) => {
    const items = {};

    slots.forEach((slot, index) => {
        if (!slot?.content) return;

        const button = slot.button || defaultButton(index);
        const output = {
            slot: numberValue(button.slot, index % ITEMS_PER_PAGE),
            item: itemToYaml(slot),
        };

        if (numberValue(button.page, 1) !== 1) output.page = numberValue(button.page, 1);
        const buttonType = editorButtonTypes.find((type) => type.id === button.type_id);
        if (buttonType && buttonType.id !== 1) output.type = buttonType.name.toUpperCase();
        if (booleanValue(button.is_permanent)) output.isPermanent = true;
        if (booleanValue(button.close_inventory)) output.closeInventory = true;
        if (booleanValue(button.refresh_on_click)) output.refreshOnClick = true;
        if (booleanValue(button.update_on_click)) output.updateOnClick = true;
        if (booleanValue(button.update)) output.update = true;
        if (button.sound) output.sound = button.sound;
        if (numberValue(button.pitch, 1) !== 1) output.pitch = numberValue(button.pitch, 1);
        if (numberValue(button.volume, 1) !== 1) output.volume = numberValue(button.volume, 1);
        if (button.messages) output.messages = arrayValue(button.messages);
        if (button.commands) output.commands = arrayValue(button.commands);
        if (button.console_commands) output.consoleCommands = arrayValue(button.console_commands);
        if (button.actions && button.actions.length > 0) {
            const actionsArray = button.actions.map((a) => {
                const out = { type: a.type };
                if (a.values) {
                    Object.entries(a.values).forEach(([k, v]) => {
                        if (v !== "" && v !== null && v !== undefined) {
                            out[k] = v;
                        }
                    });
                }
                return out;
            }).filter((a) => Object.keys(a).length > 1 || Object.keys(a).includes('type'));
            if (actionsArray.length > 0) {
                output.actions = actionsArray;
            }
        }
        if (button.button_data) {
            let bd;
            try { bd = JSON.parse(button.button_data); } catch { bd = {}; }
            if (bd.inventory) output.inventory = bd.inventory;
            if (bd.plugin) output.plugin = bd.plugin;
            if (bd.arguments) output.arguments = arrayValue(bd.arguments);
            if (bd.to_page !== undefined && bd.to_page !== "" && Number(bd.to_page)) output.to_page = Number(bd.to_page);
            if (bd.cases) {
                try { output.cases = JSON.parse(bd.cases); } catch { output.cases = bd.cases; }
            }
            if (bd.placeholder) output.placeholder = bd.placeholder;
        }

        const baseName = button.name?.trim() || `btn-${index}`;
        let name = baseName;
        let suffix = 2;
        while (items[name]) {
            name = `${baseName}-${suffix}`;
            suffix += 1;
        }
        items[name] = output;
    });

    return stringify({
        name: inventory.name || '菜单',
        size: validSize(inventory.size),
        items,
    }, { indent: 2, lineWidth: 0 });
};

export const downloadYaml = (content) => {
    const yaml = toYaml(content);
    const blob = new Blob([yaml], { type: 'application/yaml;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fileName = String(content.inventory.file_name || 'menu')
        .replace(/[\\/:*?"<>|]+/g, '-')
        .trim() || 'menu';

    link.href = objectUrl;
    link.download = `${fileName}.yml`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
};

export const importYaml = async (file) => {
    const parsed = parse(await file.text());
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('所选文件不是有效的 YAML 菜单配置。');
    }

    const inventory = {
        ...defaultInventory(),
        name: typeof parsed.name === 'string' ? parsed.name : '菜单',
        size: validSize(parsed.size),
        file_name: String(file.name || 'menu').replace(/\.ya?ml$/i, ''),
        updateInterval: numberValue(parsed.updateInterval ?? parsed.update_interval, 0),
        clearInventory: booleanValue(parsed.clearInventory ?? parsed.clear_inventory),
    };
    const slots = Array.from({ length: MAX_SLOTS }, (_, index) => normalizeSlot(null, index));
    const entries = parsed.items && typeof parsed.items === 'object' ? Object.entries(parsed.items) : [];

    for (const [buttonName, rawEntry] of entries) {
        if (!rawEntry || typeof rawEntry !== 'object' || Array.isArray(rawEntry)) continue;

        const entry = rawEntry;
        const page = Math.min(MAX_PAGES, Math.max(1, numberValue(entry.page, 1)));
        const sourceSlots = Array.isArray(entry.slots) ? entry.slots : [entry.slot ?? 0];
        const content = await itemFromDefinition(entry.item || {});

        for (const rawSlot of sourceSlots) {
            const slotNumber = numberValue(rawSlot, 0);
            if (slotNumber < 0 || slotNumber >= ITEMS_PER_PAGE) continue;

            const index = ((page - 1) * ITEMS_PER_PAGE) + slotNumber;
            const button = {
                ...defaultButton(index),
                slot: slotNumber,
                page,
                name: String(buttonName),
                type_id: typeId(entry.type),
                amount: numberValue(entry.item?.amount, 1),
                display_name: entry.item?.name || null,
                lore: textLines(entry.item?.lore),
                model_id: numberValue(entry.item?.modelId, 0),
                glow: booleanValue(entry.item?.glow),
                head_url: entry.item?.url || null,
                is_permanent: booleanValue(entry.isPermanent),
                close_inventory: booleanValue(entry.closeInventory),
                refresh_on_click: booleanValue(entry.refreshOnClick),
                update_on_click: booleanValue(entry.updateOnClick),
                update: booleanValue(entry.update),
                sound: entry.sound || '',
                pitch: numberValue(entry.pitch, 1),
                volume: numberValue(entry.volume, 1),
                messages: textLines(entry.messages),
                commands: textLines(entry.commands),
                console_commands: textLines(entry.consoleCommands),
                actions: Array.isArray(entry.actions) ? entry.actions.map((a) => {
                    const values = {};
                    Object.entries(a).forEach(([k, v]) => {
                        if (k !== 'type') values[k] = v;
                    });
                    return {
                        id: Date.now() + Math.random(),
                        type: String(a.type || 'COMMAND').toUpperCase(),
                        values,
                    };
                }) : [],
                button_data: (() => {
                    const bd = {};
                    if (entry.inventory) bd.inventory = String(entry.inventory);
                    if (entry.plugin) bd.plugin = String(entry.plugin);
                    if (entry.arguments) bd.arguments = textLines(entry.arguments);
                    if (entry.to_page !== undefined) bd.to_page = Number(entry.to_page);
                    if (entry.cases !== undefined) {
                        if (typeof entry.cases === 'string') bd.cases = entry.cases;
                        else bd.cases = JSON.stringify(entry.cases);
                    }
                    if (entry.placeholder) bd.placeholder = String(entry.placeholder);
                    return Object.keys(bd).length > 0 ? JSON.stringify(bd) : '';
                })(),
            };
            slots[index] = { id: index, content: { ...content }, button };
        }
    }

    return normalizeContent({ inventory, slots });
};
