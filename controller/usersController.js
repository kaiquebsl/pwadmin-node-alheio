const db = require('../model/sqlserver');
const { bus } = require('nodemon/lib/utils');
const { exec } = require('child_process');
const crypto = require('crypto');
const iconv = require('iconv-lite');
const md5 = require('md5');
const net = require('net');
const { WritePacket, ReadPacket } = require('../model/PacketModel.js');
const { userInfoScheme, userRoleListScheme, getRoleScheme, putRoleScheme } = require('../scheme/userScheme.js');

function pw_encode(login, password) { //versão md5
    const hash = `0x${md5(login + password)}`;
    return hash
}

function pw_encode64(login, password) {
    const md5hashed = crypto.createHash('md5').update(login + password).digest('hex');
    const buffer = Buffer.from(md5hashed, 'hex');
    const base64encoded = buffer.toString('base64');
    return base64encoded;
}

const handleListAccounts = async (req, res) => {
    const sqlSearch = 'SELECT * FROM users';

    db.query(sqlSearch, async (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erro ao buscar contas' });
        }

        const accounts = [];

        for (const item of result) {
            const userId = item.ID;

            // Consulta adicional na tabela "auth" para verificar se o ID existe
            const sqlCheckGM = 'SELECT COUNT(*) AS count FROM auth WHERE userid = ?';
            const [gmResult] = await db.promise().query(sqlCheckGM, [userId]);
            const isGM = gmResult[0].count > 0;

            // adiciona agora a flag isGM pra adicionar o icone no front
            accounts.push({ id: userId, name: item.name, email: item.email, isGM });
        }

        res.json(accounts);
    });
};

const handleNumberRegistered = async (req, res) => {
    const sqlSearch = (`SELECT * FROM users`);
    db.query(sqlSearch, async (err, result) => {
        res.json(result.length);
    })
} //não usada no momento

const addGMaccount = (req, res) => { //re-fazer para não usar a procedure, mapear as permissões certas na table pra controlar permissões
    const { userid } = req.body;
    //console.log(req.body);
    if (!userid) return res.status(400).json({ 'message': 'erro: usuário não especificado' });
    const sqlSearch = (`SELECT * FROM users WHERE ID = ?`);
    db.query(sqlSearch, [userid] , async (err, result) => {
        if (err) throw (err)
        //console.log(result.length);
        if (result.length = 0) {
            res.status(400).json({ 'message': 'erro: usuário não existe' })
        } else {
            try {
                const isalreadygm = (`SELECT * FROM auth WHERE userid = ?`);
                db.query(isalreadygm, [userid] , async (err, gmstatus) => {
                    if (err) throw (err)
                    console.log(err);
                    if (gmstatus.length != 0) {
                        res.status(500).json({ 'message': 'user already GM' });
                    } else {
                        const callProcedureQuery = 'CALL addGM(?, ?)';

                        db.query(callProcedureQuery, [userid, 1], (err) => {
                            if (err) {
                                console.error(err);
                                res.status(500).json({ 'message': 'Erro ao chamar a stored procedure' });
                            } else {
                                res.status(200).json({ 'message': 'GM roles added successfully' });
                            }
                        });
                    }
                })
            } catch (err) {
                res.status(500).json(err);
            }
        };
    })
}

const removeGMaccount = (req, res) => {
    const { userid } = req.body;

    if (!userid) return res.status(400).json({ 'message': 'Erro: usuário não especificado' });

    const deleteQuery = 'DELETE FROM auth WHERE userid = ?';

    // Executar a query para remover os registros da tabela "auth" para o usuário especificado
    db.query(deleteQuery, [userid], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ 'message': 'Erro ao remover GM roles' });
        }
        if (result.affectedRows > 0) {
            res.status(200).json({ 'message': 'GM roles removidas com sucesso' });
        } else {
            res.status(404).json({ 'message': 'Nenhuma GM role encontrada para o usuário especificado' });
        }
    });
};


const addcash = (req, res) => { //modificar, mudar de name para ID
    //NÃO FUNCIONA CORRETAMENTE, MUDAR PARA ENVIAR PACOTES AO GAMEDBD OU GAMESYS (http://pwdev.ru/index.php/AddCash)
    console.log("Requisição recebida: " + req.body.toString);
    const { id, cash } = req.body;
    if (!id || !cash) return res.status(400).json({ 'message': 'erro, campos obrigatórios não preenchidos' });
    const sqlSearch = (`SELECT * FROM users WHERE ID = ?`);
    console.log("User id:" + id);
    db.query(sqlSearch, [id] , async (err, result) => {
        if (err) throw (err)
        console.log(result.length);
        if (result.length != 0) {
            try {
                const userid = id; //não pergunte pq
                console.log("uid: " + userid);
                const usecash = (`CALL usecash(?,1,0,1,0,?,1,@error)`);
                db.query(usecash, [userid, cash], (err) => {
                    if (err) {
                        console.log(err.message);
                    } else {
                        res.status(200).json({ 'message': 'cash adicionado com sucesso, pode demorar até 5 minutos para chegar' });
                    }
                })
            } catch (err) {
                res.status(500).json(err.message);
            }
        } else {
            res.status(400).json({ 'message': 'o usuário não existe' });
        }
    })
}

