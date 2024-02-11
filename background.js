const
    preHanguls = 'rRseEfaqQtTdwWczxvgkoiOjpuPhynbml',
    hanguls = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎㅏㅐㅑㅒㅓㅔㅕㅖㅗㅛㅜㅠㅡㅣ',
    disassembledHanguls = ['ㅗㅏ', 'ㅗㅐ', 'ㅗㅣ', 'ㅜㅓ', 'ㅜㅔ', 'ㅜㅣ', 'ㅡㅣ', 'ㄱㅅ', 'ㄴㅈ', 'ㄴㅎ', 'ㄹㄱ', 'ㄹㅁ', 'ㄹㅂ', 'ㄹㅅ', 'ㄹㅌ', 'ㄹㅍ', 'ㄹㅎ', 'ㅂㅅ'],
    assembledHanguls = 'ㅘㅙㅚㅝㅞㅟㅢㄳㄵㄶㄺㄻㄼㄽㄾㄿㅀㅄ',
    unicodeFirstKO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ',
    unicodeMidKO = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ',
    unicodeEndKO = '-ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ',
    unicodeFirstEN = 'rRseEfaqQtTdwWczxvg',
    unicodeMidEN = ['k', 'o', 'i', 'O', 'j', 'p', 'u', 'P', 'h', 'hk', 'ho', 'hl', 'y', 'n', 'nj', 'np', 'nl', 'b', 'm', 'ml', 'l'],
    unicodeEndEN = ['', 'r', 'R', 'rt', 's', 'sw', 'sg', 'e', 'f', 'fr', 'fa', 'fq', 'ft', 'fx', 'fv', 'fg', 'a', 'q', 'qt', 't', 'T', 'd', 'w', 'c', 'z', 'x', 'v', 'g'];

let lineNow = '';
let previousCursorPosition = -1;

const hid = document.createElement('div');
resetHID();
document.body.insertBefore(hid, document.body.firstChild);

window.addEventListener ? window.addEventListener('focus', onFocusChange, true) : window.attachEvent('onfocusout', onFocusChange);
setTimeout(onFocusChange, 100);

let previousActiveElement = undefined;

function resetHID(show) {
    hid.innerHTML = '';
    hid.style.position = 'fixed';
    hid.style.display = show ? '' : 'none';
    hid.style.top = '0';
    hid.style.left = '0';
    hid.style.bottom = '';
    hid.style.right = '';
    hid.style.paddingTop = '2px';
    hid.style.backgroundColor = 'darkslategray';
    hid.style.color = 'white';
    hid.style.fontSize = '12px';
    hid.style.zIndex = show ? (getMaxZIndex() + 1) : -1;
}

function updateHID(rect, transformed) {
    hid.style.zIndex = getMaxZIndex() + 1;
    const { top, left } = rect;
    if (top > 20) {
        hid.style.top = top - 20 + 'px';
    } else {
        hid.style.top = 0 + 'px';
    }
    hid.style.left = left + 'px';
    hid.innerText = transformed; // todo: escape
}

function parseElement(element) {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) 
        return [element.selectionStart, element.value, element];
    if (window.getSelection) {
        let sel = window.getSelection();
        if (sel.rangeCount) {
            const range = sel.getRangeAt(0);
            if (range.commonAncestorContainer.parentNode === element) 
                return [range.endOffset, element.textContent, sel.anchorNode];
        }
    } else if (document.selection && document.selection.createRange) {
        const range = document.selection.createRange();
        if (range.parentElement() === element) {
            let tempEl = document.createElement("span");
            element.insertBefore(tempEl, element.firstChild);
            let tempRange = range.duplicate();
            tempRange.moveToElementText(tempEl);
            tempRange.setEndPoint("EndToEnd", range);
            return [tempRange.text.length, element.textContent, element];
        }
    }
    return [0, element.textContent, element];
}

function updateElement(element, value, cursor) {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) { 
        element.value = value;
        element.selectionStart = element.selectionEnd = cursor;
        return;
    } 
    element.textContent = value;
    const range = document.createRange();
    const sel = window.getSelection();        
    range.setStart(element, cursor);
    range.collapse(true);        
    sel.removeAllRanges();
    sel.addRange(range);
}

