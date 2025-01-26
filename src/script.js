// Check if the user has already agreed to the disclaimer
if (!localStorage.getItem('disclaimerAccepted')) {
    document.getElementById('disclaimerModal').style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

// Function to close the modal
function closeModal() {
    alert("You must agree to the disclaimer to use this site.");
}

// Function to handle agreement
function agreeToDisclaimer() {
    localStorage.setItem('disclaimerAccepted', 'true'); // Save the agreement
    document.getElementById('disclaimerModal').style.display = 'none'; // Close the modal
    document.body.style.overflow = 'auto'; // Re-enable scrolling
}

const resizer = document.querySelector('.resizer');
const leftPanel = document.querySelector('.docx-editor');
const rightPanel = document.querySelector('.xml-editor');
const buttonPanel = document.querySelector('.button-panel');

let isResizing = false;
let initialWidth = 0; // Track initial width of the left panel
let initialMouseX = 0; // Track initial mouse position

resizer.addEventListener('mousedown', (event) => {
    isResizing = true;
    initialWidth = leftPanel.offsetWidth; // Get the initial width of the left panel
    initialMouseX = event.clientX; // Get the initial mouse position
    document.body.style.cursor = 'ew-resize'; // Change cursor
});

document.addEventListener('mousemove', (event) => {
    if (isResizing) {
        const mouseDelta = event.clientX - initialMouseX; // Calculate change in mouse position
        const newWidth = initialWidth + mouseDelta; // Calculate new width

        // Get the width of the button panel
        const buttonPanelWidth = buttonPanel.offsetWidth;

        // Set the new widths without constraints
        leftPanel.style.width = newWidth + 'px'; // Set the width of the docx-editor
        rightPanel.style.width = `calc(100% - ${newWidth + buttonPanelWidth + 10}px)`; // Adjust width of xml-editor
    }
});

document.addEventListener('mouseup', () => {
    isResizing = false;
    document.body.style.cursor = 'default'; // Reset cursor
});


// Initialize TinyMCE
tinymce.init({
    selector: '#tinymce-editor',
    content_style: `body { margin: 25px;} *{scrollbar-width: thin;}`,
    height: '100%',
    width: '100%',
    license_key: 'gpl',
    promotion: false,
    plugins: "accordion anchor autosave charmap code codesample directionality emoticons fullscreen help image insertdatetime link lists lists advlist media nonbreaking pagebreak preview searchreplace table visualblocks visualchars wordcount",
    toolbar: "undo redo | fontfamily fontsizeinput | bold italic underline strikethrough | forecolor backcolor",
    setup: function (doceditor) {
        doceditor.on('change', function () {
            doceditor.save();
        });
    }
});
// Initialize Ace Editor
const editor = ace.edit("editor");
editor.session.setMode("ace/mode/xml");
editor.setTheme("ace/theme/eclipse");
editor.setFontSize("14px");
editor.session.setUseWrapMode(true);

let isCopied = false; // Flag to track if the user has copied the work

// Monitor changes in the XML editor
editor.session.on('change', function () {
    isCopied = false;
});

// Undo, Redo, Copy All functions for XML Editor
function undo() {
    editor.undo();
}

function redo() {
    editor.redo();
}

function copyAll() {
    const xmlContent = editor.getValue();
    navigator.clipboard.writeText(xmlContent).then(() => {
        const message = 'XML content copied to clipboard!';
        showNotification(message);
        isCopied = true; // Set the flag to true once the content is copied
    });
}

function resetAll() {
    copyAll();
    // Clear content
    editor.setValue('', 1);
    // Clear annotations and markers
    editor.getSession().clearAnnotations();
    editor.getSession().getMarkers(true);
}

// Function to show a non-blocking notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.innerText = message;
    notification.className = 'notification';
    document.body.appendChild(notification);

    // Remove the notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Function to show a non-blocking notification
function showWarning(message) {
    const notification = document.createElement('div');
    notification.innerText = message;
    notification.className = 'warning';
    document.body.appendChild(notification);

    // Remove the notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Warn the user if they try to close the tab without copying their work
window.addEventListener('beforeunload', function (e) {
    if (!isCopied) {
        const message = 'Please copy your work.';
        e.returnValue = message;
        return message;
    }
});

function toggleDropdown(id) {
    const element = document.getElementById(id);
    if (element.classList.contains('hidden')) {
        element.classList.remove('hidden');
    } else {
        element.classList.add('hidden');
    }
}
// Keep track of whether a file has been uploaded
let fileUploaded = false;
function toggleCustomSetups() {
    const customSetups = document.getElementById('customSetups');
    if (fileUploaded) {
        // If a file is uploaded, show the content section
        document.getElementById('file-content-section').classList.remove('hidden');
        document.getElementById('file-upload-section').classList.add('hidden');
    } else {
        // If no file is uploaded, show the upload section
        document.getElementById('file-content-section').classList.add('hidden');
        document.getElementById('file-upload-section').classList.remove('hidden');
    }
    customSetups.classList.toggle('hidden');
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        const lines = text.split('\n');
        const dropdownButtons = document.getElementById('dropdown-buttons');
        let currentKey = '';
        const options = {};
        lines.forEach(line => {
            if (line.startsWith('@')) {
                currentKey = line.substring(1).trim();
                options[currentKey] = '';
            } else if (currentKey) {
                options[currentKey] += line + '\n';
            }
        });
        // Clear existing buttons
        dropdownButtons.innerHTML = '';
        // Create a button for each key
        Object.keys(options).forEach(key => {
            const button = document.createElement('button');
            button.className = 'dropdown-item';
            button.innerText = key;
            dropdownButtons.appendChild(button);
            button.addEventListener('click', () => {
                insertContentIntoEditor(options[key].trim());
            });
        });
        fileUploaded = true;
        toggleCustomSetups(); // Switch to content view after upload
    };
    reader.readAsText(file);
}
function changeFile() {
    fileUploaded = false; // Reset the file uploaded flag
    document.getElementById('fileInput').value = ''; // Clear the file input
    toggleCustomSetups(); // Switch to the file upload view
}
// Function to insert content into Ace editor at cursor position or replace selection
function insertContentIntoEditor(content) {
    const session = editor.getSession();
    const selection = editor.getSelection();
    const range = selection.getRange();
    const selectedText = session.getTextRange(range);
    if (selectedText) {
        // Replace the selected text with the new content
        session.replace(range, content);
    } else {
        // Insert content at the cursor position
        const position = editor.getCursorPosition();
        session.insert(position, content);
    }
}

// Utility function to get selected text or return a placeholder if nothing is selected
function getSelectedTextOrPlaceholder() {
    const selection = editor.getSelection();
    const range = selection.getRange();
    return editor.getSession().getTextRange(range);
}

// Function to remove Empty Tags
function removeEmptyTags(inputLine) {
    const reg = /<\s*([a-zA-Z][a-zA-Z0-9]*)\s*>\s*<\/\s*\1\s*>/g;
    let line = inputLine;
    while (reg.test(line)) {
        line = line.replace(reg, '').trim();
    }
    return line.replace(/[ \t]+/g, ' ');
}

// Function to add B,I,U formatting
function addbiuFormatting(selectedNode, selectedHtml) {
    // Function to check if a node or any of its ancestors has a specific tag or class
    function hasFormatting(node, tags, classes) {
        while (node) {
            if (tags.includes(node.nodeName.toLowerCase())) {
                return true;
            }
            if (node.nodeType === Node.ELEMENT_NODE) {
                const style = window.getComputedStyle(node);
                if (tags.includes('u') && style.textDecoration.includes('underline')) {
                    return true;
                }
                if ((tags.includes('b') || tags.includes('strong')) && style.fontWeight.includes('bold')) {
                    return true;
                }
                if ((tags.includes('i') || tags.includes('em')) && style.fontStyle.includes('italic')) {
                    return true;
                }
                const classList = Array.from(node.classList);
                if (classList.some(cls => classes.includes(cls))) {
                    return true;
                }
            }
            node = node.parentNode;
        }
        return false;
    }

    // Check for formatting
    const isBold = hasFormatting(selectedNode, ['b', 'strong'], ['bold']);
    const isItalic = hasFormatting(selectedNode, ['i', 'em'], ['italic']);
    const isUnderlined = hasFormatting(selectedNode, ['u'], ['underline']);
    const isStrikethrough = hasFormatting(selectedNode, ['s', 'strike'], []);
    let formattedHtml = "";
    selectedHtml = selectedHtml.replace(/<br\s*\/?>/gi, '\n');
    if (!isStrikethrough) {
        // Generate formatted HTML for the selected text
        formattedHtml = generateFormattedHtml(selectedHtml);

        if (isBold) {
            formattedHtml = `<b>${formattedHtml}</b>`;
        }
        if (isItalic) {
            formattedHtml = `<i>${formattedHtml}</i>`;
        }
        if (isUnderlined) {
            formattedHtml = `<u>${formattedHtml}</u>`;
        }
    }
    return formattedHtml;

    function generateFormattedHtml(selectedHtml) {
        // Create a temporary div to parse and modify HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = selectedHtml;

        // Function to recursively process nodes
        function processNode(node) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                // Process child nodes first
                Array.from(node.childNodes).forEach(processNode);

                // Handle specific tags and inline styles
                if (node.nodeName === 'STRIKETHROUGH' || node.nodeName === 'S' || (node.nodeName === 'SPAN' && node.style.textDecoration === 'line-through')) {
                    node.parentNode.removeChild(node);
                } else if (node.nodeName === 'B' || node.nodeName === 'STRONG' || node.classList.contains('bold') || (node.nodeName === 'SPAN' && node.style.fontWeight === 'bold')) {
                    node.outerHTML = `<b>${node.innerHTML}</b>`;
                } else if (node.nodeName === 'I' || node.nodeName === 'EM' || node.classList.contains('italic') || (node.nodeName === 'SPAN' && node.style.fontStyle === 'italic')) {
                    node.outerHTML = `<i>${node.innerHTML}</i>`;
                } else if (node.nodeName === 'U' || (node.nodeName === 'SPAN' && node.style.textDecoration === 'underline') || node.classList.contains('underline')) {
                    node.outerHTML = `<u>${node.innerHTML}</u>`;
                } else {
                    // For other nodes, only include their text content
                    node.outerHTML = node.innerHTML;
                }
            }
        }

        Array.from(tempDiv.childNodes).forEach(processNode);

        // Replace &nbsp; with regular spaces and handle line breaks
        let html = tempDiv.innerHTML
            .replace(/&nbsp;/g, ' ')
            .trim();
        // Reemove comments
        html = html.replace(/<!--[\s\S]*?-->/g, '');
        html = removeEmptyTags(html);
        // Replace any sequence of line breaks with <br /><br />
        html = html.replace(/(?:\r\n|\r|\n)+/g, '<br /><br />\n');
        html = html.replace(/(<br\s*\/?>\s*){2,}/g, '<br /><br />\n');
        return html;
    }
}

