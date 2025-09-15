const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'sua-chave-secreta'; // Substitua por uma chave forte em produção!

app.use(cors());
app.use(express.json()); // Habilita o servidor a receber JSON

// Simulação de banco de dados
const users = [
    { username: 'usuario1', passwordHash: bcrypt.hashSync('senha123', 8), role: 'user' },
    { username: 'admin', passwordHash: bcrypt.hashSync('1234', 8), role: 'admin' },
];

// Rota para a página de login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Login.html'));
});

// Rota de login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username);

    if (!user) {
        return res.status(401).send({ message: 'Credenciais inválidas.' });
    }

    const passwordIsValid = bcrypt.compareSync(password, user.passwordHash);

    if (!passwordIsValid) {
        return res.status(401).send({ message: 'Credenciais inválidas.' });
    }

    const token = jwt.sign(
        { id: user.username, role: user.role }, 
        SECRET_KEY, 
        { expiresIn: 86400 } // Token expira em 24 horas
    );

    res.status(200).send({ auth: true, token: token, role: user.role });
});

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;

    // Verifica se o usuário já existe
    const userExists = users.find(u => u.username === username);
    if (userExists) {
        return res.status(409).send({ message: 'Usuário já existe.' });
    }

    // Cria o novo usuário e o adiciona à "lista de usuários"
    const newUser = {
        username: username,
        passwordHash: bcrypt.hashSync(password, 8),
        role: 'user' // Por padrão, novos usuários são 'user'
    };

    users.push(newUser);
    
    // Opcional: gera um token para logar o usuário automaticamente após o cadastro
    const token = jwt.sign(
        { id: newUser.username, role: newUser.role }, 
        SECRET_KEY, 
        { expiresIn: 86400 }
    );

    res.status(201).send({ auth: true, token: token, role: newUser.role, message: 'Usuário registrado com sucesso!' });
});

// Middleware para verificar o token
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

// Rota protegida para usuários comuns
app.get('/api/protected', verifyToken, (req, res) => {
    res.status(200).send({ message: 'Bem-vindo, usuário!', role: req.userRole });
});

// Rota protegida para administradores
app.get('/api/admin', verifyToken, (req, res) => {
    if (req.userRole !== 'admin') {
        return res.status(403).send({ message: 'Acesso negado. Apenas para administradores.' });
    }

    res.status(200).send({ message: 'Bem-vindo, administrador!', role: req.userRole });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});