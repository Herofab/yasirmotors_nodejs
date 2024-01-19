const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  role: {
    type: String,
    enum: ['user', 'admin', 'operator', 'guest'],
    default: 'user'
},
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  firstlogin: {
    type: Boolean,
    default: true,
  },
  activity: {
    type: Array,
  },

},
{ 
  timestamps: true ,
}
);

module.exports = mongoose.model("User", userSchema);