// Function to add formatting
function addFormatting() {
    const tinymce_editor = tinymce.get('tinymce-editor');
    const selectedHtml = tinymce_editor.selection.getContent({ format: 'html' });
    if (selectedHtml.trim() === '') {
        showWarning('Please select Something in Docx-Editor.');
        return;
    }
    const selection = tinymce_editor.selection;
    const selectedNode = selection.getNode();
    const content = addbiuFormatting(selectedNode, selectedHtml);
    insertContentIntoEditor(content);
}

// Function to add bold and underline tags
function addBoldUnderline() {
    const selectedText = getSelectedTextOrPlaceholder();
    if (selectedText.trim() === '') {
        showWarning('Please select Something in XML-Editor.');
        return;
    }
    const content = '<b><u>' + selectedText + '</u></b>';
    insertContentIntoEditor(content);
}

// Function to add bold tags
function addBold() {
    const selectedText = getSelectedTextOrPlaceholder();
    if (selectedText.trim() === '') {
        showWarning('Please select Something in XML-Editor.');
        return;
    }
    const content = '<b>' + selectedText + '</b>';
    insertContentIntoEditor(content);
}

// Function to add underline tags
function addUnderline() {
    const selectedText = getSelectedTextOrPlaceholder();
    if (selectedText.trim() === '') {
        showWarning('Please select Something in XML-Editor.');
        return;
    }
    const content = '<u>' + selectedText + '</u>';
    insertContentIntoEditor(content);
}

// Function to add italic tags
function addItalic() {
    const selectedText = getSelectedTextOrPlaceholder();
    if (selectedText.trim() === '') {
        showWarning('Please select Something in XML-Editor.');
        return;
    }
    const content = '<i>' + selectedText + '</i>';
    insertContentIntoEditor(content);
}

// Function to add list item tags
function addList() {
    const selectedText = getSelectedTextOrPlaceholder();
    if (selectedText.trim() === '') {
        showWarning('Please select Something in XML-Editor.');
        return;
    }
    const content = '<li>' + selectedText + '</li>';
    insertContentIntoEditor(content);
}

// Function to add line break tags
function addBreak() {
    const content = '<br /><br />';
    insertContentIntoEditor(content);
}

// Function to add comment tags
function addComment() {
    const selectedText = getSelectedTextOrPlaceholder();
    if (selectedText.trim() === '') {
        showWarning('Please select Something in XML-Editor.');
        return;
    }
    const content = '<!-- ' + selectedText + ' -->';
    insertContentIntoEditor(content);
}

// Function to add hidden elements attribute
function addHiddenElements() {
    const content = ' optional="1" translateable="0" where="execute,survey,report"';
    insertContentIntoEditor(content);
}

// Function to add open end attribute
function addOpenEnd() {
    const content = ' open="1" openSize="25" randomize="0"';
    insertContentIntoEditor(content);
}

// Function to add randomize attribute
function addRandomize() {
    const content = ' randomize="0"';
    insertContentIntoEditor(content);
}

// Function to add exclusive attribute
function addExclusive() {
    const content = ' exclusive="1" randomize="0"';
    insertContentIntoEditor(content);
}

// Function to add shuffle rows attribute
function addShuffleRows() {
    const content = ' shuffle="rows"';
    insertContentIntoEditor(content);
}

// Function to add sort rows attribute
function addSortRows() {
    const content = ' sortRows="asc,survey"';
    insertContentIntoEditor(content);
}

// Function to add aggregate attribute
function addAggregate() {
    const content = ' aggregate="0" percentages="0"';
    insertContentIntoEditor(content);
}

// Function to add optional attribute
function addOptional() {
    const content = ' optional="1"';
    insertContentIntoEditor(content);
}

// Function to add group attribute to tags within selected text
function addGroups() {
    const session = editor.getSession();
    const selection = editor.getSelection();
    const range = selection.getRange();
    if (range.isEmpty()) {
        showWarning('Please select Tags in editor.');
        return;
    }
    const selectedText = session.getTextRange(range);
    const tagRegex = /<(row|col|noanswer|choice)([^>]*)>/g;
    if (!tagRegex.test(selectedText)) {
        showWarning('No Rows/Column found to update.');
        return;
    }
    const updatedText = selectedText.replace(tagRegex, '<$1$2 group="g">');
    session.replace(range, updatedText);
}

// Function to add incremental value="1,2,3,..." attribute to tags within selected text
function addValues() {
    const session = editor.getSession();
    const selection = editor.getSelection();
    const range = selection.getRange();
    if (range.isEmpty()) {
        showWarning('Please select Tags in editor.');
        return;
    }
    const selectedText = session.getTextRange(range);
    const tagRegex = /<(row|col|noanswer|choice)([^>]*)>/g;
    if (!tagRegex.test(selectedText)) {
        showWarning('No Rows/Column found to update.');
        return;
    }
    const lines = selectedText.split('\n').filter(line => line.trim() !== '');
    const updatedLines = lines.map((line, index) => {
        const value = index + 1;
        return line.replace(tagRegex, `<$1$2 value="${value}">`);
    });
    const updatedText = updatedLines.join('\n');
    session.replace(range, updatedText);
}

// Function to add decremental value="5,4,3,..." attribute to tags within selected text
function addValuesHL() {
    const session = editor.getSession();
    const selection = editor.getSelection();
    const range = selection.getRange();
    if (range.isEmpty()) {
        showWarning('Please select Tags in editor.');
        return;
    }
    const selectedText = session.getTextRange(range);
    const tagRegex = /<(row|col|noanswer|choice)([^>]*)>/g;
    if (!tagRegex.test(selectedText)) {
        showWarning('No Rows/Column found to update.');
        return;
    }
    const lines = selectedText.split('\n').filter(line => line.trim() !== '');
    const lineLen = lines.length;
    const updatedLines = lines.map((line, index) => {
        const value = lineLen - index;
        return line.replace(tagRegex, `<$1$2 value="${value}">`);
    });
    const updatedText = updatedLines.join('\n');
    session.replace(range, updatedText);
}

// Function to add desktop view attribute
function addDesktopView() {
    const content = ' surveyDisplay="desktop"';
    insertContentIntoEditor(content);
}

// Function to add block tag with selection text
function addBlockTag() {
    const selectedText = getSelectedTextOrPlaceholder();
    if (selectedText.trim() === '') {
        showWarning('Please select Something in XML-Editor.');
        return;
    }
    const content = `<block label="" cond="1" randomize="1">\n${selectedText}\n</block>`;
    insertContentIntoEditor(content);
}

// Function to add block tag with randomizeChildren attribute
function addBlockTagChild() {
    const selectedText = getSelectedTextOrPlaceholder();
    if (selectedText.trim() === '') {
        showWarning('Please select Something in XML-Editor.');
        return;
    }
    const content = `<block label="" cond="1" randomizeChildren="1">\n${selectedText}\n</block>`;
    insertContentIntoEditor(content);
}

// Function to add loop tag with nested block and looprow
function addLoopTag() {
    const selectedText = getSelectedTextOrPlaceholder();
    if (selectedText.trim() === '') {
        showWarning('Please select Something in XML-Editor.');
        return;
    }
    const content = `
<loop label="" vars="" title=" " suspend="0">
  <block label="">
${selectedText}
  </block>
  <looprow label="" cond="">
    <loopvar name=""></loopvar>
  </looprow>
</loop>`;
    insertContentIntoEditor(content);
}