const handleUserInsertion = async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !password) return res.status(400).json({ 'message': 'Erro, campos obrigatórios não preenchidos' });

    try {
        const [maxIdRow] = await db.promise().query('SELECT MAX(ID) as maxId FROM users');
        const maxId = maxIdRow[0].maxId || 0;
        const nextId = maxId + 16;
        const hashedPassword = pw_encode64(name, password);
        //console.log(hashedPassword);

        let insertUser;
        let newUser;

        if (email !== undefined && email !== null) {//tratar registro sem e-mail (registro pelo painel admin)
            insertUser = `INSERT INTO users(ID, name, email) VALUES(?, ?, ?)`;
            newUser = [nextId, name, email];
        } else {
            insertUser = `INSERT INTO users(ID, name) VALUES(?, ?)`;
            newUser = [nextId, name];
        }

        db.query(insertUser, newUser, (err, results, fields) => {
            if (err) {
                console.error(err);
                res.status(500).json({ 'message': 'Erro ao inserir usuário' });
                return;
            }

            res.status(201).json({ 'id': results.ID, 'name': name, 'email': email });

            const updateQuery = 'UPDATE `users` SET `passwd2`=`passwd` WHERE `name`=?'; //permite recuperação de senha
            db.query(updateQuery, [name], (err, results) => {
                if (err) throw err;
                const callProcedureQuery = "CALL changePasswd('" + name + "','" + hashedPassword + "')";
                db.query(callProcedureQuery, [name, hashedPassword], (err, results) => {
                    if (err) throw err;
                    // console.log(results);
                    // console.log('passwd changed')
                });
            });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ 'message': 'Erro ao processar a inserção do usuário' });
    }
};



class RoleController {//re-fazer muita coisa porém funciona
    constructor() {
        this.roleId = null;
        this.data = {
            role: null,
        };
    }

    async load(id) {
        try {
            this.roleId = id;
            let results = [];
            const packet = new WritePacket(getRoleScheme);
            packet.WriteUInt32(-1);
            packet.WriteUInt32(this.roleId); // roleId
            //packet.Pack(0xBC5); // pack opcode and length
            packet.Pack(0x1F43);
            // console.log("antes do request");
            const role = await packet.Request();
            // console.log("depois do request");
            this.data.role = role;
            console.log(role);
            //results[0] = role.base.name;
            //results[1] = role.base.cls;
            
            return role;
        } catch {
            return "sem conexão";
        }
    }

    async delete() { //corrigir
        if (!this.roleId) {
          return;
        }
        const packet = new WritePacket(29100);
        packet.WriteUInt32(this.roleId);
        packet.WriteUInt32(-1);
        packet.Pack(0x56);
        packet.Send();
      }

    async save() {
        if (!this.data.role) {
          return console.warn('Missing id or data!');
        }
    
        const packet = new WritePacket(putRoleScheme);
        packet.WriteUInt32(-1); 
        packet.WriteUInt32(this.roleId);
        packet.WriteUByte(1); 
        packet.PackAll(this.data.role);
      }

}



const getCharacterList = async (req, res) => {
    const command = 'cd /home/gamedbd/ && ./gamedbd gamesys.conf listrolebrief'; //permitir caminhos dinâmicos

    exec(command, async (error, stdout, stderr) => {
        if (error) {
            console.error(`Erro ao obter a lista de personagens: ${error.message}`);
            res.status(500).json({ message: 'Erro ao obter a lista de personagens' });
            return;
        }

        // const roleController = new RoleController();
        // const accountName = await roleController.load(1041);
        // console.log(accountName);
        try {
            const lines = stdout.trim().split('\n');
            const characters = await Promise.all(lines.map(async (line) => {
                const [charId, accountId, , , level, experience] = line.split(',');
                if (charId >= 1024) {
                    const roleController = new RoleController();
                    const accountName = await roleController.load(parseInt(charId));
                    // console.log("account name lenght:" + accountName);
                    if (accountName.length != 0) {
                        console.log(accountName.length);
                        console.log(accountName.base.name);
                        console.log(accountName.base.cls);
                        return {
                            characterId: parseInt(charId),
                            accountId: parseInt(accountId),
                            accountName: accountName.base.name,
                            race: accountName.base.cls,
                            level: parseInt(level),
                            experience: parseInt(experience),
                        };
                    }
                }
            }));
            const filteredCharacters = characters.filter((character) => character && character.characterId >= 1024);
            res.status(200).json(filteredCharacters);
        } catch (err) {
            res.status(500).json({ 'message': err });
        }



    });
};



module.exports = {
    handleNumberRegistered,
    handleUserInsertion,
    handleListAccounts,
    getCharacterList,
    removeGMaccount,
    addGMaccount,
    addcash,

}