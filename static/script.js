const latexInput = document.getElementById('latex-input');
const output = document.getElementById('output');
const presetButtons = document.getElementById('preset-buttons');

// 预设公式数组
const presetFormulas = [
    { name: "求和", latex: "\\sum_{i=1}^n x_i" },
    { name: "积分", latex: "\\int_{a}^b f(x) dx" },
    { name: "多行括号", latex: "\\begin{cases} \n \n\\end{cases}" },
];

function renderEquation() {
    const input = latexInput.value;
    output.innerHTML = '';  // Clear previous content
    const mathElement = document.createElement('div');
    mathElement.style.width = '100%';
    mathElement.style.display = 'flex';
    mathElement.style.justifyContent = 'center';
    mathElement.innerHTML = '\\[' + input + '\\]';
    output.appendChild(mathElement);
    MathJax.typesetPromise([mathElement]).then(() => {
        console.log('Equation rendered');
    }).catch((err) => {
        console.log('Error:', err);
        output.innerHTML = '<p style="color: red;">渲染错误: 请检查您的LaTeX语法</p>';
    });
}

// 初始渲染和设置防抖
renderEquation();
let debounceTimer;
latexInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(renderEquation, 300);
});

// 创建预设按钮
function createPresetButtons() {
    presetFormulas.forEach(formula => {
        const button = document.createElement('div');
        button.className = 'preset-button';
        button.innerHTML = 
            `<div class="formula-render">\\(${formula.latex}\\)</div>
            <div>${formula.name}</div>`;
        button.onclick = () => {
            latexInput.value += formula.latex;
            renderEquation();
        };
        presetButtons.appendChild(button);
    });
    MathJax.typesetPromise([presetButtons]);
}

// 调用创建预设按钮函数
createPresetButtons();

// 上传图片进行LaTeX OCR处理
document.getElementById('uploadForm').addEventListener('submit', function(event) {
    event.preventDefault();  // 防止表单的默认提交行为

    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0) {
        alert("请选择一个文件！");
        return;
    }

    // 显示提示信息：文件上传开始
    showNotification('已上传图片，正在请求OCR识别中...');

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status && data.res && data.res.latex) {
            latexInput.value = data.res.latex; // 清空并写入OCR结果
            renderEquation(); // 重新渲染公式
            showNotification('OCR识别成功！LaTeX公式已更新。');
        } else {
            document.getElementById('ocr-result').innerText = '识别失败，请重试。';
            showNotification('OCR识别失败，请检查图片格式。');
        }
    })
    .catch(error => {
        document.getElementById('ocr-result').innerText = '识别错误: ' + error;
        showNotification('OCR请求出错，请稍后再试。');
    });
});

function getSVGData() {
    const svg = document.querySelector('#output svg');
    if (!svg) {
        showNotification('没有可用的SVG。请确保公式已正确渲染。');
        return null;
    }
    return new XMLSerializer().serializeToString(svg);
}

function downloadSVG() {
    const svgData = getSVGData();
    if (!svgData) return;

    const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = 'equation.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    showNotification('SVG已下载');
}

function downloadPNG() {
    const svgData = getSVGData();
    if (!svgData) return;

    const resolution = document.getElementById('resolution').value;
    const scale = resolution / 96;
    
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const link = document.createElement('a');
        link.download = 'equation.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        showNotification('PNG已下载');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}

function copySVG() {
    const svgData = getSVGData();
    if (!svgData) return;

    navigator.clipboard.writeText(svgData).then(() => {
        showNotification('SVG已复制到剪贴板');
    }).catch(err => {
        console.error('无法复制SVG: ', err);
        showNotification('复制SVG失败。请检查您的浏览器设置。');
    });
}

function copyPNG() {
    const svgData = getSVGData();
    if (!svgData) return;

    const resolution = document.getElementById('resolution').value;
    const scale = resolution / 96;
    
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(blob => {
            navigator.clipboard.write([
                new ClipboardItem({'image/png': blob})
            ]).then(() => {
                showNotification('PNG已复制到剪贴板');
            }).catch(err => {
                console.error('无法复制PNG: ', err);
                showNotification('复制PNG失败。请检查您的浏览器设置。');
            });
        }, 'image/png');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.display = 'block';
    notification.style.opacity = '1';
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.style.display = 'none';
        }, 500);
    }, 2000);
}

document.addEventListener('paste', function(event) {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
            const file = item.getAsFile();
            uploadImageFromClipboard(file); // 调用上传图片的函数
            break; // 一次只处理一张图片
        }
    }
});

// 用于上传剪贴板中的图片并调用OCR
function uploadImageFromClipboard(file) {
    // 显示提示信息：已接收到粘贴内容
    showNotification('已接收到图片，正在请求OCR识别中...');

    const formData = new FormData();
    formData.append('file', file);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status && data.res && data.res.latex) {
            latexInput.value = data.res.latex; // 清空并写入OCR结果
            renderEquation(); // 重新渲染公式
            showNotification('OCR识别成功！LaTeX公式已更新。');
        } else {
            document.getElementById('ocr-result').innerText = '识别失败，请重试。';
            showNotification('OCR识别失败，请检查图片格式。');
        }
    })
    .catch(error => {
        document.getElementById('ocr-result').innerText = '识别错误: ' + error;
        showNotification('OCR请求出错，请稍后再试。');
    });
}