// Function to make rows based on content
function makeOption(content, make, { value = false } = {}) {
    let index = 1;
    let options = '';
    let TermText = [];
    let TermCond = [];
    let optionList = [];
    const cleanPnChecked = document.getElementById('clean-pn').checked;
    const cleanPnBracketChecked = document.getElementById('clean-pn-bracket').checked;
    const matchLabelChecked = document.getElementById('match-label').checked;
    const valueChecked = document.getElementById('add-values').checked && value;
    const descChecked = document.getElementById('desc-order').checked;
    const lines = content ? content.split('\n') : [content];
    let ltex = 'r';
    if (make == 'col') {
        ltex = 'c';
    } else if (make == 'choice') {
        ltex = 'ch';
    }
    for (let j = 0; j < lines.length; j++) {
        let optionLabel, remainingPart, optionAttributes = '', termFlag = 0;
        let line = lines[j].trim();

        if (line.toLowerCase().includes("specify")) {
            optionAttributes += ' open="1" openSize="25" randomize="0"';
        }
        if (line.toLowerCase().includes("anchor") ||
            line.toLowerCase().includes("fixed") ||
            line.toLowerCase().includes("pinned")) {
            optionAttributes += ' randomize="0"';
        }
        if (line.toLowerCase().includes("exclusive") ||
            line.toLowerCase() === "none of the above") {
            optionAttributes += ' exclusive="1" randomize="0"';
        } const uniqueAttributes = [...new Set(optionAttributes.split(' '))].join(' ');
        optionAttributes = uniqueAttributes;
        if (line.toLowerCase().includes("term") || line.toLowerCase().includes("screen out") || line.toLowerCase().includes("dnq") || line.toLowerCase().includes("skip to end")) {
            termFlag = 1;
        }
        if (cleanPnChecked) {
            line = line.replace(/\[.*?\]/g, '');
        }
        if (cleanPnBracketChecked) {
            line = line.replace(/\(.*?\)/g, '');
        }

        line = removeEmptyTags(line);
        let firstPart;
        let regex1 = /^(\w+)\s(.*)$/;
        let regex2 = /^([^\s\.\)]+)[\.\)](.*)$/;
        let match1 = line.match(regex1);
        let match2 = line.match(regex2);
        if (match2) {
            firstPart = match2[1].trim();
            remainingPart = match2[2].trim();
        } else {
            firstPart = '';
            remainingPart = line.trim();
        }

        // Extract tags and text from firstPart
        const tags = firstPart.match(/<[^>]+>/g) || [];
        firstPart = firstPart.replace(/<[^>]+>/g, '');

        // Prepend tags to the remainingPart
        for (let i = tags.length - 1; i >= 0; i--) {
            remainingPart = tags[i] + remainingPart;
        }
        remainingPart = removeEmptyTags(remainingPart);

        if (matchLabelChecked) {
            if (firstPart === '' || !/^[a-zA-Z0-9]*$/.test(firstPart)) {
                remainingPart = remainingPart.trim();
                if (remainingPart === '') {
                    continue;
                }
                showWarning('Label not found to Match.');
                optionLabel = `${ltex}${index++}`;
            } else {
                optionLabel = `${ltex}${firstPart}`;
                remainingPart = remainingPart.trim();
                index++;
            }
        } else {
            remainingPart = remainingPart.trim();
            if (remainingPart === '') {
                continue;
            }
            optionLabel = `${ltex}${index++}`;
        }
        if (termFlag === 1) {
            TermText.push(remainingPart);
            TermCond.push(optionLabel);
        }
        optionList.push(`<${make} label="${optionLabel}"${optionAttributes}>${remainingPart}</${make}>`);
    }
    if (valueChecked && descChecked) {
        const rowRegex = new RegExp(`<(\\w+)\\s+label=["'](${ltex})(\\w+)["']([^>]*)>(.*?)<\\/\\1>`);
        let count = optionList.length;
        const updatedLines = optionList.map((line) => {
            const updatedLine = line.replace(rowRegex, (match, tagName, prefix, rValue, rest, content) => {
                return `<${tagName} label="${ltex}${count}" value="${count}"${rest}>${content}</${tagName}>`;
            });
            count--;
            return updatedLine;
        });
        options = updatedLines.join('\n');
    } else if (valueChecked) {
        const tagRegex = /<(row|col|noanswer|choice)([^>]*)>/g;
        const valRegex = new RegExp(`<\\w+\\s+label=["'](${ltex})(\\d+)["']`);
        let count = 1;
        const updatedLines = optionList.map((line) => {
            const matches = line.match(valRegex);
            const containsValue = line.includes('value="');
            if (matches && !containsValue) {
                const anyDigit = matches[2];
                return line.replace(tagRegex, `<$1$2 value="${anyDigit}">`);
            } else {
                return line.replace(tagRegex, `<$1$2 value="${count++}">`);
            }
        });
        options = updatedLines.join('\n');
    } else {
        options = optionList.join('\n');
    }
    return { options, TermText, TermCond };
}

// Function to make rows
function makeRows() {
    const tinymce_editor = tinymce.get('tinymce-editor');
    const selectedHtml = tinymce_editor.selection.getContent({ format: 'html' });
    let content;
    if (selectedHtml.trim() === '') {
        const selectedText = getSelectedTextOrPlaceholder();
        if (selectedText.trim() === '') {
            showWarning('Please select something in the Docx-Editor.');
            return;
        } content = selectedText;
    } else {
        const selection = tinymce_editor.selection;
        const selectedNode = selection.getNode();
        content = addbiuFormatting(selectedNode, selectedHtml);
    }
    content = content.replace(/(<br\s*\/?>\s*<br\s*\/?>)/g, '').replace(/ +/g, ' ').trim();
    const { options } = makeOption(content, 'row', { value: true });
    content = options;
    insertContentIntoEditor(content + '\n\n');
}

// Function to make cols
function makeCols() {
    const tinymce_editor = tinymce.get('tinymce-editor');
    const selectedHtml = tinymce_editor.selection.getContent({ format: 'html' });
    let content;
    if (selectedHtml.trim() === '') {
        const selectedText = getSelectedTextOrPlaceholder();
        if (selectedText.trim() === '') {
            showWarning('Please select something in the Docx-Editor.');
            return;
        } content = selectedText;
    } else {
        const selection = tinymce_editor.selection;
        const selectedNode = selection.getNode();
        content = addbiuFormatting(selectedNode, selectedHtml);
    }
    content = content.replace(/(<br\s*\/?>\s*<br\s*\/?>)/g, '').replace(/ +/g, ' ').trim();
    const { options } = makeOption(content, 'col', { value: true });
    content = options;
    insertContentIntoEditor(content + '\n\n');
}

// Function to make choices
function makeChoice() {
    const tinymce_editor = tinymce.get('tinymce-editor');
    const selectedHtml = tinymce_editor.selection.getContent({ format: 'html' });
    let content;
    if (selectedHtml.trim() === '') {
        const selectedText = getSelectedTextOrPlaceholder();
        if (selectedText.trim() === '') {
            showWarning('Please select something in the Docx-Editor.');
            return;
        } content = selectedText;
    } else {
        const selection = tinymce_editor.selection;
        const selectedNode = selection.getNode();
        content = addbiuFormatting(selectedNode, selectedHtml);
    }
    content = content.replace(/(<br\s*\/?>\s*<br\s*\/?>)/g, '').replace(/ +/g, ' ').trim();
    const { options } = makeOption(content, 'choice', { value: true });
    content = options;
    insertContentIntoEditor(content + '\n\n');
}

// function to get First Word
function getFirstWord(content) {
    // Remove HTML tags and unnecessary symbols
    const cleanContent = content
        .replace(/<[^>]*>/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\(.*?\)/g, '')
        .replace(/[ \t]+/g, ' ')
        .trim();
    let firstWord = '';
    let found = false;
    if (cleanContent.length > 0) {
        for (let i = 0; i < cleanContent.length; i++) {
            const char = cleanContent[i];
            // Check if the character is alphanumeric (0-9, A-Z, a-z)
            if (/[0-9A-Za-z_]/.test(char)) {
                firstWord += char; // Build the firstWord
                found = true; // Mark that we've found the first valid character
            } else if (found) {
                break;
            }
        }
    }
    return firstWord;
}

// Function to get Clean Sentence keeping tags
function cleanTitle(title) {
    let index = 0;
    let tagStack = '';
    while (index < title.length) {
        const char = title[index];
        // Check for opening tag
        if (char === '<') {
            // Find closing tag
            const closingIndex = title.indexOf('>', index);
            if (closingIndex !== -1) {
                tagStack += title.slice(index, closingIndex + 1);
                index = closingIndex + 1;
                continue;
            }
        }
        // Check for ignored characters
        if (char === '[' || char === '(') {
            const closingIndex = title.indexOf(char === '[' ? ']' : ')', index);
            if (closingIndex !== -1) {
                index = closingIndex + 1;
                continue;
            }
        }
        // Check for alphanumeric character
        if (/[a-zA-Z0-9]/.test(char)) {
            return tagStack + title.slice(index); // Return with preserved tags
        }
        index++;
    }
    return title; // Return original if no alphanumeric found
}

//Function to get label, title and remaining content
function getLabelTitle(content) {
    const lines = content.split('\n').map(line => line.trim());
    let qlabel = '';
    let qtitle = '';
    let iqtext = '';
    let remainingContent = lines;
    for (let i = 0; i < lines.length; i++) {
        if (qlabel.length > 0 && iqtext.length > 0) {
            remainingContent = remainingContent.slice(i);
            break;
        }
        let line = lines[i];
        qtitle += line + ' ';
        const firstWord = getFirstWord(line);
        if (firstWord.length > 0) {
            if (qlabel === '') {
                qlabel = firstWord;
                qtitle = qtitle.replace(qlabel, '');
                const temp = getFirstWord(qtitle);
                if (temp.length > 0) {
                    iqtext = temp;
                    remainingContent = remainingContent.slice(i + 1);
                    break;
                }
            } else {
                iqtext = firstWord;
            }
        }
    }
    // Handle case where remaining content still includes unprocessed lines after loop
    if (remainingContent.length === lines.length) {
        remainingContent = []; // Ensure it's empty if no additional content exists
    }
    if (/^\d/.test(qlabel)) {
        qlabel = 'Q' + qlabel;
    }
    const cleanPnChecked = document.getElementById('clean-pn').checked;
    const cleanPnBracketChecked = document.getElementById('clean-pn-bracket').checked;
    if (cleanPnChecked) {
        qtitle = qtitle.replace(/\[.*?\]/g, '');
    }
    if (cleanPnBracketChecked) {
        qtitle = qtitle.replace(/\(.*?\)/g, '');
    }
    qtitle = removeEmptyTags(cleanTitle(qtitle)).replace(/[ \t]+/g, ' ').trim();
    const remainingContents = remainingContent.join('\n');
    return { qlabel, qtitle, remainingContents };
}

