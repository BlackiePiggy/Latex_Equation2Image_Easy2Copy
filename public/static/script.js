const STORAGE_KEY = 'latex_eq_presets_v1';

const latexInput = document.getElementById('latex-input');
const output = document.getElementById('output');
const clearInputBtn = document.getElementById('clear-input-btn');
const downloadSvgBtn = document.getElementById('download-svg-btn');
const downloadPngBtn = document.getElementById('download-png-btn');
const copySvgBtn = document.getElementById('copy-svg-btn');
const copyPngBtn = document.getElementById('copy-png-btn');
const ocrResult = document.getElementById('ocr-result');

const presetButtons = document.getElementById('preset-buttons');
const presetForm = document.getElementById('preset-form');
const presetEditIndex = document.getElementById('preset-edit-index');
const presetNameInput = document.getElementById('preset-name');
const presetLatexInput = document.getElementById('preset-latex');
const presetSaveBtn = document.getElementById('preset-save-btn');
const presetCancelBtn = document.getElementById('preset-cancel-btn');

const defaultPresets = [
    { name: '求和', latex: '\\sum_{i=1}^{n} x_i' },
    { name: '定积分', latex: '\\int_{a}^{b} f(x)\\,dx' },
    { name: '分段函数', latex: '\\begin{cases} x^2, & x \\ge 0 \\\\ -x, & x < 0 \\end{cases}' },
    { name: '矩阵', latex: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}' },
    { name: '对齐公式', latex: '\\begin{align} a+b&=c \\\\ c-d&=e \\end{align}' }
];

let presets = loadPresets();

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.classList.remove('success', 'error');
    notification.classList.add(type);
    notification.textContent = message;
    notification.style.display = 'block';
    notification.style.opacity = '1';

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 250);
    }, 1800);
}

function loadPresets() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [...defaultPresets];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [...defaultPresets];
        return parsed.filter((p) => typeof p?.name === 'string' && typeof p?.latex === 'string');
    } catch {
        return [...defaultPresets];
    }
}

function savePresets() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

function resetPresetEditor() {
    presetEditIndex.value = '-1';
    presetNameInput.value = '';
    presetLatexInput.value = '';
    presetSaveBtn.textContent = '新增模板';
    presetCancelBtn.classList.add('hidden');
}

function startEditPreset(index) {
    const item = presets[index];
    if (!item) return;
    presetEditIndex.value = String(index);
    presetNameInput.value = item.name;
    presetLatexInput.value = item.latex;
    presetSaveBtn.textContent = '保存修改';
    presetCancelBtn.classList.remove('hidden');
    presetNameInput.focus();
}

function deletePreset(index) {
    if (!presets[index]) return;
    presets.splice(index, 1);
    savePresets();
    renderPresetButtons();
    resetPresetEditor();
    showNotification('模板已删除');
}

function renderPresetButtons() {
    presetButtons.innerHTML = '';

    if (presets.length === 0) {
        presetButtons.innerHTML = '<p class="hint">暂无模板，请先新增。</p>';
        return;
    }

    presets.forEach((formula, index) => {
        const item = document.createElement('div');
        item.className = 'preset-item';
        item.innerHTML = `
            <div class="formula-render">\\(${formula.latex}\\)</div>
            <div class="preset-title">${formula.name}</div>
            <div class="preset-actions">
                <button type="button" class="preset-mini-btn use" data-action="use" data-index="${index}">使用</button>
                <button type="button" class="preset-mini-btn edit" data-action="edit" data-index="${index}">编辑</button>
                <button type="button" class="preset-mini-btn del" data-action="delete" data-index="${index}">删除</button>
            </div>
        `;
        presetButtons.appendChild(item);
    });

    MathJax.typesetPromise([presetButtons]).catch(() => {
        showNotification('模板公式渲染失败', 'error');
    });
}

function renderEquation() {
    const input = latexInput.value.trim();
    if (!input) {
        output.innerHTML = '<p style="color:#64748b;">请输入 LaTeX 公式以预览。</p>';
        return;
    }

    const escapedInput = he.encode(input, {
        useNamedReferences: true,
        allowUnsafeSymbols: false
    });

    output.innerHTML = '';
    const mathElement = document.createElement('div');
    mathElement.style.width = '100%';
    mathElement.style.display = 'flex';
    mathElement.style.justifyContent = 'center';
    mathElement.innerHTML = `\\[${escapedInput}\\]`;
    output.appendChild(mathElement);

    MathJax.typesetPromise([mathElement]).catch(() => {
        output.innerHTML = '<p style="color:#dc2626;">公式渲染失败，请检查 LaTeX 语法。</p>';
    });
}

