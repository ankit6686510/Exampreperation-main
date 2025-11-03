const express = require('express');
const { 
  register, 
  login, 
  refreshToken,
  logout,
  getMe, 
  updateProfile, 
  changePassword, 
  updateProgressStats 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authValidations } = require('../middleware/validation');

const router = express.Router();

router.post('/register', authValidations.register, register);
router.post('/login', authValidations.login, login);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, authValidations.updateProfile, updateProfile);
router.put('/password', protect, authValidations.changePassword, changePassword);
router.put('/progress', protect, updateProgressStats);

module.exports = router;