// function to get comment, row and column
function getCommentRowCol(content) {
    let comment = [];
    let row = [];
    let col = [];
    let choice = [];
    const lines = content.split('\n').map(line => line.trim());
    let inComment = true; // Flag to check if we are collecting comments
    let inRow = false;    // Flag for rows
    let inCol = false;    // Flag for columns
    let inChoice = false;    // Flag for choice
    const rowRegex = /\[\s*(rows:|row:|rows|row)\s*\]/i;
    const colRegex = /\[\s*(columns:|column:|columns|column|cols:|col:|cols|col)\s*\]/i;
    const choiceRegex = /\[\s*(choices:|choice:|choices|choice)\s*\]/i;
    for (let line of lines) {
        if (rowRegex.test(line)) {
            inComment = false;
            inCol = false;
            inChoice = false;
            inRow = true;
            row.push(line.replace(rowRegex, '').trim());
        } else if (colRegex.test(line)) {
            inComment = false;
            inRow = false;
            inChoice = false;
            inCol = true;
            col.push(line.replace(colRegex, '').trim());
        } else if (choiceRegex.test(line)) {
            inComment = false;
            inRow = false;
            inCol = false;
            inChoice = true;
            choice.push(line.replace(choiceRegex, '').trim());
        } else if (inComment && !inRow && !inCol && !inChoice) {
            comment.push(line);
        } else if (inRow && !inCol && !inChoice) {
            row.push(line.trim());
        } else if (inCol && !inChoice) {
            col.push(line.trim());
        } else if (inChoice) {
            choice.push(line.trim());
        }
    }
    if (inComment && !inRow && !inCol && !inChoice) {
        return { comment: '', row: removeEmptyTags(comment.join('\n')), col: removeEmptyTags(col.join('\n')), choice: removeEmptyTags(choice.join('\n')) };
    }
    return { comment: removeEmptyTags(comment.join('\n')), row: removeEmptyTags(row.join('\n')), col: removeEmptyTags(col.join('\n')), choice: removeEmptyTags(choice.join('\n')) };
}

// Function to make HTML
function makeHtml(content) {
    if (content === undefined) {
        const tinymce_editor = tinymce.get('tinymce-editor');
        const selectedHtml = tinymce_editor.selection.getContent({ format: 'html' });
        if (selectedHtml.trim() === '') {
            const selectedText = getSelectedTextOrPlaceholder();
            if (selectedText.trim() === '') {
                showWarning('Please select something in the Docx-Editor.');
                return;
            } content = selectedText;
        } else {
            const selection = tinymce_editor.selection;
            const selectedNode = selection.getNode();
            content = addbiuFormatting(selectedNode, selectedHtml);
        }
    }
    content = content.replace(/(<br\s*\/?>\s*<br\s*\/?>)/g, '').replace(/ +/g, ' ').trim();
    const { qlabel, qtitle, remainingContents } = getLabelTitle(content);
    let remainingContent = remainingContents;
    const cleanPnChecked = document.getElementById('clean-pn').checked;
    const cleanPnBracketChecked = document.getElementById('clean-pn-bracket').checked;
    if (cleanPnChecked) {
        remainingContent = remainingContent.replace(/\[.*?\]/g, '');
    }
    if (cleanPnBracketChecked) {
        remainingContent = remainingContent.replace(/\(.*?\)/g, '');
    }
    remainingContent = removeEmptyTags(remainingContent);
    remainingContent = remainingContent.replace(/\n/g, '<br /><br />\n');
    if (remainingContent.length > 0) {
        content = `<html label="${qlabel}" where="survey">${qtitle}<br /><br />${remainingContent}</html>\n<suspend/>\n\n`
    } else {
        content = `<html label="${qlabel}" where="survey">${qtitle}</html>\n<suspend/>\n\n`
    }

    content = content.replace(/\s*<br\s*\/?>\s*<br\s*\/?>\s*(?=<\/html>)/g, '');
    insertContentIntoEditor(content);
}

// comments
const comments = [
    'You may select more than one answer if this best describes you.',
    '<i>Select all that apply for each column</i>',
    'Please select one response in each row',
    '<i>Please select one, best answer.</i>',
    'Select all that apply for each column',
    'Please select all that apply for each',
    'Please select one for each statement',
    '<i>Please pick only one for each</i>',
    '<i>Select one answer in each row</i>',
    '<i>Please select one answer only</i>',
    'Please select the one, best answer.',
    'Please select the one, best answer',
    '<i>Please select one response.</i>',
    '<i>Please select one for each.</i>',
    'Please select one for each answer',
    'Select up to three options below.',
    'Please select one response only',
    '<i>Please select one answer</i>',
    'Please select one answer only.',
    'Please select one, best answer',
    'Select one answer in each row.',
    'Please pick only one for each.',
    'Please select one answer only',
    'Please pick only one for each',
    'Select one answer in each row',
    '<i>Select all that apply.</i>',
    '<i>Choose all that apply.</i>',
    'Please select all that apply',
    'Select one response per row.',
    '<i>Select all that apply</i>',
    'Please select one response.',
    'Select one response per row',
    'Please select one per brand',
    'Please select one for each.',
    '<i>Select one response.</i>',
    '<i>Please pick only one</i>',
    '<i>check all that apply</i>',
    'Please select one per row.',
    'Please select one or more.',
    'Please select one for each',
    '<i>Mark all that apply</i>',
    'Please select one per row',
    '<i>Select one answer.</i>',
    'Please select one answer',
    '<i>Please select one</i>',
    '(Select all that apply.)',
    '(Select all that apply)',
    'Select all that apply.',
    'Choose all that apply.',
    '(check all that apply)',
    'Select all that apply',
    'Please pick only one.',
    'Select one response.',
    'Please pick only one',
    'check all that apply',
    '(Select one answer.)',
    'Select one per row.',
    'Mark all that apply',
    'Please select one.',
    'Select one per row',
    'Select one answer.',
    '<i>Select one.</i>',
    'Please select one',
    '<i>Select one</i>',
    '(Select one.)',
    '(Select one)',
    'Select one.',
    'Select one',
    'Select all'
];

//function to make Radio question
function makeRadio(content) {
    if (content === undefined) {
        const tinymce_editor = tinymce.get('tinymce-editor');
        const selectedHtml = tinymce_editor.selection.getContent({ format: 'html' });
        if (selectedHtml.trim() === '') {
            const selectedText = getSelectedTextOrPlaceholder();
            if (selectedText.trim() === '') {
                showWarning('Please select something in the Docx-Editor.');
                return;
            } content = selectedText;
        } else {
            const selection = tinymce_editor.selection;
            const selectedNode = selection.getNode();
            content = addbiuFormatting(selectedNode, selectedHtml);
        }
    }
    content = content.replace(/(<br\s*\/?>\s*<br\s*\/?>)/g, '').replace(/ +/g, ' ').trim();

    let qAttributes = '', qcomment = '';

    // Check for comments in the content
    for (const com of comments) {
        if (content.includes(com)) {
            qcomment = com;
            content = content.replace(com, '');
            break;
        }
    }

    // Check for randomize in content
    if (content.toLowerCase().includes('randomize')) {
        qAttributes += ' shuffle="rows"';
    }
    const { qlabel, qtitle, remainingContents } = getLabelTitle(content);
    const { comment, row, col } = getCommentRowCol(remainingContents);
    if (qcomment == '' && comment.length > 0) {
        qcomment = comment;
    } else if (qcomment == '' && comment == '' && row.length > 0 && col.length > 0) {
        qcomment = 'Please select one for each';
    }
    if (qcomment == '') {
        qcomment = 'Please select one';
    }
    let termcod = [];
    let finalOutput = '';
    if (col.length > 0 && row.length == 0) {
        const { options, TermText: terms, TermCond } = makeOption(col, 'col', { value: true });
        for (const term of TermCond) {
            termcod.push(`${qlabel}.${term}`);
        }
        const tcond = termcod.join(' or ');
        const tText = terms.map(t => `'${t}'`).join(' or ');

        if (tText != '') {
            // Final output for radio
            finalOutput = `<radio\nlabel="${qlabel}" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${options}\n</radio>\n<suspend/>\n\n<term label="${qlabel}_Term" cond="${tcond}">${qlabel}: Terminate if coded ${tText}</term>\n\n<suspend/>`;

        } else {
            // Final output for radio
            finalOutput = `<radio\nlabel="${qlabel}" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${options}\n</radio>\n<suspend/>`;
        }
    }
    else if (row.length > 0 && col.length > 0) {
        const { options: roptions } = makeOption(row, 'row', { value: false });
        const { options: coptions } = makeOption(col, 'col', { value: true });
        finalOutput = `<radio\nlabel="${qlabel}" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${roptions}\n${coptions}\n</radio>\n<suspend/>`;
    } else {
        const { options, TermText: terms, TermCond } = makeOption(row, 'row', { value: true });

        for (const term of TermCond) {
            termcod.push(`${qlabel}.${term}`);
        }
        const tcond = termcod.join(' or ');
        const tText = terms.map(t => `'${t}'`).join(' or ');

        if (tText != '') {
            // Final output for radio
            finalOutput = `<radio\nlabel="${qlabel}" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${options}\n</radio>\n<suspend/>\n\n<term label="${qlabel}_Term" cond="${tcond}">${qlabel}: Terminate if coded ${tText}</term>\n\n<suspend/>`;

        } else {
            // Final output for radio
            finalOutput = `<radio\nlabel="${qlabel}" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${options}\n</radio>\n<suspend/>`;
        }
    }

    insertContentIntoEditor(finalOutput + '\n\n');
}

