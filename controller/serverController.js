const { exec } = require('child_process');
const db = require('../model/sqlserver');
const net = require('net');
const express = require('express');
const fs = require('fs');
const readline = require('readline');
const { WritePacket, ReadPacket } = require ('../model/PacketModel.js');
const { sysMailScheme } = require('../scheme/mailScheme.js');


const sendChatMessage = async (req, res) => {
    const {message} = req.body;
    if(!message) res.status(400).json({'message': 'campo obrigatório não preenchido'});
    const packet = new WritePacket(29300);
    packet.WriteUByte(9);
    packet.WriteUByte(0); 
    packet.WriteUInt32();
    packet.WriteString(message);
    packet.WriteOctets("");
    packet.Pack(0x78);
    await packet.Send();
    console.log("Enviado broadcast ao servidor: ", message);
    res.status(200).json({'message':'sucesso'});
}

//preicsa ser reimplementado
const getChatLogs = async (req, res) => {
    try {
        const chatLogFile = '/home/logs/world2.chat';
        const fileStream = fs.createReadStream(chatLogFile, { encoding: 'utf-8' });

        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });

        const messages = [];

        rl.on('line', (line) => {
            const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
            const srcMatch = line.match(/src=(\d+)/);
            const chlMatch = line.match(/chl=(\d+)/);
            const msgBase64Match = line.match(/msg=([A-Za-z0-9+/=]+)/);
            const dstMatch = line.match(/dst=(\d+)/);

            if (timestampMatch && srcMatch && msgBase64Match) {
                const timestamp = timestampMatch[1];
                const src = srcMatch[1];
                const msgBase64 = msgBase64Match[1];
                const dst = dstMatch ? dstMatch[1] : null;
                let chl = chlMatch ? chlMatch[1] : 'default';
               
                
                const cleanedMsgBase64 = Buffer.from(msgBase64, 'base64').toString('utf-8');

                const msg = cleanedMsgBase64.replace(/\\u[0-9a-fA-F]{4}/g, '');
                if(chl === 'default'){
                    if(line.includes('Guild:')){
                        chl = '28';
                    }else if(line.includes('Whisper:')){
                        chl = '29'; // add dst= 
                    }
                }

                    messages.push({
                        timestamp,
                        src,
                        chl,
                        msg,
                        dst,
                    });
            }
        });

        rl.on('close', () => {
            res.status(200).json(messages);
        });

    } catch (err) {
        console.error('Erro: ', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const sendSysMail = async (req, res) => {
    let {receiver, title, message, itemid, itemcount, maxcount, octet, gold, mask} = req.body;
    if(!receiver) return res.status(400).json({'message':'destinatário não especificado'});
    if(!title){
        title = "Mensagem do sistema";
    }
    if(!message) message = " ";
    if(!itemid){
        itemid = 0;
        itemcount = 0;
        maxcount = 0;
        octet = "";
        mask = 0;
    }
    if(!gold){
        gold = 0;
    }
    let data;

    this.data = {
        sysMsg: {
            tid:344,
            sender_id: 32,
            sys_type: 3,
            target_id: receiver,
            title: title,
            message: message,
            item_id: itemid, //getRoleInventory
            pos: 0,
            count: itemcount,
            max_count: maxcount,
            octet: octet,
            proctype: 0,
            expire: 0,
            guid1: 0,
            guid2: 0,
            mask: mask,
            gold: gold
        }
    }

    const packet = new WritePacket(sysMailScheme);
    const response = await packet.PackAll({sys: this.data.sysMsg});
    res.status(200).json({'message':'sucess'});
    return response;
}

module.exports = {
    sendChatMessage,
    sendSysMail,
    getChatLogs,
    };