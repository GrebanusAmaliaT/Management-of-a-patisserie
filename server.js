const express = require('express');
const oracledb = require('oracledb');
const app = express();
const port = 3000;
// Servește fișierele statice (HTML, CSS, JS)
app.use('/styles', express.static(__dirname + '/styles'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'));

//BACKEND!!!!!!!!!!!!!!

// Configurarea conexiunii la baza de date Oracle
const dbConfig = {
  user: 'user_test',       // Înlocuiește cu numele tău de utilizator
  password: 'bazededate', // Înlocuiește cu parola ta
  connectString: 'localhost:1521/XE',
};

// Endpoint pentru a obține coloanele unui tabel
app.get('/columns', async (req, res) => {
    const table = req.query.table ? req.query.table.toUpperCase() : 'SECTOR';  // Tabelul ales, default este 'SECTOR'
  
  try {
    const connection = await oracledb.getConnection(dbConfig);

    const query = `
    SELECT column_name 
    FROM all_tab_columns 
    WHERE table_name = '${table}' 
    ORDER BY column_id
  `;

    const result = await connection.execute(query);

    const columns = result.rows.map(row => row[0]);

    res.json(columns);

    await connection.close();
  } catch (err) {
    console.error(err);
    res.status(500).send('Eroare la interogarea bazei de date');
  }
});

// Endpoint pentru a obține datele din orice tabel
app.get('/data', async (req, res) => {
    const table = req.query.table ? req.query.table.toUpperCase() : 'SECTOR';  // Tabelul ales, default este 'SECTOR'
    const sortBy = req.query.sortBy;   // Criteriul de sortare, default este 'ID'
    
    try {
        const connection = await oracledb.getConnection(dbConfig);
        
        // Interogare pentru a obține datele din tabelul selectat
        const query = `SELECT * FROM ${table} ORDER BY ${sortBy}`;
        const result = await connection.execute(query);
        
        res.json(result.rows); // Trimite datele ca JSON

        await connection.close();
        
    } catch (err) {
        console.error(err);
        res.status(500).send('Eroare la interogarea bazei de date');
    }
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
function getPrimaryKeyColumns(table) {
    switch (table) {
        case 'sector':
            return { id: 'id_sector' };
        case 'client':
            return { id: 'id_client' };
        case 'comanda':
            return { id: 'id_comanda' };
        case 'angajat':
            return { id: 'id_angajat' };
        case 'furnizor':
            return { id: 'id_furnizor' };
        // case 'produs_comanda':
        //     return { id: 'id_produs', 'id_comanda' };
        case 'produs':
                return { id: 'id_produs' };
        case 'ingredient':
            return { id: 'id_ingredient' };
        // case 'ingredient_produs':
        //         return { id: 'id_ingredient', 'id_produs' };

        // Adaugă alte tabele pe măsură ce le adaugi
        default:
            throw new Error(`Cheia primară pentru tabelul ${table} nu este definită.`);
    }
}

app.put('/edit/:table', async (req, res) => {
    
    const table = req.params.table
    const {id}  = req.query;
    let updatedData = req.body;
    
    let primaryKeys;
    i = 0;
    try {
        primaryKeys = JSON.parse(decodeURIComponent(id));
    } catch (err) {
        return res.status(400).send('Invalid primary key format');
    }

    const setClause = Object.keys(updatedData)
        .map(key => {
            i++
            return `${key} = :${i}`
        }) // Use bind variables
        .join(', ');
    const conditions = Object.keys(primaryKeys)
    .map(key => {
        i++; 
        const condition = `${key} = :${i}`; // Use the counter
        return condition;
    })
    .join(' AND ');

    try {
        const query = `
            UPDATE ${table}
            SET ${setClause}
            WHERE ${conditions}
        `;
      const connection = await oracledb.getConnection(dbConfig); 
        const bindValues = [...Object.values(updatedData), ...Object.values(primaryKeys)];
        console.log(query)
        console.log(bindValues)
    //    console.log(updatedData, aux)
        const result = await connection.execute(query, bindValues, { autoCommit: true });

        res.status(200).send({ message: 'Informațiile au fost actualizate cu succes!' });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'A apărut o eroare la actualizarea datelor.' });
    }
});
    
   
    // Endpoint pentru ștergere
app.delete('/delete/:table', async (req, res) => {
    const { table } = req.params;
    const {id}  = req.query;

    let primaryKeys;
    try {
        primaryKeys = JSON.parse(decodeURIComponent(id));
    } catch (err) {
        return res.status(400).send('Invalid primary key format');
    }
    
    const conditions = Object.keys(primaryKeys)
        .map(key => `${key} = :${key}`)
        .join(' AND ');


    try {
        const query = `
            DELETE FROM ${table}
            WHERE ${conditions}
        `;
        const connection = await oracledb.getConnection(dbConfig); 
        const result = await connection.execute(query, primaryKeys, { autoCommit: true });

        res.status(200).send({ message: 'Informațiile au fost șterse cu succes!' });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'A apărut o eroare la ștergerea datelor.' });
    }
});
//////////////////////////////////////////////////////////////////////////////////////////
async function makeSelect(query) {
    try{ 
        const connection = await oracledb.getConnection(dbConfig); 
        const result = await connection.execute(query);
        return result;
    } catch (err) {
        console.error(err);
        return undefined;
    } 
}