//function to make Checkbox question
function makeCheckbox(content) {
    if (content === undefined) {
        const tinymce_editor = tinymce.get('tinymce-editor');
        const selectedHtml = tinymce_editor.selection.getContent({ format: 'html' });
        if (selectedHtml.trim() === '') {
            const selectedText = getSelectedTextOrPlaceholder();
            if (selectedText.trim() === '') {
                showWarning('Please select something in the Docx-Editor.');
                return;
            } content = selectedText;
        } else {
            const selection = tinymce_editor.selection;
            const selectedNode = selection.getNode();
            content = addbiuFormatting(selectedNode, selectedHtml);
        }
    }
    content = content.replace(/(<br\s*\/?>\s*<br\s*\/?>)/g, '').replace(/ +/g, ' ').trim();

    let qAttributes = '', qcomment = '';
    // Check for comments in the content
    for (const com of comments) {
        if (content.includes(com)) {
            qcomment = com;
            content = content.replace(com, '');
            break;
        }
    }

    // Check for randomize in content
    if (content.toLowerCase().includes('randomize')) {
        qAttributes += ' shuffle="rows"';
    }
    const { qlabel, qtitle, remainingContents } = getLabelTitle(content);
    const { comment, row, col } = getCommentRowCol(remainingContents);
    if (qcomment == '' && comment.length > 0) {
        qcomment = comment;
    } else if (qcomment == '' && comment == '' && row.length > 0 && col.length > 0) {
        qcomment = 'Please select all that apply for each option';
    }
    if (qcomment == '') {
        qcomment = 'Please select all that apply';
    }
    let termcod = [];
    let finalOutput = '';
    if (col.length > 0 && row.length == 0) {
        const { options, TermText: terms, TermCond } = makeOption(col, 'col', { value: false });
        for (const term of TermCond) {
            termcod.push(`${qlabel}.${term}`);
        }
        const tcond = termcod.join(' or ');
        const tText = terms.map(t => `'${t}'`).join(' or ');

        if (tText != '') {
            finalOutput = `<checkbox\nlabel="${qlabel}" atleast="1" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${options}\n</checkbox>\n<suspend/>\n\n<term label="${qlabel}_Term" cond="${tcond}">${qlabel}: Terminate if coded ${tText}</term>\n\n<suspend/>`;

        } else {
            finalOutput = `<checkbox\nlabel="${qlabel}" atleast="1" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${options}\n</checkbox>\n<suspend/>`;
        }
    }
    else if (row.length > 0 && col.length > 0) {
        const { options: roptions } = makeOption(row, 'row', { value: false });
        const { options: coptions } = makeOption(col, 'col', { value: false });
        finalOutput = `<checkbox\nlabel="${qlabel}" atleast="1" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${roptions}\n${coptions}\n</checkbox>\n<suspend/>`;
    } else {
        const { options, TermText: terms, TermCond } = makeOption(row, 'row', { value: false });
        for (const term of TermCond) {
            termcod.push(`${qlabel}.${term}`);
        }
        const tcond = termcod.join(' or ');
        const tText = terms.map(t => `'${t}'`).join(' or ');

        if (tText != '') {
            finalOutput = `<checkbox\nlabel="${qlabel}" atleast="1" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${options}\n</checkbox>\n<suspend/>\n\n<term label="${qlabel}_Term" cond="${tcond}">${qlabel}: Terminate if coded ${tText}</term>\n\n<suspend/>`;

        } else {
            finalOutput = `<checkbox\nlabel="${qlabel}" atleast="1" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${options}\n</checkbox>\n<suspend/>`;
        }
    }

    insertContentIntoEditor(finalOutput + '\n\n');
}

//function to make Select question
function makeSelect(content) {
    if (content === undefined) {
        const tinymce_editor = tinymce.get('tinymce-editor');
        const selectedHtml = tinymce_editor.selection.getContent({ format: 'html' });
        if (selectedHtml.trim() === '') {
            const selectedText = getSelectedTextOrPlaceholder();
            if (selectedText.trim() === '') {
                showWarning('Please select something in the Docx-Editor.');
                return;
            } content = selectedText;
        } else {
            const selection = tinymce_editor.selection;
            const selectedNode = selection.getNode();
            content = addbiuFormatting(selectedNode, selectedHtml);
        }
    }
    content = content.replace(/(<br\s*\/?>\s*<br\s*\/?>)/g, '').replace(/ +/g, ' ').trim();

    let qAttributes = '', qcomment = '';
    // Check for comments in the content
    for (const com of comments) {
        if (content.includes(com)) {
            qcomment = com;
            content = content.replace(com, '');
            break;
        }
    }

    // Check for randomize in content
    if (content.toLowerCase().includes('randomize')) {
        qAttributes += ' shuffle="rows"';
    }
    const { qlabel, qtitle, remainingContents } = getLabelTitle(content);
    const { comment, row, col, choice } = getCommentRowCol(remainingContents);
    if (qcomment == '' && comment.length > 0) {
        qcomment = comment;
    } else if (qcomment == '' && comment == '' && row.length > 0 && col.length > 0) {
        qcomment = 'Please choose one option from dropdown for each option';
    }
    if (qcomment == '') {
        qcomment = 'Please choose one option from dropdown';
    }
    let termcod = [];
    let finalOutput = '';
    if (row.length > 0 && col.length > 0 && choice.length > 0) {
        const { options: roptions } = makeOption(row, 'row', { value: false });
        const { options: coptions } = makeOption(col, 'col', { value: false });
        const { options: choptions } = makeOption(choice, 'choice', { value: false });
        finalOutput = `<select\nlabel="${qlabel}" optional="0" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n${roptions}\n${coptions}\n</select>\n<suspend/>`;
    } else if (row.length > 0 && col.length > 0 && choice.length == 0) {
        const { options: roptions } = makeOption(row, 'row', { value: false });
        const { options: choptions } = makeOption(col, 'choice', { value: false });
        finalOutput = `<select\nlabel="${qlabel}" optional="0" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n${roptions}\n</select>\n<suspend/>`;
    } else if (row.length > 0 && col.length == 0 && choice.length > 0) {
        const { options: roptions } = makeOption(row, 'row', { value: false });
        const { options: choptions } = makeOption(choice, 'choice', { value: false });
        finalOutput = `<select\nlabel="${qlabel}" optional="0" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n${roptions}\n</select>\n<suspend/>`;
    } else if (row.length == 0 && col.length > 0 && choice.length > 0) {
        const { options: coptions } = makeOption(col, 'col', { value: false });
        const { options: choptions } = makeOption(choice, 'choice', { value: false });
        finalOutput = `<select\nlabel="${qlabel}" optional="0" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n${coptions}\n</select>\n<suspend/>`;
    } else if (row.length > 0 && col.length == 0 && choice.length == 0) {
        const { options: choptions, TermText: terms, TermCond } = makeOption(row, 'choice', { value: false });
        for (const term of TermCond) {
            termcod.push(`${qlabel}.${term}`);
        }
        const tcond = termcod.join(' or ');
        const tText = terms.map(t => `'${t}'`).join(' or ');

        if (tText != '') {
            finalOutput = `<select\nlabel="${qlabel}" optional="0" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n</select>\n<suspend/>\n\n<term label="${qlabel}_Term" cond="${tcond}">${qlabel}: Terminate if coded ${tText}</term>\n\n<suspend/>`;

        } else {
            finalOutput = `<select\nlabel="${qlabel}" optional="0" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n</select>\n<suspend/>`;
        }
    } else if (row.length == 0 && col.length > 0 && choice.length == 0) {
        const { options: choptions, TermText: terms, TermCond } = makeOption(col, 'choice', { value: false });
        for (const term of TermCond) {
            termcod.push(`${qlabel}.${term}`);
        }
        const tcond = termcod.join(' or ');
        const tText = terms.map(t => `'${t}'`).join(' or ');

        if (tText != '') {
            finalOutput = `<select\nlabel="${qlabel}" optional="0" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n</select>\n<suspend/>\n\n<term label="${qlabel}_Term" cond="${tcond}">${qlabel}: Terminate if coded ${tText}</term>\n\n<suspend/>`;

        } else {
            finalOutput = `<select\nlabel="${qlabel}" optional="0" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n</select>\n<suspend/>`;
        }
    } else {
        const { options: choptions, TermText: terms, TermCond } = makeOption(choice, 'choice', { value: false });
        for (const term of TermCond) {
            termcod.push(`${qlabel}.${term}`);
        }
        const tcond = termcod.join(' or ');
        const tText = terms.map(t => `'${t}'`).join(' or ');

        if (tText != '') {
            finalOutput = `<select\nlabel="${qlabel}" optional="0" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n</select>\n<suspend/>\n\n<term label="${qlabel}_Term" cond="${tcond}">${qlabel}: Terminate if coded ${tText}</term>\n\n<suspend/>`;

        } else {
            finalOutput = `<select\nlabel="${qlabel}" optional="0" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n</select>\n<suspend/>`;
        }
    }

    insertContentIntoEditor(finalOutput + '\n\n');
}

