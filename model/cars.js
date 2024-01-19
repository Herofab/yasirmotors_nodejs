const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const carsSchema = new Schema({
  engine_number: {
    type: String
  },
  title: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: ''
  },
  images: [{
    type: String,
  }],
  engine_power: {
    type: String
  }, 
  type: {
    type: String
  },
  seat3: {
    type: String
  },
  seat4: {
    type: String
  },
  seat5: {
    type: String
  },
  seat6: {
    type: String
  },
  otherseat: {
    type: String
  },

  color1: {
    type: String
  },
  color2: {
    type: String
  },
  color3: {
    type: String
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: String
  }, 
   category: {
    type: String
  },
    subcategory: {
    type: String
  }, 
  childsubcategory: {
    type: String
  }, 
   product_status: {
    type: String
  },
    old_price: {
    type: String
  }, 
   new_price: {
    type: String
  }, 
  price: {
    type: String,
    required: true,
  },
  discount: {
    type: String
  },
   reviews: {
    type: Array,
  },
  transmition:{
    type:String,
  }
 
},
{ 
  timestamps: true ,
}
);

module.exports = mongoose.model("Car", carsSchema);