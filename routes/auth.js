const express = require('express');
const { 
  register, 
  login, 
  getMe, 
  updateProfile, 
  changePassword, 
  updateProgressStats 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);
router.put('/progress', protect, updateProgressStats);

module.exports = router;
