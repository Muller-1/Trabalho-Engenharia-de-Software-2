const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'sua-chave-secreta';

// Configuração do PostgreSQL
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Site Jiu Jitsu',
    password: '123456',
    port: 5432,
});

app.use(cors());
app.use(express.json());

// Servindo a página de login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Login.html'));
});

// Rota de registro
app.post('/api/register', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') {
        return res.status(403).send({ message: 'Acesso negado. Apenas administradores podem criar novos usuários.' });
    }
    
    const { username, password } = req.body; 

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length > 0) {
            return res.status(409).send({ message: 'Usuário já existe.' });
        }

        const passwordHash = bcrypt.hashSync(password, 8);
        
        await pool.query('INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)', [username, passwordHash, 'user']);

        res.status(201).send({ message: 'Novo usuário registrado com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Erro no servidor.' });
    }
});

// Rota de login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(401).send({ message: 'Credenciais inválidas.' });
        }

        const user = result.rows[0];
        const passwordIsValid = bcrypt.compareSync(password, user.password_hash);

        if (!passwordIsValid) {
            return res.status(401).send({ message: 'Credenciais inválidas.' });
        }

        const token = jwt.sign(
            { id: user.username, role: user.role },
            SECRET_KEY,
            { expiresIn: 86400 }
        );

        res.status(200).send({ auth: true, token: token, role: user.role });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Erro no servidor.' });
    }
});

app.post('/api/events', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Acesso Negado. Somente para Administradores.' });
    }

    const { event_name, description, start_datetime, end_datetime='' } = req.body;

    try {
        const query = `INSERT INTO events (event_name, description, start_datetime, end_datetime) VALUES ($1, $2, $3, $4) RETURNING *;`;
        const values = [event_name, description, start_datetime, end_datetime];
        const result = await pool.query(query, values);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro Criando Evento:', error);
        res.status(500).json({ message: 'Erro Criando Evento.' });
    }
});

app.put('/api/events/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Acesso Negado. Somente para Administradores.' });
    }

    const { id } = req.params;
    const { event_name, description, start_datetime, end_datetime } = req.body;

    try {
        const query = `UPDATE events SET event_name = $1, description = $2, start_datetime = $3, end_datetime = $4 WHERE id = $5 RETURNING *;`;
        const values = [event_name, description, start_datetime, end_datetime, id];
        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Evento não encontrado.' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Erro atualizando evento:', error);
        res.status(500).json({ message: 'Erro atualizando evento.' });
    }
});

app.delete('/api/events/:id', verifyToken, async (req, res) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Acesso Negado. Somente para Administradores.' });
    }
    
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING *;', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Evento não encontrado.' });
        }

        res.status(200).json({ message: 'Evento deletado com sucesso.' });
    } catch (error) {
        console.error('Erro deletando o evento:', error);
        res.status(500).json({ message: 'Erro deletando o evento.' });
    }
});

// Middleware para verificar o token (não alterado)
function verifyToken(req, res, next) {
    const token = req.headers['x-access-token'];

    if (!token) {
        return res.status(403).send({ auth: false, message: 'Token não fornecido.' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(500).send({ auth: false, message: 'Falha na autenticação do token.' });
        }

        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
}

// Rotas protegidas (não alteradas)
app.get('/api/protected', verifyToken, (req, res) => {
    res.status(200).send({ message: 'Bem-vindo, usuário!', role: req.userRole });
});

app.get('/api/admin', verifyToken, (req, res) => {
    if (req.userRole !== 'admin') {
        return res.status(403).send({ message: 'Acesso negado. Apenas para administradores.' });
    }

    res.status(200).send({ message: 'Bem-vindo, administrador!', role: req.userRole });
});

app.get('/api/events', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM events ORDER BY start_datetime');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erro buscando eventos:', error);
        res.status(500).json({ message: 'Erro buscando eventos.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});