function getSVGData() {
    const svg = document.querySelector('#output svg');
    if (!svg) {
        showNotification('当前没有可导出的公式', 'error');
        return null;
    }
    return new XMLSerializer().serializeToString(svg);
}

function downloadSVG() {
    const svgData = getSVGData();
    if (!svgData) return;

    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = 'equation.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
    showNotification('SVG 已下载');
}

function downloadPNG() {
    const svgData = getSVGData();
    if (!svgData) return;

    const resolution = Number(document.getElementById('resolution').value) || 150;
    const scale = resolution / 96;
    const img = new Image();

    img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const link = document.createElement('a');
        link.download = 'equation.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        showNotification('PNG 已下载');
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}

function copySVG() {
    const svgData = getSVGData();
    if (!svgData) return;

    navigator.clipboard.writeText(svgData)
        .then(() => showNotification('SVG 代码已复制'))
        .catch(() => showNotification('复制 SVG 失败', 'error'));
}

function copyPNG() {
    const svgData = getSVGData();
    if (!svgData) return;

    const resolution = Number(document.getElementById('resolution').value) || 150;
    const scale = resolution / 96;
    const img = new Image();

    img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            if (!blob) {
                showNotification('PNG 生成失败', 'error');
                return;
            }
            navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
                .then(() => showNotification('PNG 已复制到剪贴板'))
                .catch(() => showNotification('复制 PNG 失败', 'error'));
        }, 'image/png');
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}

function handleOCRResponse(data) {
    if (data.status && data.res && data.res.latex) {
        latexInput.value = data.res.latex;
        renderEquation();
        ocrResult.textContent = '识别成功，已自动填入输入框。';
        showNotification('OCR 识别成功');
        return;
    }
    ocrResult.textContent = '识别失败，请尝试更清晰的图片。';
    showNotification('OCR 识别失败', 'error');
}

function uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    showNotification('正在进行 OCR 识别...');

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
        .then((response) => response.json())
        .then((data) => handleOCRResponse(data))
        .catch(() => {
            ocrResult.textContent = '请求失败，请检查服务状态。';
            showNotification('OCR 请求失败', 'error');
        });
}

presetForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = presetNameInput.value.trim();
    const latex = presetLatexInput.value.trim();
    const editIndex = Number(presetEditIndex.value);

    if (!name || !latex) {
        showNotification('模板名称和 LaTeX 不能为空', 'error');
        return;
    }

    if (editIndex >= 0 && editIndex < presets.length) {
        presets[editIndex] = { name, latex };
        showNotification('模板已更新');
    } else {
        presets.push({ name, latex });
        showNotification('模板已新增');
    }

    savePresets();
    renderPresetButtons();
    resetPresetEditor();
});

presetCancelBtn.addEventListener('click', resetPresetEditor);

presetButtons.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const action = target.dataset.action;
    const index = Number(target.dataset.index);
    if (!action || Number.isNaN(index)) return;

    if (action === 'use') {
        latexInput.value = presets[index].latex;
        renderEquation();
        showNotification(`已使用模板：${presets[index].name}`);
    } else if (action === 'edit') {
        startEditPreset(index);
    } else if (action === 'delete') {
        deletePreset(index);
    }
});

document.getElementById('uploadForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0) {
        showNotification('请先选择一张图片', 'error');
        return;
    }
    uploadImage(fileInput.files[0]);
});

document.addEventListener('paste', (event) => {
    const items = event.clipboardData?.items || [];
    for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        if (item.type.includes('image')) {
            const file = item.getAsFile();
            if (file) uploadImage(file);
            break;
        }
    }
});

let debounceTimer;
latexInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(renderEquation, 300);
});

clearInputBtn.addEventListener('click', () => {
    latexInput.value = '';
    renderEquation();
    latexInput.focus();
});

downloadSvgBtn.addEventListener('click', downloadSVG);
downloadPngBtn.addEventListener('click', downloadPNG);
copySvgBtn.addEventListener('click', copySVG);
copyPngBtn.addEventListener('click', copyPNG);

renderPresetButtons();
resetPresetEditor();
renderEquation();