//function to make Text question
function makeText(content) {
    if (content === undefined) {
        const tinymce_editor = tinymce.get('tinymce-editor');
        const selectedHtml = tinymce_editor.selection.getContent({ format: 'html' });
        if (selectedHtml.trim() === '') {
            const selectedText = getSelectedTextOrPlaceholder();
            if (selectedText.trim() === '') {
                showWarning('Please select something in the Docx-Editor.');
                return;
            } content = selectedText;
        } else {
            const selection = tinymce_editor.selection;
            const selectedNode = selection.getNode();
            content = addbiuFormatting(selectedNode, selectedHtml);
        }
    }
    content = content.replace(/(<br\s*\/?>\s*<br\s*\/?>)/g, '').replace(/ +/g, ' ').trim();

    let qAttributes = '', qcomment = '';
    // Check for comments in the content
    for (const com of comments) {
        if (content.includes(com)) {
            qcomment = com;
            content = content.replace(com, '');
            break;
        }
    }

    // Check for randomize in content
    if (content.toLowerCase().includes('randomize')) {
        qAttributes += ' shuffle="rows"';
    }
    const { qlabel, qtitle, remainingContents } = getLabelTitle(content);
    const { comment, row, col, choice } = getCommentRowCol(remainingContents);
    if (qcomment == '' && comment.length > 0) {
        qcomment = comment;
    }
    if (qcomment == '') {
        qcomment = 'Please be as specific as possible';
    }
    let finalOutput = '';
    if (row.length > 0 && col.length > 0 && choice.length > 0) {
        const { options: roptions } = makeOption(row, 'row', { value: false });
        const { options: coptions } = makeOption(col, 'col', { value: false });
        const { options: choptions } = makeOption(choice, 'row', { value: false });
        finalOutput = `<text\nlabel="${qlabel}" size="25" ss:listDisplay="1" verify="len(3)" optional="0" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n${roptions}\n${coptions}\n</text>\n<suspend/>`;
    } else if (row.length > 0 && col.length > 0 && choice.length == 0) {
        const { options: roptions } = makeOption(row, 'row', { value: false });
        const { options: choptions } = makeOption(col, 'row', { value: false });
        finalOutput = `<text\nlabel="${qlabel}" size="25" ss:listDisplay="1" verify="len(3)" optional="0" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n${roptions}\n</text>\n<suspend/>`;
    } else if (row.length > 0 && col.length == 0 && choice.length > 0) {
        const { options: roptions } = makeOption(row, 'row', { value: false });
        const { options: choptions } = makeOption(choice, 'row', { value: false });
        finalOutput = `<text\nlabel="${qlabel}" size="25" ss:listDisplay="1" verify="len(3)" optional="0" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n${roptions}\n</text>\n<suspend/>`;
    } else if (row.length == 0 && col.length > 0 && choice.length > 0) {
        const { options: coptions } = makeOption(col, 'col', { value: false });
        const { options: choptions } = makeOption(choice, 'row', { value: false });
        finalOutput = `<text\nlabel="${qlabel}" size="25" ss:listDisplay="1" verify="len(3)" optional="0" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n${coptions}\n</text>\n<suspend/>`;
    } else if (row.length > 0 && col.length == 0 && choice.length == 0) {
        const { options: choptions } = makeOption(row, 'row', { value: false });
        finalOutput = `<text\nlabel="${qlabel}" size="25" ss:listDisplay="1" verify="len(3)" optional="0" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n</text>\n<suspend/>`;
    } else if (row.length == 0 && col.length > 0 && choice.length == 0) {
        const { options: choptions } = makeOption(col, 'choice', { value: false });
        finalOutput = `<text\nlabel="${qlabel}" size="25" ss:listDisplay="1" verify="len(3)" optional="0" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n</text>\n<suspend/>`;
    } else {
        const { options: choptions } = makeOption(choice, 'row', { value: false });
        finalOutput = `<text\nlabel="${qlabel}" size="25" ss:listDisplay="1" verify="len(3)" optional="0" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n</text>\n<suspend/>`;
    }
    insertContentIntoEditor(finalOutput + '\n\n');
}

//function to make TextArea question
function makeTextArea(content) {
    if (content === undefined) {
        const tinymce_editor = tinymce.get('tinymce-editor');
        const selectedHtml = tinymce_editor.selection.getContent({ format: 'html' });
        if (selectedHtml.trim() === '') {
            const selectedText = getSelectedTextOrPlaceholder();
            if (selectedText.trim() === '') {
                showWarning('Please select something in the Docx-Editor.');
                return;
            } content = selectedText;
        } else {
            const selection = tinymce_editor.selection;
            const selectedNode = selection.getNode();
            content = addbiuFormatting(selectedNode, selectedHtml);
        }
    }
    content = content.replace(/(<br\s*\/?>\s*<br\s*\/?>)/g, '').replace(/ +/g, ' ').trim();

    let qAttributes = '', qcomment = '';
    // Check for comments in the content
    for (const com of comments) {
        if (content.includes(com)) {
            qcomment = com;
            content = content.replace(com, '');
            break;
        }
    }

    // Check for randomize in content
    if (content.toLowerCase().includes('randomize')) {
        qAttributes += ' shuffle="rows"';
    }
    const { qlabel, qtitle, remainingContents } = getLabelTitle(content);
    const { comment, row, col, choice } = getCommentRowCol(remainingContents);
    if (qcomment == '' && comment.length > 0) {
        qcomment = comment;
    }
    if (qcomment == '') {
        qcomment = 'Please be as specific as possible';
    }
    let finalOutput = '';
    if (row.length > 0 && col.length > 0 && choice.length > 0) {
        const { options: roptions } = makeOption(row, 'row', { value: false });
        const { options: coptions } = makeOption(col, 'col', { value: false });
        const { options: choptions } = makeOption(choice, 'row', { value: false });
        finalOutput = `<textarea\nlabel="${qlabel}" optional="0" ss:listDisplay="1" height="10" width="50" verify="len(3)" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n${roptions}\n${coptions}\n</textarea>\n<suspend/>`;
    } else if (row.length > 0 && col.length > 0 && choice.length == 0) {
        const { options: roptions } = makeOption(row, 'row', { value: false });
        const { options: choptions } = makeOption(col, 'row', { value: false });
        finalOutput = `<textarea\nlabel="${qlabel}" optional="0" ss:listDisplay="1" height="10" width="50" verify="len(3)" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n${roptions}\n</textarea>\n<suspend/>`;
    } else if (row.length > 0 && col.length == 0 && choice.length > 0) {
        const { options: roptions } = makeOption(row, 'row', { value: false });
        const { options: choptions } = makeOption(choice, 'row', { value: false });
        finalOutput = `<textarea\nlabel="${qlabel}" optional="0" ss:listDisplay="1" height="10" width="50" verify="len(3)" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n${roptions}\n</textarea>\n<suspend/>`;
    } else if (row.length == 0 && col.length > 0 && choice.length > 0) {
        const { options: coptions } = makeOption(col, 'col', { value: false });
        const { options: choptions } = makeOption(choice, 'row', { value: false });
        finalOutput = `<textarea\nlabel="${qlabel}" optional="0" ss:listDisplay="1" height="10" width="50" verify="len(3)" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n${coptions}\n</textarea>\n<suspend/>`;
    } else if (row.length > 0 && col.length == 0 && choice.length == 0) {
        const { options: choptions } = makeOption(row, 'row', { value: false });
        finalOutput = `<textarea\nlabel="${qlabel}" optional="0" ss:listDisplay="1" height="10" width="50" verify="len(3)" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n</textarea>\n<suspend/>`;
    } else if (row.length == 0 && col.length > 0 && choice.length == 0) {
        const { options: choptions } = makeOption(col, 'choice', { value: false });
        finalOutput = `<textarea\nlabel="${qlabel}" optional="0" ss:listDisplay="1" height="10" width="50" verify="len(3)" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n</textarea>\n<suspend/>`;
    } else {
        const { options: choptions } = makeOption(choice, 'row', { value: false });
        finalOutput = `<textarea\nlabel="${qlabel}" optional="0" ss:listDisplay="1" height="10" width="50" verify="len(3)" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n</textarea>\n<suspend/>`;
    }
    insertContentIntoEditor(finalOutput + '\n\n');
}