function onKeyboardUp(e) {
    const [cursor, value, sourceElement] = parseElement(e.target);
    const rect = sourceElement.getBoundingClientRect();
    previousCursorPosition = cursor;
    const lineStart = value.substring(0, cursor).lastIndexOf('\n') + 1;
    const line = value.substring(lineStart, cursor);
    if (lineNow !== '' && e.code === 'AltRight' && e.shiftKey) {
        updateElement(
            sourceElement, 
            value.substring(0, lineStart) + lineNow + value.substring(cursor),
            lineStart + lineNow.length
        );
        if (hid.style.display === 'none') resetHID(true);
        updateHID(rect, lineNow);
        lineNow = '';
        return;
    }
    const [isTransformNecessary, transformedLine] = needTransform(line);
    lineNow = transformedLine;
    if (lineStart === cursor || !isTransformNecessary) {
        if (hid.style.display !== 'none') {
            resetHID(false);
            lineNow = '';
        }
        return;
    }
    if (hid.style.display === 'none') resetHID(true);
    updateHID(rect, lineNow);
}

function needTransform(line) {
    const words = line.split(' ');
    const ens = [], kos = [], flags = []; // flags not necessary
    let result = '', flag = 0;
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (word === '') {
            ens.push('');
            kos.push('');
            flags[i] = 0;
            continue;
        }
        const [isKO, isCaps] = isConsistKO(word)
        if (!isKO) {
            const t = transform2KO(isCaps ? removeCaps(word) : word);
            ens.push(word);
            kos.push(t);
            flags[i] = isWeirdKO(t) ? -1 : t.length < 3 ? 0 : 1;
        } else {
            ens.push(transform2EN(word));
            kos.push(word);
            flags[i] = isWeirdKO(word) ? -1 : word.length < 3 ? 0 : 1;
        }
        flag += flags[i];
    }
    result = (flag > 0 ? kos : ens).join(' ');
    return [line !== result, result];
}

function isWeirdKO(word) {
    return /([ㄱ-ㅎㅏ-ㅣ]+[가-힣]+[ㄱ-ㅎㅏ-ㅣ]+)|([가-힣]+[ㄱ-ㅎㅏ-ㅣ]+[가-힣]+)|([ㅏ-ㅣ]+[ㄱ-ㅎ가-힣]*)/g.test(word);
}

function isConsistKO(word) {
    const KOCount = ((word || '').match(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g) || []).length;
    const ENCount = ((word || '').match(/[a-zA-Z]/g) || []).length;
    const nonCapsCount = ((word || '').match(/[abcdfghijklmnsuvxyz]/g) || []).length;
    const capsCount = ((word || '').match(/[ABCDFGHIJKLMNSUVXYZ]/g) || []).length;
    return [KOCount >= ENCount, capsCount > nonCapsCount];
}

function removeCaps(word) {
    let result = ''
    let char;
    for (let i = 0; i <= word.length - 1; i++) {
        char = word[i];
        if (/[a-df-nsuvxyzA-Z]/.test(char)) result += char.toLowerCase();
        else if (/[eo-rtw]/.test(char)) result += char.toUpperCase();
        else result += char;
    }
    return result;
}

function transform2EN(word) {
    let result = '', letter, code;
    for (let i = 0; i < word.length; i++) {
        letter = word[i];
        code = letter.charCodeAt(0);
        if (code >= 44032 && code <= 55203) {
            code -= 44032;
            result += unicodeFirstEN[Math.floor(code / 588)];
            code %= 588;
            result += unicodeMidEN[Math.floor(code / 28)];
            result += unicodeEndEN[code % 28];
            continue;
        } 
        if (code >= 12593 && code <= 12622) {
            let code = unicodeFirstKO.indexOf(letter);
            if (code !== -1) {
                result += unicodeFirstEN[code];
                continue;
            }
            code = unicodeEndKO.indexOf(letter);
            if (code !== -1) {
                result += unicodeEndEN[code];
                continue;
            }
        } else if (code >= 12623 && code <= 12643) {
            code = unicodeMidKO.indexOf(letter);
            result += code !== -1 ? unicodeMidEN[code] : letter;
            continue;
        }
        result += letter;
    }
    return result;
}