app.get('/produse-lichide', async (req, res) => { //punctul c

    const query = `
            SELECT ip.id_produs, f.id_furnizor,  f.livrare_gratuita, i.id_ingredient
            FROM 
                Ingredient i
            JOIN 
                Furnizor f ON i.id_furnizor = f.id_furnizor
            JOIN 
                Ingredient_Produs ip ON i.id_ingredient = ip.id_ingredient
            JOIN 
                Produs p ON ip.id_produs = p.id_produs
            WHERE 
                f.livrare_gratuita = 0
                AND i.unitate_masura = 'ml'
        `;
    let result = await makeSelect(query)    
    if (result != undefined) {
        res.json(result.rows);
    } else {
        console.error(err);
        res.status(500).send('Eroare la executarea interogării.');
    }   
});

app.get("/cerintaD", async (req, res) => { //PUNCTUL D 
    const query = `
    SELECT 
        a.id_sector,
        a.AN_ANGAJARE,
        COUNT(a.ID_ANGAJAT) AS numar_angajati,
        AVG(a.SALARIU) AS salariu_mediu
    FROM 
        Angajat a
    GROUP BY 
        a.id_sector, 
        a.AN_ANGAJARE
    HAVING 
        AVG(a.SALARIU) > 3000
    `;
    let result = await makeSelect(query)   
    let columnNames = result.metaData.map(col => col.name)
    let response = {'columnNames': columnNames, 'rows': result.rows}
    if (result != undefined) {
        res.json(response);
    } else {
        console.error(err);
        res.status(500).send('Eroare la executarea interogării.');
    } 
})

app.get("/cerintaE/inainte", async (req, res) => {
    let query = `
    INSERT ALL
        INTO Sector (id_sector, denumire, status)
        VALUES (1, 'AD', 0)
        INTO Produs (id_produs, nume_produs, gramaj, pret_unitar, calorii, sezonier, id_sector)
        VALUES (101, 'PRODUS TEMPORAR 1', 500, 20.00, 300, 0, 1)
        INTO Produs (id_produs, nume_produs, gramaj, pret_unitar, calorii, sezonier, id_sector)
        VALUES (102, 'PRODUS TEMPORAR 2', 150, 10.00, NULL, 1, 1) 
    SELECT * FROM DUAL
    `
    const connection = await oracledb.getConnection(dbConfig); 
    await connection.execute(query, [], { autoCommit: true });
    query = `
    SELECT *
    FROM PRODUS
    `;
    let result = await makeSelect(query)   
    let columnNames = result.metaData.map(col => col.name)
    let response = {'columnNames': columnNames, 'rows': result.rows}
    if (result != undefined) {
        res.json(response);
    } else {
        console.error(err);
        res.status(500).send('Eroare la executarea interogării.');
    } 
})

