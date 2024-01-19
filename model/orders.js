const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const order_detail = new Schema({
  // Add this field to your Order schema
shortId: {
  type: String,
  unique: true
},
  email: {
    type: String,
  },
  car_detail: [{
    engine_number: String,
    title: String,
    price: Number,
    color1: String,
    brand: String,
    image: String,
    quantity:String,
    // other fields...
   }],
  firstname:{
    type: String,
  },
  lastname:{
    type: String,
  },
  address1: {
    type: String,
  },
  address2: {
    type: String,
  },
  fromdate: {
    type: Date,
    
  },
  todate: {
    type: Date,
    
  },
  quantity: {
    type: String,
    
  },
  city: {
    type: String,
  },
  card_number:{
    type:String,
  },
  phone: {
    type: String,
  },
  phone2:{
    type: String,
  },
  status: {
    type: String,
    default: 'pending' // Add this line
  },
  notification: {
    type: String,
  },
 
  Total_price: {
    type: String,
  },
},
{ 
  timestamps: true ,
}

);

module.exports = mongoose.model("Order", order_detail);