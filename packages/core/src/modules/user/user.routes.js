// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('./user.controllers');
const authenticateToken = require('../../middlewares/auth.middleware');
const {
  createUserValidator,
  authenticateUserValidator,
  resetPasswordValidator,
  getUserByIdValidator,
  updateUserValidator,
  deleteUserValidator,
  providerSignInValidator,
} = require('./user.validators');

router.post('/register', createUserValidator, userController.createUser);
router.post('/login', authenticateUserValidator, userController.authenticateUser);
router.post('/reset-password/:id', resetPasswordValidator, userController.resetPassword);
router.get('/users', authenticateToken, userController.getUsers);
router.get('/users/:id', authenticateToken, getUserByIdValidator, userController.getUserById);
router.put('/users/:id', authenticateToken, updateUserValidator, userController.updateUser);
router.delete('/users/:id', authenticateToken, deleteUserValidator, userController.deleteUser);
router.post('/provider', providerSignInValidator, userController.continueWithProvider);
module.exports = router;
