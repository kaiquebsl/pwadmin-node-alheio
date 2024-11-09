/*
const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');

 router.route('/login')
 .post(userController.handleLogin);

 router.route('/users/:userId')
     .put(userController.handleUserAlteration)
     .get(userController.showUserInfo)
     .delete(userController.handleUserDeletion);


module.exports = system;
     */

const express = require('express');
const systemController = require('../controller/systemController');
const router = express.Router();

router.route('/memory-usage').get(systemController.getMemoryUsagePercentage);
router.route('/startserver').get(systemController.handleServerStart);
router.route('/stopserver').get(systemController.handleServerStop);

router.route('/process-memory-usage').get(systemController.handleMemoryUsage);
router.route('/instances')
.get(systemController.getActiveInstances)
.post(systemController.handleInstanceStart)
.delete(systemController.handleInstanceStop);
  

module.exports = router;
