const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
  // Define your guest fields here
  
  username: String,
  role: String,
  email: String,
  phone: String,
  password: String,
  // etc.
});

const notificationSchema = new mongoose.Schema({
  guestId: mongoose.Schema.Types.ObjectId,
  message: String,
  status: String,
});

const Guest = mongoose.model('Guest', guestSchema);
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = { Guest, Notification };