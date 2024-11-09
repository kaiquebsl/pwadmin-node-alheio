const express = require('express');
const router = express.Router();
const userController = require('../controller/usersController.js');

router.route('/listacontas').get(userController.handleListAccounts);

router.route('/cadastrar').post(userController.handleUserInsertion);

router.route('/listusers').get(userController.getCharacterList);

router.route('/gm')
.post(userController.addGMaccount)
.delete(userController.removeGMaccount);

router.route('/addcash').post(userController.addcash);


//router.route('/deleterole').post(userController.deleteRole);

module.exports = router;