app.get("/cerintaE/dupa", async (req, res) => {
    let query = `
    DELETE FROM SECTOR WHERE id_sector = 1
    `
    const connection = await oracledb.getConnection(dbConfig); 
    await connection.execute(query, [], { autoCommit: true });
    query = `
    SELECT *
    FROM PRODUS
    `;
    let result = await makeSelect(query)   
    let columnNames = result.metaData.map(col => col.name)
    let response = {'columnNames': columnNames, 'rows': result.rows}
    if (result != undefined) {
        res.json(response);
    } else {
        console.error(err);
        res.status(500).send('Eroare la executarea interogării.');
    } 
})

app.get("/getProdusComanda", async (req, res) => {
    const query = `
    SELECT * FROM produs_comanda where id_produs = 10001
    `;
    let result = await makeSelect(query)   
    let columnNames = result.metaData.map(col => col.name)
    let response = {'columnNames': columnNames, 'rows': result.rows}
    if (result != undefined) {
        res.json(response);
    } else {
        console.error(err);
        res.status(500).send('Eroare la executarea interogării.');
    } 
})

app.get("/view1", async (req, res) => {
    const connection = await oracledb.getConnection(dbConfig); 
    let query = `
    SELECT * FROM produse_comanda_popa
    `;
    let result;

    try {
        // Rulează prima interogare
        let result = await makeSelect(query);

        if (result !== undefined) {
            let insertQuery = `
                INSERT INTO produse_comanda_popa (id_produs, id_comanda, numar)
                VALUES (10001, 10, 2)
            `;
            await connection.execute(insertQuery, [], { autoCommit: true });
        }
    
        // Trimite rezultatele interogării SELECT către client
        let columnNames = result.metaData.map(col => col.name)
        let response = {'columnNames': columnNames, 'rows': result.rows}
        res.json(response);

    } catch (err) {
        // Gestionează erorile din orice etapă a procesului
        console.error(err);
        res.status(500).send({ error: 'A apărut o eroare.' });
    }

})

app.get("/view2", async (req, res) => {
    const query = `
    SELECT * FROM top_angajati_per_sector
    `;
    let result = await makeSelect(query)   
    let columnNames = result.metaData.map(col => col.name)
    let response = {'columnNames': columnNames, 'rows': result.rows}
    if (result != undefined) {
        res.json(response);
    } else {
        console.error(err);
        res.status(500).send('Eroare la executarea interogării.');
    } 
})

//////////////////////////////////////////////
app.delete('/sector/:id', async (req, res) => {
    const sectorId = req.params.id;
  
    let connection;
  
    try {
      // Conectare la baza de date
      connection = await oracledb.getConnection(dbConfig); 
      
      // Începem o tranzacție pentru a ne asigura că ștergerea se face corect
      await connection.execute('BEGIN');
      
      // Ștergerea sectorului (aceasta va șterge automat produsele asociate datorită ON DELETE CASCADE)
      const result = await connection.execute(
        `DELETE FROM Sector WHERE id_sector = :id`,
        [sectorId]
      );
  
      // Confirmăm tranzacția
      await connection.execute('COMMIT');
  
      res.status(200).json({ message: 'Sectorul și produsele asociate au fost șterse cu succes!' });
    } catch (err) {
      // Dacă apare o eroare, facem rollback
      if (connection) {
        await connection.execute('ROLLBACK');
      }
      console.error(err);
      res.status(500).json({ error: 'A apărut o eroare la ștergerea sectorului.' });
    } finally {
      if (connection) {
        await connection.close();
      }
    }
  });

//////////////////////////////////////////////////////////////////////////////////////////

    

    app.get("/", function (req, res) {
        res.sendFile(__dirname + "/public/index.html");
      });

    // Pornește serverul
    app.listen(port, () => {
        console.log(`Serverul rulează pe http://localhost:${port}`);
    });

////////////////////////////////////////////////////////////////////////////////////////