//function to make Number question
function makeNumber(content) {
    if (content === undefined) {
        const tinymce_editor = tinymce.get('tinymce-editor');
        const selectedHtml = tinymce_editor.selection.getContent({ format: 'html' });
        if (selectedHtml.trim() === '') {
            const selectedText = getSelectedTextOrPlaceholder();
            if (selectedText.trim() === '') {
                showWarning('Please select something in the Docx-Editor.');
                return;
            } content = selectedText;
        } else {
            const selection = tinymce_editor.selection;
            const selectedNode = selection.getNode();
            content = addbiuFormatting(selectedNode, selectedHtml);
        }
    }
    content = content.replace(/(<br\s*\/?>\s*<br\s*\/?>)/g, '').replace(/ +/g, ' ').trim();

    let qAttributes = '', qcomment = '';
    // Check for comments in the content
    for (const com of comments) {
        if (content.includes(com)) {
            qcomment = com;
            content = content.replace(com, '');
            break;
        }
    }

    // Check for randomize in content
    if (content.toLowerCase().includes('randomize')) {
        qAttributes += ' shuffle="rows"';
    }
    const { qlabel, qtitle, remainingContents } = getLabelTitle(content);
    const { comment, row, col, choice } = getCommentRowCol(remainingContents);
    if (qcomment == '' && comment.length > 0) {
        qcomment = comment;
    }
    if (qcomment == '') {
        qcomment = 'Please enter a whole number';
    }
    let finalOutput = '';
    if (row.length > 0 && col.length > 0 && choice.length > 0) {
        const { options: roptions } = makeOption(row, 'row', { value: false });
        const { options: coptions } = makeOption(col, 'col', { value: false });
        const { options: choptions } = makeOption(choice, 'row', { value: false });
        finalOutput = `<number\nlabel="${qlabel}" optional="0" size="3" ss:listDisplay="1" verify="range(1,100)" ss:preText="" ss:postText="" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n${roptions}\n${coptions}\n</number>\n<suspend/>`;
    } else if (row.length > 0 && col.length > 0 && choice.length == 0) {
        const { options: roptions } = makeOption(row, 'row', { value: false });
        const { options: choptions } = makeOption(col, 'row', { value: false });
        finalOutput = `<number\nlabel="${qlabel}" optional="0" size="3" ss:listDisplay="1" verify="range(1,100)" ss:preText="" ss:postText="" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n${roptions}\n</number>\n<suspend/>`;
    } else if (row.length > 0 && col.length == 0 && choice.length > 0) {
        const { options: roptions } = makeOption(row, 'row', { value: false });
        const { options: choptions } = makeOption(choice, 'row', { value: false });
        finalOutput = `<number\nlabel="${qlabel}" optional="0" size="3" ss:listDisplay="1" verify="range(1,100)" ss:preText="" ss:postText="" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n${roptions}\n</number>\n<suspend/>`;
    } else if (row.length == 0 && col.length > 0 && choice.length > 0) {
        const { options: coptions } = makeOption(col, 'col', { value: false });
        const { options: choptions } = makeOption(choice, 'row', { value: false });
        finalOutput = `<number\nlabel="${qlabel}" optional="0" size="3" ss:listDisplay="1" verify="range(1,100)" ss:preText="" ss:postText="" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n${coptions}\n</number>\n<suspend/>`;
    } else if (row.length > 0 && col.length == 0 && choice.length == 0) {
        const { options: choptions } = makeOption(row, 'row', { value: false });
        finalOutput = `<number\nlabel="${qlabel}" optional="0" size="3" ss:listDisplay="1" verify="range(1,100)" ss:preText="" ss:postText="" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n</number>\n<suspend/>`;
    } else if (row.length == 0 && col.length > 0 && choice.length == 0) {
        const { options: choptions } = makeOption(col, 'choice', { value: false });
        finalOutput = `<number\nlabel="${qlabel}" optional="0" size="3" ss:listDisplay="1" verify="range(1,100)" ss:preText="" ss:postText="" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n</number>\n<suspend/>`;
    } else {
        const { options: choptions } = makeOption(choice, 'row', { value: false });
        finalOutput = `<number\nlabel="${qlabel}" optional="0" size="3" ss:listDisplay="1" verify="range(1,100)" ss:preText="" ss:postText="" ${qAttributes}>\n  <title>${qtitle}</title>\n  <comment>${qcomment}</comment>\n${choptions}\n</number>\n<suspend/>`;
    }
    insertContentIntoEditor(finalOutput + '\n\n');
}

// Function to make case based on content
function makeCase(content) {
    let flag = 0;
    if (content === undefined) {
        flag = 1;
        const tinymce_editor = tinymce.get('tinymce-editor');
        const selectedHtml = tinymce_editor.selection.getContent({ format: 'html' });
        if (selectedHtml.trim() === '') {
            const selectedText = getSelectedTextOrPlaceholder();
            if (selectedText.trim() === '') {
                showWarning('Please select something in the Docx-Editor.');
                return;
            } content = selectedText;
        } else {
            const selection = tinymce_editor.selection;
            const selectedNode = selection.getNode();
            content = addbiuFormatting(selectedNode, selectedHtml);
        }
    }
    content = content.replace(/(<br\s*\/?>\s*<br\s*\/?>)/g, '').replace(/ +/g, ' ').trim();

    let index = 1;
    let options = '';
    let optionList = [];
    const cleanPnChecked = document.getElementById('clean-pn').checked;
    const cleanPnBracketChecked = document.getElementById('clean-pn-bracket').checked;
    const lines = content ? content.split('\n') : [content];
    let ltex = 'c';
    for (let j = 0; j < lines.length; j++) {
        let optionLabel, remainingPart;
        let line = lines[j].trim();

        if (cleanPnChecked) {
            line = line.replace(/\[.*?\]/g, '');
        }
        if (cleanPnBracketChecked) {
            line = line.replace(/\(.*?\)/g, '');
        }

        line = removeEmptyTags(line);
        let firstPart;
        let regex2 = /^([^\s\.\)]+)[\.\)](.*)$/;
        let match2 = line.match(regex2);
        if (match2) {
            firstPart = match2[1].trim();
            remainingPart = match2[2].trim();
        } else {
            firstPart = '';
            remainingPart = line.trim();
        }
        // Extract tags and text from firstPart
        const tags = firstPart.match(/<[^>]+>/g) || [];
        firstPart = firstPart.replace(/<[^>]+>/g, '');

        // Prepend tags to the remainingPart
        for (let i = tags.length - 1; i >= 0; i--) {
            remainingPart = tags[i] + remainingPart;
        }
        remainingPart = removeEmptyTags(remainingPart);
        remainingPart = remainingPart.trim();
        if (remainingPart === '') {
            continue;
        }
        optionLabel = `${ltex}${index++}`;

        optionList.push(`<case label="${optionLabel}" cond="">${remainingPart}</case>`);
    }
    optionList.push(`<case label="c${index}" cond="1">UNDEFINED</case>`);
    options = optionList.join('\n');
    if (flag === 1) {
        insertContentIntoEditor(options);
    } else {
        return options;
    }
}

// Function to make case based on content
function makePipe() {
    const tinymce_editor = tinymce.get('tinymce-editor');
    const selectedHtml = tinymce_editor.selection.getContent({ format: 'html' });
    if (selectedHtml.trim() === '') {
        const selectedText = getSelectedTextOrPlaceholder();
        if (selectedText.trim() === '') {
            showWarning('Please select something in the Docx-Editor.');
            return;
        } content = selectedText;
    } else {
        const selection = tinymce_editor.selection;
        const selectedNode = selection.getNode();
        content = addbiuFormatting(selectedNode, selectedHtml);
    }
    const cases = makeCase(content);
    insertContentIntoEditor('<pipe label="" capture="" onLoad="fixupPipe()">\n' + cases + '</pipe>' + '\n\n');
}

// Function to make groups based on content
function makeGroups(content) {
    const tinymce_editor = tinymce.get('tinymce-editor');
    const selectedHtml = tinymce_editor.selection.getContent({ format: 'html' });
    if (selectedHtml.trim() === '') {
        const selectedText = getSelectedTextOrPlaceholder();
        if (selectedText.trim() === '') {
            showWarning('Please select something in the Docx-Editor.');
            return;
        } content = selectedText;
    } else {
        const selection = tinymce_editor.selection;
        const selectedNode = selection.getNode();
        content = addbiuFormatting(selectedNode, selectedHtml);
    }
    content = content.replace(/(<br\s*\/?>\s*<br\s*\/?>)/g, '').replace(/ +/g, ' ').trim();

    let index = 1;
    let options = '';
    let optionList = [];
    const cleanPnChecked = document.getElementById('clean-pn').checked;
    const cleanPnBracketChecked = document.getElementById('clean-pn-bracket').checked;
    const lines = content ? content.split('\n') : [content];
    let ltex = 'g';
    for (let j = 0; j < lines.length; j++) {
        let optionLabel, remainingPart;
        let line = lines[j].trim();

        if (cleanPnChecked) {
            line = line.replace(/\[.*?\]/g, '');
        }
        if (cleanPnBracketChecked) {
            line = line.replace(/\(.*?\)/g, '');
        }

        line = removeEmptyTags(line);
        let firstPart;
        let regex2 = /^([^\s\.\)]+)[\.\)](.*)$/;
        let match2 = line.match(regex2);
        if (match2) {
            firstPart = match2[1].trim();
            remainingPart = match2[2].trim();
        } else {
            firstPart = '';
            remainingPart = line.trim();
        }
        // Extract tags and text from firstPart
        const tags = firstPart.match(/<[^>]+>/g) || [];
        firstPart = firstPart.replace(/<[^>]+>/g, '');

        // Prepend tags to the remainingPart
        for (let i = tags.length - 1; i >= 0; i--) {
            remainingPart = tags[i] + remainingPart;
        }
        remainingPart = removeEmptyTags(remainingPart);


        remainingPart = remainingPart.trim();
        if (remainingPart === '') {
            continue;
        }
        optionLabel = `${ltex}${index++}`;

        optionList.push(`<group label="${optionLabel}">${remainingPart}</group>`);
    }
    options = optionList.join('\n');
    insertContentIntoEditor(options);
}

