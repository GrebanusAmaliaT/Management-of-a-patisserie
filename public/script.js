//FRONTEND

// Funcția care obține și afișează opțiunile de sortare pe baza tabelului ales
let columnNames;
async function updateSortByOptions() {
    const table = document.getElementById('tableSelect').value;
    
    await fetch(`/columns?table=${table}`)
        .then(response => response.json())
        .then(columns => {
            const sortBySelect = document.getElementById('sortBy');
            sortBySelect.innerHTML = '';  
            columnNames = columns
       
            columns.forEach(column => {
                const option = document.createElement('option');
                option.value = column;
                option.textContent = column;
                sortBySelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Eroare:', error);
        });
    loadData()
}

// Funcția care obține datele din server și le afișează în tabel
function loadData() {
    const table = document.getElementById('tableSelect').value;

    const sortBy = document.getElementById('sortBy').value;
    console.log(table)
    fetch(`/data?table=${table}&sortBy=${sortBy}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('dataTable').getElementsByTagName('tbody')[0];
            tableBody.innerHTML = ''; 

            data.forEach(row => {
                const tableRow = tableBody.insertRow();
                row.forEach(cell => {
                    const tableCell = tableRow.insertCell();
                    tableCell.textContent = cell;
                });
                const actionCell = tableRow.insertCell();

                // Creează butonul Update
                const updateButton = document.createElement('button');
                updateButton.textContent = 'Update';
                updateButton.onclick = () => handleUpdate(row, table); // Funcție pentru gestionarea actualizării
                actionCell.appendChild(updateButton);

                // Creează butonul Delete
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.onclick = () => handleDelete(row, table); // Funcție pentru gestionarea ștergerii
                actionCell.appendChild(deleteButton);
            
            });
        })
        .catch(error => {
            console.error('Eroare:', error);
        });
    document.getElementById('load').innerHTML = '';
}
//////////////////////////////////////////////////////////////////////

function getPrimaryKeyColumns(table) {
    switch (table) {
        case 'sector':
            return { id: ['id_sector'] };
        case 'client':
            return { id: ['id_client'] };
        case 'comanda':
            return { id: ['id_comanda'] };
        case 'angajat':
            return { id: ['id_angajat'] };
        case 'furnizor':
            return { id: ['id_furnizor'] };
        case 'produs_comanda':
            return { id: ['id_produs', 'id_comanda'] };
        case 'produs':
                return { id: ['id_produs'] };
        case 'ingredient':
            return { id: ['id_ingredient'] };
        case 'ingredient_produs':
                return { id: ['id_ingredient', 'id_produs'] };
        default:
            throw new Error(`Cheia primară pentru tabelul ${table} nu este definită.`);
    }
}

function handleDelete(row, table) {
    let combinedObject = columnNames.reduce((obj, key, index) => {
        obj[key] = row[index];
        return obj;
    }, {});
    let idDelete = {}
    getPrimaryKeyColumns(table.toLowerCase())
    .id.forEach((value)=>{
        columnNameUperCase = value.toUpperCase()
        idDelete[columnNameUperCase] = combinedObject[columnNameUperCase]
    })
    deleteRow(table, idDelete)
}


function handleUpdate(row, table) {
    
    let combinedObject = columnNames.reduce((obj, key, index) => {
        obj[key] = row[index];
        return obj;
    }, {});
    
    let initialId = {}
    getPrimaryKeyColumns(table.toLowerCase())
    .id.forEach((value)=>{
        columnNameUperCase = value.toUpperCase()
        initialId[columnNameUperCase] = combinedObject[columnNameUperCase]
    })
    console.log(`Initial id is ${initialId}`)

    const loadDiv = document.getElementById('load');
    const form = document.createElement('form');
    const select = document.createElement('select');
    select.id = 'keySelect';
    Object.keys(combinedObject).forEach((key) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key;
        select.appendChild(option);
    });

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'valueInput';
    input.placeholder = 'Enter new value';
    function updateInputValue() {
        const selectedKey = select.value;
        input.value = combinedObject[selectedKey]; // Set input value to the current value in obj
      };
    select.addEventListener('change', updateInputValue);
    input.addEventListener('input', () => {
        const selectedKey = select.value;
        combinedObject[selectedKey] = input.value; // Update the object with the new value
        console.log('Updated Object:', combinedObject); // Log the updated object
    });
    // Create the send button
    const button = document.createElement('button');
    button.type = 'button'; // Prevent form submission
    button.textContent = 'Send';
    button.onclick = () => {
        updateRow(table, initialId, combinedObject)
    };

    // Append elements to the form
    form.appendChild(select);
    form.appendChild(input);
    form.appendChild(button);

    // Append the form to the 'load' div
    loadDiv.appendChild(form);
    updateInputValue()

}

async function deleteRow(table, ids, alarm = true) {
    const primaryKeysString = encodeURIComponent(JSON.stringify(ids));
    const response = await fetch(`/delete/${table}?id=${primaryKeysString}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
        if(alarm == true)
        alert('Datele au fost actualizate!');
        loadData(); // Reîncarcă datele
        document.getElementById('load').innerHTML = '';
    } else {
        alert('Eroare la actualizarea datelor.');
    }
}


async function updateRow(table, ids, updatedData) {
    const primaryKeysString = encodeURIComponent(JSON.stringify(ids));
    const response = await fetch(`/edit/${table}?id=${primaryKeysString}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
    });

    if (response.ok) {
        alert('Datele au fost actualizate!');
        loadData(); // Reîncarcă datele
        document.getElementById('load').innerHTML = '';
    } else {
        alert('Eroare la actualizarea datelor.');
    }
}

async function twoConditions( ) {

    const response = await fetch('http://localhost:3000/produse-lichide')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('result-table');

            data.forEach(row => {
                const tr = document.createElement('tr');
                row.forEach(cell => {
                    const td = document.createElement('td');
                    td.textContent = cell;
                    tr.appendChild(td);
                });
                tableBody.appendChild(tr);
            });
        })
        .catch(err => console.error('Eroare:', err));

}

async function populeazaTabel(url, tableBodyId, tableheadId) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(data);
        const tableBody = document.getElementById(tableBodyId);
        const tableHead = document.getElementById(tableheadId);
        tableBody.innerHTML = ''; // Golește tabelul înainte de populare

        data.columnNames.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column
            tableHead.appendChild(th)
        })

        data.rows.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
    } catch (err) {
        console.error(`Eroare la ${url}:`, err);
    }
}

async function cerintaD() {
    await populeazaTabel('http://localhost:3000/cerintaD', 'rezultateCerintaD','cerintaD');
}

async function cerintaE() {
    await populeazaTabel('http://localhost:3000/cerintaE/inainte', 'rezultateCerintaEinainte','CerintaEinainte');
    await populeazaTabel('http://localhost:3000/cerintaE/dupa', 'rezultateCerintaEdupa','CerintaEdupa');
}

async function cerintaF() {
    deleteRow('PRODUS_COMANDA',{'ID_PRODUS': 10001, 'ID_COMANDA': 10}, false)
    // Popularea celor 3 tabele
    await populeazaTabel('http://localhost:3000/getProdusComanda', 'rezultateView1Dupa','headView1Dupa');
    await populeazaTabel('http://localhost:3000/view1', 'rezultateView1','headView1');
    await populeazaTabel('http://localhost:3000/getProdusComanda', 'rezultateView1Dupa2','headView1Dupa2');

    await populeazaTabel('http://localhost:3000/view2', 'rezultateView2','headView2');

}

////////////////////////////////f


  
window.onload = () => {
    updateSortByOptions()
    twoConditions()
    cerintaD()
    cerintaE()
    cerintaF()
};