function transform2KO(word) {
    let result = '', previous = [], current = [];
    for (let i = 0; i < word.length; i++) {
        const hangulIndex = preHanguls.indexOf(word[i]);
        const hangulja = hanguls[hangulIndex];
        if (hangulIndex === -1) {
            result += assemble(previous) + assemble(current) + word[i];
            previous = [];
            current = [];
            continue;
        } 
        if (hangulIndex < 19) {
            if (current.length === 0) {
                current[0] = hangulja;
                continue;
            } 
            if (current.length === 1) {
                const assembleIndex = disassembledHanguls.indexOf(current[0] + hangulja);
                result += assemble(previous);
                if (assembleIndex === -1) {
                    previous = current;
                    current = [hangulja];
                    continue;
                } 
                previous = [undefined, undefined, assembledHanguls[assembleIndex]];
                current = [];
                continue;
            } 
            if (current.length === 2) {
                const isEnd = unicodeEndKO.indexOf(hangulja);
                if (current[0] === undefined || isEnd === -1) {
                    result += assemble(previous);
                    previous = current;
                    current = [hangulja];
                    continue;
                } 
                current[2] = hangulja;
                continue;
            } 
            if (current.length === 3) {
                const assembleIndex = disassembledHanguls.indexOf(current[2] + hangulja);
                if (assembleIndex === -1) {
                    result += assemble(previous);
                    previous = current;
                    current = [hangulja];
                    continue;
                } 
                current[2] = assembledHanguls[assembleIndex];
                continue;
            }
        }     
        if (current.length === 0) {
            if (previous.length < 3) {
                current = [undefined, hangulja];
                continue;
            }            
            const disassembleIndex = assembledHanguls.indexOf(previous[2]);
            if (disassembleIndex === -1) {
                current = [previous.pop(), hangulja];
                continue;
            }
            previous[2] = disassembledHanguls[disassembleIndex][0];
            current[disassembledHanguls[disassembleIndex][1], hangulja];
            continue;
        }
        if (current.length === 1) {
            current[1] = hangulja;
            continue;
        } 
        if (current.length === 2) {
            const assembleIndex = disassembledHanguls.indexOf(current[1] + hangulja);
            if (assembleIndex === -1) {
                result += assemble(previous);
                previous = current;
                current = [undefined, hangulja];
                continue;
            } 
            current[1] = assembledHanguls[assembleIndex];
            continue;
        }
        if (current.length === 3) {
            result += assemble(previous);
            previous = current;
            const isFirst = unicodeFirstKO.indexOf(previous[2]);
            if (isFirst === -1) {
                const disassembleIndex = assembledHanguls.indexOf(previous[2]);
                if (disassembleIndex === -1) {
                    current = [undefined, hangulja];
                    continue;
                }                
                previous[2] = disassembledHanguls[disassembleIndex][0]
                current = [disassembledHanguls[disassembleIndex][1], hangulja];
                continue;
            } 
            current = [previous.pop(), hangulja];
        }
    }
    result += assemble(previous) + assemble(current);
    return result;
}

function assemble(SME) {
    if (SME.length === 0) return '';
    if (SME.length === 1) return SME[0];
    if (SME.length === 2 && SME[0] === undefined) return SME[1];
    let code = 44032 + unicodeFirstKO.indexOf(SME[0]) * 588 + unicodeMidKO.indexOf(SME[1]) * 28;
    if (SME.length === 3) code += unicodeEndKO.indexOf(SME[2]);
    return String.fromCharCode(code);
}

function onFocusChange() {
    const activeElement = document.activeElement;
    if (previousActiveElement) {
        previousActiveElement.removeEventListener('keyup', onKeyboardUp);
        previousActiveElement.removeEventListener('pointerup', onKeyboardUp);
    }
    previousCursorPosition = -1;
    if (
        activeElement instanceof HTMLTextAreaElement ||
        (activeElement instanceof HTMLInputElement &&
            (activeElement.type === 'text' ||
            activeElement.type === 'search' ||
            activeElement.type === 'email'))
        // || activeElement.isContentEditable 
    ) {
        activeElement.addEventListener('keyup', onKeyboardUp);
        activeElement.addEventListener('pointerup', onKeyboardUp);
        previousActiveElement = activeElement;
    }
}

function getMaxZIndex() {
    return Math.max(...Array.from(
        document.querySelectorAll('body *'),
        el => parseFloat(window.getComputedStyle(el).zIndex)
    ).filter(z => !isNaN(z)), 0);
}