// Function to make list based on content
function makeList() {
    const tinymce_editor = tinymce.get('tinymce-editor');
    const selectedHtml = tinymce_editor.selection.getContent({ format: 'html' });
    if (selectedHtml.trim() === '') {
        const selectedText = getSelectedTextOrPlaceholder();
        if (selectedText.trim() === '') {
            showWarning('Please select something in the Docx-Editor.');
            return;
        } content = selectedText;
    } else {
        const selection = tinymce_editor.selection;
        const selectedNode = selection.getNode();
        content = addbiuFormatting(selectedNode, selectedHtml);
    }
    content = content.replace(/(<br\s*\/?>\s*<br\s*\/?>)/g, '').replace(/ +/g, ' ').trim();

    let optionList = [];
    const cleanPnChecked = document.getElementById('clean-pn').checked;
    const cleanPnBracketChecked = document.getElementById('clean-pn-bracket').checked;
    const lines = content ? content.split('\n') : [content];
    for (let j = 0; j < lines.length; j++) {
        let remainingPart;
        let line = lines[j].trim();

        if (cleanPnChecked) {
            line = line.replace(/\[.*?\]/g, '');
        }
        if (cleanPnBracketChecked) {
            line = line.replace(/\(.*?\)/g, '');
        }

        line = removeEmptyTags(line);
        let firstPart;
        let regex2 = /^([^\s\.\)]+)[\.\)](.*)$/;
        let match2 = line.match(regex2);
        if (match2) {
            firstPart = match2[1].trim();
            remainingPart = match2[2].trim();
        } else {
            firstPart = '';
            remainingPart = line.trim();
        }
        // Extract tags and text from firstPart
        const tags = firstPart.match(/<[^>]+>/g) || [];
        firstPart = firstPart.replace(/<[^>]+>/g, '');

        // Prepend tags to the remainingPart
        for (let i = tags.length - 1; i >= 0; i--) {
            remainingPart = tags[i] + remainingPart;
        }
        remainingPart = removeEmptyTags(remainingPart);


        remainingPart = remainingPart.trim();
        if (remainingPart === '') {
            continue;
        }

        optionList.push(`<li>${remainingPart}</li>`);
    }
    const options = optionList.join('\n');
    insertContentIntoEditor(options);
}
// Function to make Nets based on content
function makeNets() {
    const tinymce_editor = tinymce.get('tinymce-editor');
    const selectedHtml = tinymce_editor.selection.getContent({ format: 'html' });
    if (selectedHtml.trim() === '') {
        const selectedText = getSelectedTextOrPlaceholder();
        if (selectedText.trim() === '') {
            showWarning('Please select something in the Docx-Editor.');
            return;
        } content = selectedText;
    } else {
        const selection = tinymce_editor.selection;
        const selectedNode = selection.getNode();
        content = addbiuFormatting(selectedNode, selectedHtml);
    }
    content = content.replace(/(<br\s*\/?>\s*<br\s*\/?>)/g, '').replace(/ +/g, ' ').trim();

    let optionList = [];
    const cleanPnChecked = document.getElementById('clean-pn').checked;
    const cleanPnBracketChecked = document.getElementById('clean-pn-bracket').checked;
    const lines = content ? content.split('\n') : [content];
    for (let j = 0; j < lines.length; j++) {
        let remainingPart;
        let line = lines[j].trim();

        if (cleanPnChecked) {
            line = line.replace(/\[.*?\]/g, '');
        }
        if (cleanPnBracketChecked) {
            line = line.replace(/\(.*?\)/g, '');
        }

        line = removeEmptyTags(line);
        let firstPart;
        let regex2 = /^([^\s\.\)]+)[\.\)](.*)$/;
        let match2 = line.match(regex2);
        if (match2) {
            firstPart = match2[1].trim();
            remainingPart = match2[2].trim();
        } else {
            firstPart = '';
            remainingPart = line.trim();
        }
        // Extract tags and text from firstPart
        const tags = firstPart.match(/<[^>]+>/g) || [];
        firstPart = firstPart.replace(/<[^>]+>/g, '');

        // Prepend tags to the remainingPart
        for (let i = tags.length - 1; i >= 0; i--) {
            remainingPart = tags[i] + remainingPart;
        }
        remainingPart = removeEmptyTags(remainingPart);


        remainingPart = remainingPart.trim();
        if (remainingPart === '') {
            continue;
        }

        optionList.push(`<net labels="">${remainingPart}</net>`);
    }
    const options = optionList.join('\n');
    insertContentIntoEditor(options);
}

// Function to make ResourceTag based on content
function makeResourceTag() {
    const tinymce_editor = tinymce.get('tinymce-editor');
    const selectedHtml = tinymce_editor.selection.getContent({ format: 'html' });
    if (selectedHtml.trim() === '') {
        const selectedText = getSelectedTextOrPlaceholder();
        if (selectedText.trim() === '') {
            showWarning('Please select something in the Docx-Editor.');
            return;
        } content = selectedText;
    } else {
        const selection = tinymce_editor.selection;
        const selectedNode = selection.getNode();
        content = addbiuFormatting(selectedNode, selectedHtml);
    }
    content = content.replace(/(<br\s*\/?>\s*<br\s*\/?>)/g, '').replace(/ +/g, ' ').trim();

    let optionList = [];
    const cleanPnChecked = document.getElementById('clean-pn').checked;
    const cleanPnBracketChecked = document.getElementById('clean-pn-bracket').checked;
    const lines = content ? content.split('\n') : [content];
    for (let j = 0; j < lines.length; j++) {
        let remainingPart;
        let line = lines[j].trim();

        if (cleanPnChecked) {
            line = line.replace(/\[.*?\]/g, '');
        }
        if (cleanPnBracketChecked) {
            line = line.replace(/\(.*?\)/g, '');
        }

        line = removeEmptyTags(line);
        let firstPart;
        let regex2 = /^([^\s\.\)]+)[\.\)](.*)$/;
        let match2 = line.match(regex2);
        if (match2) {
            firstPart = match2[1].trim();
            remainingPart = match2[2].trim();
        } else {
            firstPart = '';
            remainingPart = line.trim();
        }
        // Extract tags and text from firstPart
        const tags = firstPart.match(/<[^>]+>/g) || [];
        firstPart = firstPart.replace(/<[^>]+>/g, '');

        // Prepend tags to the remainingPart
        for (let i = tags.length - 1; i >= 0; i--) {
            remainingPart = tags[i] + remainingPart;
        }
        remainingPart = removeEmptyTags(remainingPart);
        remainingPart = remainingPart.trim();
        if (remainingPart === '') {
            continue;
        }

        optionList.push(`<res labels="">${remainingPart}</res>`);
    }
    const options = optionList.join('\n');
    insertContentIntoEditor(options);
}
// Function to make Term
function makeTerm() {
    const tinymce_editor = tinymce.get('tinymce-editor');
    const selectedHtml = tinymce_editor.selection.getContent({ format: 'html' });
    let content;
    if (selectedHtml.trim() === '') {
        const selectedText = getSelectedTextOrPlaceholder();
        if (selectedText.trim() === '') {
            showWarning('Please select something in the Docx-Editor.');
            return;
        }
        content = selectedText;
    } else {
        const selection = tinymce_editor.selection;
        const selectedNode = selection.getNode();
        content = addbiuFormatting(selectedNode, selectedHtml);
    }

    content = content.replace(/(<br\s*\/?>\s*<br\s*\/?>)/g, '').replace(/ +/g, ' ').trim();
    const cleanPnChecked = document.getElementById('clean-pn').checked;
    const cleanPnBracketChecked = document.getElementById('clean-pn-bracket').checked;
    if (cleanPnChecked) {
        content = content.replace(/\[.*?\]/g, '');
    }
    if (cleanPnBracketChecked) {
        content = content.replace(/\(.*?\)/g, '');
    }
    content = removeEmptyTags(content);
    content = content.replace(/\n/g, ', ');
    content = `<term label="" cond="">${content}</term>\n\n`
    content = content.replace(/\s*,\s*(?=<\/term>)/g, '');
    insertContentIntoEditor(content);
}
// Function to generate XML
function generateXML() {
    const tinymce_editor = tinymce.get('tinymce-editor');
    const selectedHtml = tinymce_editor.getContent({ format: 'html' });
    let content;
    if (selectedHtml.trim() === '') {
        const selectedText = getSelectedTextOrPlaceholder();
        if (selectedText.trim() === '') {
            showWarning('Please select something in the Docx-Editor.');
            return;
        } content = selectedText;
    } else {
        const selection = tinymce_editor.selection;
        const selectedNode = selection.getNode();
        content = addbiuFormatting(selectedNode, selectedHtml);
    }
    content = content.replace(/(<br\s*\/?>\s*<br\s*\/?>)/g, '').replace(/ +/g, ' ').trim();
    const lines = content ? content.split('\n') : [content];
    const radioRegex = /\[\s*(single|HIDDEN|single select)\s*\]/i;
    const checkboxRegex = /\[\s*(multi|multiple|multi select|multiple select)\s*\]/i;
    const numberRegex = /\[\s*(numeric)\s*\]/i;
    const textRegex = /\[\s*(openend|open-end|oe)\s*\]/i;
    const textAreaRegex = /\[\s*(essay|long openend|long open-end|long oe)\s*\]/i;
    const selectRegex = /\[\s*(dropdown|drop-down)\s*\]/i;
    const htmlRegex = /\[\s*(intro)\s*\]/i;
    let question = '';
    let currentType = '';

    function processQuestion(type, question) {
        switch (type) {
            case 'radio':
                makeRadio(question);
                break;
            case 'checkbox':
                makeCheckbox(question);
                break;
            case 'number':
                makeNumber(question);
                break;
            case 'text':
                makeText(question);
                break;
            case 'textArea':
                makeTextArea(question);
                break;
            case 'select':
                makeSelect(question);
                break;
            case 'html':
                makeHtml(question);
                break;
        }
    }
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (radioRegex.test(line)) {
            if (question) processQuestion(currentType, question); // Process previous question
            currentType = 'radio';
            question = line + '\n';
        } else if (checkboxRegex.test(line)) {
            if (question) processQuestion(currentType, question); // Process previous question
            currentType = 'checkbox';
            question = line + '\n';
        } else if (numberRegex.test(line)) {
            if (question) processQuestion(currentType, question); // Process previous question
            currentType = 'number';
            question = line + '\n';
        } else if (textRegex.test(line)) {
            if (question) processQuestion(currentType, question); // Process previous question
            currentType = 'text';
            question = line + '\n';
        } else if (textAreaRegex.test(line)) {
            if (question) processQuestion(currentType, question); // Process previous question
            currentType = 'textArea';
            question = line + '\n';
        } else if (selectRegex.test(line)) {
            if (question) processQuestion(currentType, question); // Process previous question
            currentType = 'select';
            question = line + '\n';
        } else if (htmlRegex.test(line)) {
            if (question) processQuestion(currentType, question); // Process previous question
            currentType = 'html';
            question = line + '\n';
        } else {
            if (currentType) {
                question += line + '\n'; // Continue building the current question
            }
        }

        // Check for the end of the current question block
        if (i === lines.length - 1 && question) {
            processQuestion(currentType, question);
        }
    }
}