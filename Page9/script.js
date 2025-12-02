let totalArea = 0;
let persons = [];
let operations = [];
let operationIdCounter = 0;
let partIdCounter = 0;

// DOM Elements
const totalAreaDisplay = document.getElementById('totalArea');
const resultsBody = document.getElementById('resultsBody');
const operationsList = document.getElementById('operationsList');
const transferFromSelect = document.getElementById('transferFrom');
const transferToSelect = document.getElementById('transferTo');
const splitPersonSelect = document.getElementById('splitPersonSelect');

function calculateArea() {
    const w1 = parseFloat(document.getElementById('width1').value) || 0;
    const w2 = parseFloat(document.getElementById('width2').value) || 0;
    const len = parseFloat(document.getElementById('length').value) || 0;

    totalArea = ((w1 + w2) / 2) * len;
    totalAreaDisplay.textContent = totalArea.toFixed(2);

    redistribute();
}

function addPerson() {
    const nameInput = document.getElementById('personName');
    const name = nameInput.value.trim();

    if (name) {
        persons.push({ name: name, share: 0, parts: [] });
        nameInput.value = '';
        updateTransferDropdowns();
        redistribute();
    } else {
        alert('الرجاء إدخال اسم الشخص');
    }
}

function addDeduction() {
    const valueInput = document.getElementById('deductionValue');
    const nameInput = document.getElementById('deductionName');
    const value = parseFloat(valueInput.value);
    const name = nameInput.value.trim();

    if (value > 0) {
        operations.push({
            id: operationIdCounter++,
            type: 'deduction',
            value: value,
            name: name
        });
        valueInput.value = '';
        nameInput.value = '';
        redistribute();
    } else {
        alert('الرجاء إدخال قيمة خصم صحيحة');
    }
}

function transfer() {
    const fromIndex = transferFromSelect.value;
    const toIndex = transferToSelect.value;
    const valueInput = document.getElementById('transferValue');
    const value = parseFloat(valueInput.value);

    if (fromIndex !== "" && toIndex !== "" && fromIndex !== toIndex && value > 0) {
        const fromName = persons[fromIndex].name;
        const toName = persons[toIndex].name;

        operations.push({
            id: operationIdCounter++,
            type: 'transfer',
            from: fromName,
            to: toName,
            value: value
        });
        valueInput.value = '';
        redistribute();
    } else {
        alert('الرجاء التأكد من البيانات المدخلة (يجب اختيار شخصين مختلفين وقيمة صحيحة)');
    }
}

function addPart() {
    const personIndex = splitPersonSelect.value;
    const nameInput = document.getElementById('partName');
    const valueInput = document.getElementById('partValue');
    const name = nameInput.value.trim();
    const value = parseFloat(valueInput.value);

    if (personIndex !== "" && value > 0) {
        const person = persons[personIndex];

        // Calculate current share to ensure enough space
        // We need to run a temporary redistribution or check current share from last render?
        // Better to check against the calculated share in the object (which is updated in redistribute)
        // However, redistribute() updates persons[i].share. So we can check that.

        if (value > person.share) {
            alert('قيمة الجزء أكبر من النصيب المتاح للشخص!');
            return;
        }

        person.parts.push({
            id: partIdCounter++,
            name: name || 'جزء',
            value: value
        });

        nameInput.value = '';
        valueInput.value = '';
        redistribute();
    } else {
        alert('الرجاء اختيار شخص وإدخال قيمة صحيحة');
    }
}

function deletePart(personIndex, partId) {
    const person = persons[personIndex];
    person.parts = person.parts.filter(p => p.id !== partId);
    redistribute();
}

function deleteOperation(id) {
    operations = operations.filter(op => op.id !== id);
    redistribute();
}

function redistribute() {
    // 1. Calculate Net Distributable Area
    let totalDeductions = 0;
    operations.forEach(op => {
        if (op.type === 'deduction') {
            totalDeductions += op.value;
        }
    });

    const netArea = totalArea - totalDeductions;

    // 2. Initial Distribution
    const personCount = persons.length;
    let baseShare = 0;
    if (personCount > 0) {
        baseShare = netArea / personCount;
    }

    // Reset shares
    persons.forEach(p => p.share = baseShare);

    // 3. Apply Transfers
    operations.forEach(op => {
        if (op.type === 'transfer') {
            const fromPerson = persons.find(p => p.name === op.from);
            const toPerson = persons.find(p => p.name === op.to);

            if (fromPerson && toPerson) {
                fromPerson.share -= op.value;
                toPerson.share += op.value;
            }
        }
    });

    // 4. Apply Parts Splitting (Visual only? No, it reduces the "main" share displayed)
    // The prompt says: "يُطرح هذا الجزء من نصيب الشخص الأساسي."
    // So we subtract parts from the share.
    persons.forEach(p => {
        if (p.parts) {
            p.parts.forEach(part => {
                p.share -= part.value;
            });
        }
    });

    render();
}

function updateTransferDropdowns() {
    transferFromSelect.innerHTML = '<option value="">اختر الشخص</option>';
    transferToSelect.innerHTML = '<option value="">اختر الشخص</option>';
    splitPersonSelect.innerHTML = '<option value="">اختر الشخص</option>';

    persons.forEach((p, index) => {
        const option1 = document.createElement('option');
        option1.value = index;
        option1.textContent = p.name;
        transferFromSelect.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = index;
        option2.textContent = p.name;
        transferToSelect.appendChild(option2);

        const option3 = document.createElement('option');
        option3.value = index;
        option3.textContent = p.name;
        splitPersonSelect.appendChild(option3);
    });
}

function render() {
    // Render Results Table
    resultsBody.innerHTML = '';
    persons.forEach((p, index) => {
        const groupClass = index % 2 === 0 ? 'group-even' : 'group-odd';

        // Main Row
        const row = document.createElement('tr');
        row.className = `${groupClass} person-main-row`;
        row.innerHTML = `
      <td>${p.name}</td>
      <td>${p.share.toFixed(2)}</td>
    `;
        resultsBody.appendChild(row);

        // Nested Rows for Parts
        if (p.parts && p.parts.length > 0) {
            p.parts.forEach(part => {
                const partRow = document.createElement('tr');
                partRow.className = `nested-row ${groupClass}`;
                partRow.innerHTML = `
                    <td class="nested-name">
                        └── جزء: ${part.name}
                        <button class="delete-part-btn" onclick="deletePart(${index}, ${part.id})">❌</button>
                    </td>
                    <td class="nested-value">${part.value.toFixed(2)}</td>
                `;
                resultsBody.appendChild(partRow);
            });
        }
    });

    // Render Operations List
    operationsList.innerHTML = '';
    operations.forEach(op => {
        const div = document.createElement('div');
        div.className = `operation-item ${op.type}`;

        let text = '';
        if (op.type === 'deduction') {
            text = `خصم: ${op.value} م² ${op.name ? '(' + op.name + ')' : ''}`;
        } else {
            // RTL Arrow: Left Arrow (&larr;) because text is RTL
            // "From" is on the Right, "To" is on the Left visually in RTL
            text = `${op.from} &larr; ${op.to} : نقل ${op.value} م²`;
        }

        div.innerHTML = `
      <span>${text}</span>
      <button class="delete-btn" onclick="deleteOperation(${op.id})">❌</button>
    `;
        operationsList.appendChild(div);
    });
}
