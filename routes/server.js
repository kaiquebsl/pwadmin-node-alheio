/*



module.exports = server;
*/

const express = require('express');
const serverController = require('../controller/serverController');
const router = express.Router();

router.route('/sendbroadcast').post(serverController.sendChatMessage);
router.route('/realtimechat').get(serverController.getChatLogs);
router.route('/sendmail').post(serverController.sendSysMail);

module.exports = router;